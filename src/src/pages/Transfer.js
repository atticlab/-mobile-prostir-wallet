var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Invoice = module.exports = {

  controller: function () {
    var ctrl = this;

    this.infoAsset    = m.route.param("asset") ? m.prop(m.route.param("asset")) : m.prop('');
    this.infoAmount   = m.route.param("amount") ? (m.prop(m.route.param("amount")/100)) : m.prop('');
    this.infoAccount  = m.route.param("account") ? m.prop(m.route.param("account")) : m.prop('');
    this.infoPhone = m.prop('');
    this.transferType = m.prop('byAccount');
    this.infoMemo = m.prop('by_account');

    if (!Auth.exists()) {
      return m.route('/');
    }

    this.changeTransferType = function (e) {
      e.preventDefault();
      m.startComputation();
      this.transferType(e.target.value);
      this.infoAccount = m.prop('');
      this.infoPhone = m.prop('');
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

      var code = e.target.code.value ? e.target.code.value.toString() : null;
      if (!code || code.length != 6) {
        $.Notification.notify('error', 'top center', 'Error', 'Invalid invoice code');
        return;
      }

      var formData = new FormData();
      formData.append("id", code);
      formData.append("account", Auth.keypair().accountId());

      m.onLoadingStart();

      try {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", Conf.invoice_host + Conf.invoice_get_url, false); // false for synchronous request
        xhr.send(formData);
        var response = JSON.parse(xhr.responseText);
        if (response.error) {
          switch (response.error) {
            case 'Invalid invoice id':
            case 'no invoice':
              $.Notification.notify('error', 'top center', 'Error', 'Invalid invoice code');
              break;
            case 'invoice already requested':
              $.Notification.notify('error', 'top center', 'Error', 'Invalid already requested');
              break;
            default:
              $.Notification.notify('error', 'top center', 'Error', 'Network error');
              break;
          }

          m.onLoadingEnd();
          return;
        }

      } catch (e) {
        $.Notification.notify('error', 'top center', 'Error', 'Network error');
      }

      m.onLoadingEnd();

      var allow_inv = false;
      Auth.balances().map(function (b) {
        if (b.asset == response.asset) {
          allow_inv = true;
        }
      })

      if (!allow_inv) {
        $.Notification.notify('error', 'top center', 'Error', 'Invalid invoice currency');
        return;
      }

      m.startComputation();
      this.infoAsset(response.asset); // TODO: add this to form
      this.infoAmount(response.amount / 100);
      this.infoAccount(response.account);
      m.endComputation();

      // Clear input data
      e.target.code.value = '';

      $.Notification.notify('success', 'top center', 'Success', 'Invoice requested');
    }

    this.processPayment = function (e) {
      e.preventDefault();
      var phoneNum = e.target.phone.value;
      var accountId = e.target.account.value;
      var memoText = e.target.memo.value.replace(/<\/?[^>]+(>|$)/g, ""); //delete html tags from memo
      var error = false;

      if (this.transferType() == 'byPhone') {
        var formData = new FormData();

        formData.append("phone", phoneNum);

        try {
          var xhr = new XMLHttpRequest();
          xhr.open("POST", Conf.keyserver_host + Conf.keyserver_v_url + '/get_wallet_data', false); // false for synchronous request
          xhr.send(formData);

          var response = JSON.parse(xhr.responseText);
          if (response.status == 'fail') {
            switch (response.code) {
              case 'not_found':
                $.Notification.notify('error', 'top center', 'Error', 'User not found! Check phone number.');
                error = true;
                break;
              default:
                $.Notification.notify('error', 'top center', 'Error', 'Network error');
                error = true;
                break;
            }

            return;
          }
          accountId = response.accountId;
          if (!StellarSdk.Keypair.isValidPublicKey(accountId)) {
            $.Notification.notify('error', 'top center', 'Error', 'Account is invalid');
            error = true;
            return;
          }
          memoText = 'by_phone';
        } catch (e) {
          $.Notification.notify('error', 'top center', 'Error', 'Network error');
          error = true;
          m.onLoadingEnd();
        }
      }
      if ((memoText != 'by_phone') && (!StellarSdk.Keypair.isValidPublicKey(accountId))) {
        $.Notification.notify('error', 'top center', 'Error', 'Account is invalid');
        error = true;
        return;
      }

      var amount = parseFloat(e.target.amount.value);
      if (!amount) {
        $.Notification.notify('error', 'top center', 'Error', 'Amount is invalid');
        error = true;
        return;
      }

      if (memoText.length > 14) {
        $.Notification.notify('error', 'top center', 'Error', 'Memo text is too long');
        error = true;
        return;
      }

      if (!error) {
        m.startComputation();
        m.onLoadingStart();

        Conf.horizon.loadAccount(Auth.keypair().accountId())
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
              var transaction = Conf.horizon.submitTransaction(tx)
                  .then(function () {
                    $.Notification.notify('success', 'top center', 'Success', 'Transfer successful');
                    ctrl.infoAsset('');
                    ctrl.infoAmount('');
                    ctrl.infoAccount('');
                    ctrl.infoPhone('');
                    ctrl.transferType('byAccount');
                    ctrl.infoMemo('');

                    m.onLoadingEnd();
                    m.endComputation();
                  })
                  .catch(function (err) {
                    $.Notification.notify('error', 'top center', 'Error', 'Cannot make transfer');
                    console.log(err);
                    m.onLoadingEnd();
                    m.endComputation();
                  }).then(function () {
                    ctrl.infoAsset('');
                    ctrl.infoAmount('');
                    ctrl.infoAccount('');
                    ctrl.infoPhone('');
                    ctrl.transferType('byAccount');
                    ctrl.infoMemo('');

                    m.onLoadingEnd();
                    m.endComputation();
                  });

              transaction.on();
            }).catch(function (err) {
          $.Notification.notify('error', 'top center', 'Error', 'Network error');
          console.log(err);
          m.onLoadingEnd();
          m.endComputation();
        });
      }
    }
  },

  view: function (ctrl) {
    return [m.component(Navbar),
      <div class="wrapper">
        <div class="container">
          <div class="row">
            <h2>Transfer</h2>
            <form class="col-sm-4" onsubmit={ctrl.processPayment.bind(ctrl)}>
              <div class="panel panel-primary">
                <div class="panel-heading">Transfer money</div>
                <div class="panel-body">
                  <div class="form-group">
                    <label>Transfer Type</label>
                    <select name="transType" required="required" class="form-control"
                            onchange={ctrl.changeTransferType.bind(ctrl)}
                            value={ctrl.transferType()}
                    >
                      <option value="byAccount">by Account ID</option>
                      <option value="byPhone">by Phone</option>
                    </select>
                  </div>
                  <div class="form-group"
                       class={(ctrl.transferType() != 'byAccount') ? 'hidden' : ''}>
                    <label>Account ID</label>
                    <input name="account"
                           oninput={m.withAttr("value", ctrl.infoAccount)} pattern=".{56}"
                           title="Account ID should have 56 symbols" class="form-control"
                           value={ctrl.infoAccount()}/>
                  </div>
                  <div class="form-group" class={(ctrl.transferType() != 'byPhone') ? 'hidden' : ''}>
                    <label>Phone number</label>
                    <input name="phone"
                           oninput={m.withAttr("value", ctrl.infoPhone)} pattern=".{10}"
                           title="Phone should have 10 symbols" class="form-control"
                           value={ctrl.infoPhone()}/>
                  </div>
                  <div class="form-group">
                    <label>Amount</label>
                    <input name="amount" required="required"
                           oninput={m.withAttr("value", ctrl.infoAmount)} class="form-control"
                           value={ctrl.infoAmount()}/>
                  </div>
                  <div class="form-group">
                    <label>Asset</label>
                    <select name="asset" required="required" class="form-control">
                      {Auth.balances().map(function (b) {
                        return <option value={b.asset}>{b.asset}</option>
                      })}
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Memo message</label>
                    <input name="memo"
                           size="14" maxlength="14"
                           disabled="disabled"
                           oninput={m.withAttr("value", ctrl.infoMemo)} class="form-control"
                           value={ctrl.infoMemo()}/>
                  </div>
                  <div class="form-group">
                    <button class="btn btn-primary">Transfer</button>
                  </div>
                </div>
              </div>
            </form>
            <form class="col-sm-4" onsubmit={ctrl.getInvoice.bind(ctrl)}>
              <div class="panel panel-primary">
                <div class="panel-heading">Request invoice</div>
                <div class="panel-body">
                  <div class="form-group">
                    <label>Invoice code</label>
                    <input type="number" name="code" required="required" class="form-control"/>
                  </div>
                  <div class="form-group">
                    <button class="btn btn-primary">Request</button>
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
