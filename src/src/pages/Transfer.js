var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Invoice = module.exports = {

  controller: function () {
    var ctrl = this;

    //return phone in pattern or prefix
    this.getPhoneWithViewPattern = function (number) {
      if (number.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix) {
        number = Conf.phone.prefix;
      }
      return m.prop(VMasker.toPattern(number, {pattern: Conf.phone.view_mask, placeholder: "x"}));
    }

    this.addPhoneViewPattern = function (e) {
      ctrl.infoPhone = ctrl.getPhoneWithViewPattern(e.target.value);
    };

    this.infoAsset = m.prop(m.prop(m.route.param('asset') ? m.route.param('asset') : ''));
    this.infoAmount = m.prop(m.route.param("amount") ? m.route.param("amount") : '');
    this.infoAccount = m.prop(m.route.param("account") ? m.route.param("account") : '');
    this.infoPhone = ctrl.getPhoneWithViewPattern(Conf.phone.prefix);
    this.transferType = m.prop((m.route.param("type") == 1) ? 'byAccount' : 'byAccount'); //TODO change when types stay > 1
    this.infoMemo = m.prop(m.route.param("memo") ? m.route.param("memo") : 'by_account');

    if (!Auth.exists()) {
      return m.route('/');
    }

    this.changeTransferType = function (e) {
      e.preventDefault();
      m.startComputation();
      this.transferType(e.target.value);
      this.infoAccount = m.prop('');
      this.infoPhone = ctrl.getPhoneWithViewPattern(Conf.phone.prefix);
      switch (e.target.value) {
        case 'byAccount':
          this.infoMemo('by_account');
          break;
        case 'byPhone':
          this.infoMemo('by_phone');
          break;
        default:
          this.infoMemo('');
      }
      m.endComputation();
    }

    this.getInvoice = function (e) {
      e.preventDefault();

      m.onLoadingStart();

      Conf.invoiceServer.getInvoice({
        id: e.target.code.value,
        accountId: Auth.keypair().accountId()
      })
          .then(response => {
            var allow_inv = false;
            Auth.balances().map(function (b) {
              if (b.asset == response.asset) {
                allow_inv = true;
              }
            })

            if (!allow_inv) {
              $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Invalid invoice currency"));
              return;
            }

            m.startComputation();
            this.infoAsset(response.asset); // TODO: add this to form
            this.infoAmount(response.amount);
            this.infoAccount(response.account);
            this.transferType('byAccount');

            if (typeof response.memo != 'undefined' && response.memo.toString().length > 0
                && response.memo.toString().length <= 14
            ) {
              this.infoMemo(response.memo.toString());
            } else {
              this.infoMemo('by_invoice');
            }
            m.endComputation();

            // Clear input data
            e.target.code.value = '';

            $.Notification.notify('success', 'top center', Conf.tr("Success"), Conf.tr("Invoice requested"));
          })
          .catch(err => {
            $.Notification.notify('error', 'top center', Conf.tr("Error"), err.name + ((err.message) ? ': ' + err.message : ''));
          })
          .then(() => {
            m.onLoadingEnd();
          })
    }

    this.processPayment = function (e) {
      e.preventDefault();

      e.target.phone.value = VMasker.toPattern(e.target.phone.value, Conf.phone.db_mask)
      e.target.phone.value = e.target.phone.value.substr(2);
      //validate phone
      if (e.target.phone.value.length > 0 && e.target.phone.value.match(/\d/g).length != Conf.phone.length) {
        return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Invalid phone"));
      }

      var phoneNum = e.target.phone.value;
      var accountId = e.target.account.value;
      var memoText = e.target.memo.value.replace(/<\/?[^>]+(>|$)/g, ""); //delete html tags from memo
      var error = false;

      if (this.transferType() == 'byPhone') {

        var formData = new FormData();
        formData.append("phone", phoneNum);
        memoText = 'by_phone';

        try {
          var xhr = new XMLHttpRequest();
          xhr.open("POST", Conf.keyserver_host + Conf.keyserver_v_url + '/get_wallet_data', false); // false for synchronous request
          xhr.send(formData);

          var response = JSON.parse(xhr.responseText);

          if (response.status == 'fail') {
            switch (response.code) {
              case 'not_found':
                return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("User not found! Check phone number"));
              default:
                return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Connection error"));
            }
          }

          accountId = response.accountId;

        } catch (e) {
          return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Connection error"));
        }
      }

      if (!StellarSdk.Keypair.isValidPublicKey(accountId)) {
        return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Account is invalid"));
      }

      if (accountId == Auth.keypair().accountId()) {
        return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("You cannot send money to yourself"));
      }

      var amount = parseFloat(e.target.amount.value);
      if (!amount) {
        return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Amount is invalid"));
      }

      if (memoText.length > 14) {
        return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Memo text is too long"));
      }

      m.startComputation();
      m.onLoadingStart();

      return Auth.loadAccountById(accountId)
          .then(source => {
            if (source.type == 'distribution_agent') {
              return $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Can't send money to distribution agent!"));
            }

            return Conf.horizon.loadAccount(Auth.keypair().accountId())
          })
          .then(function (source) {
            var memo = StellarSdk.Memo.text(memoText);
            var tx = new StellarSdk.TransactionBuilder(source, {memo: memo})
                .addOperation(StellarSdk.Operation.payment({
                  destination: accountId,
                  amount: amount.toString(),
                  asset: new StellarSdk.Asset(e.target.asset.value, Conf.master_key)
                }))
                .build();

            tx.sign(Auth.keypair());

            return Conf.horizon.submitTransaction(tx);
          })
          .then(function () {
            $.Notification.notify('success', 'top center', Conf.tr("Success"), Conf.tr("Transfer successful"));
          })
          .catch(function (err) {
            $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Cannot make transfer"));
            console.log(err);
          })
          .then(function () {
            ctrl.infoAsset('');
            ctrl.infoAmount('');
            ctrl.infoAccount('');
            ctrl.infoPhone('');

            m.onLoadingEnd();
            m.endComputation();
          });

    }

  },

  view: function (ctrl) {
    return [m.component(Navbar),
      <div class="wrapper">
        <div class="container">
          <div class="row">
            <h2>{Conf.tr("Transfer")}</h2>
            <form class="col-sm-4" onsubmit={ctrl.processPayment.bind(ctrl)}>
              <div class="panel panel-primary">
                <div class="panel-heading">{Conf.tr("Transfer money")}</div>
                <div class="panel-body">
                  <div class="form-group">
                    <label>{Conf.tr("Transfer type")}</label>
                    <select name="transType" required="required" class="form-control"
                            onchange={ctrl.changeTransferType.bind(ctrl)}
                            value={ctrl.transferType()}
                    >
                      <option value="byAccount">{Conf.tr("by account ID")}</option>
                      <option value="byPhone">{Conf.tr("by phone")}</option>
                    </select>
                  </div>
                  <div class="form-group"
                       class={(ctrl.transferType() != 'byAccount') ? 'hidden' : ''}>
                    <label>{Conf.tr("Account ID")}</label>
                    <input name="account"
                           oninput={m.withAttr("value", ctrl.infoAccount)} pattern=".{56}"
                           title={Conf.tr("Account ID should have 56 symbols")}
                           class="form-control"
                           value={ctrl.infoAccount()}/>
                  </div>
                  <div class="form-group"
                       class={(ctrl.transferType() != 'byPhone') ? 'hidden' : ''}>
                    <label>{Conf.tr("Phone number")}</label>
                    <input name="phone"
                           class="form-control"
                           placeholder={Conf.phone.view_mask}
                           oninput={ctrl.addPhoneViewPattern.bind(ctrl)}
                           value={ctrl.infoPhone()}/>
                  </div>
                  <div class="form-group">
                    <label>{Conf.tr("Amount")}</label>
                    <input name="amount" required="required"
                           oninput={m.withAttr("value", ctrl.infoAmount)}
                           class="form-control"
                           value={ctrl.infoAmount()}/>
                  </div>
                  <div class="form-group">
                    <label>{Conf.tr("Asset")}</label>
                    <select name="asset" required="required" class="form-control">
                      {Auth.balances().map(function (b) {
                        return <option value={b.asset}>{b.asset}</option>
                      })}
                    </select>
                  </div>
                  <div class="form-group">
                    <label>{Conf.tr("Memo message")}</label>
                    <input name="memo"
                           size="14" maxlength="14"
                           disabled="disabled"
                           oninput={m.withAttr("value", ctrl.infoMemo)}
                           class="form-control"
                           value={ctrl.infoMemo()}/>
                  </div>
                  <div class="form-group">
                    <button class="btn btn-primary">{Conf.tr("Transfer")}</button>
                  </div>
                </div>
              </div>
            </form>
            <form class="col-sm-4" onsubmit={ctrl.getInvoice.bind(ctrl)}>
              <div class="panel panel-primary">
                <div class="panel-heading">{Conf.tr("Request invoice")}</div>
                <div class="panel-body">
                  <div class="form-group">
                    <label>{Conf.tr("Invoice code")}</label>
                    <input type="number" name="code" required="required" class="form-control"/>
                  </div>
                  <div class="form-group">
                    <button class="btn btn-primary">{Conf.tr("Request")}</button>
                  </div>
                </div>
              </div>
            </form>
            <div class="clearfix"></div>
          </div>
        </div>
      </div>
    ];
  }

};
