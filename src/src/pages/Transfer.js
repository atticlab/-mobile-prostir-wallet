var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Invoice = module.exports = {

  controller: function () {
    var ctrl = this;

    this.infoAsset    = m.prop('');
    this.infoAmount   = m.prop('');
    this.infoAccount  = m.prop('');

    if (!Auth.exists()) {
      return m.route('/');
    }

    this.getInvoice = function (e) {
      e.preventDefault();

      var code = e.target.code.value;
      if (!code || code < 0) {
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


      if (!StellarSdk.Keypair.isValidPublicKey(e.target.account.value)) {
        $.Notification.notify('error', 'top center', 'Error', 'Account is invalid');
        return;
      }

      var amount = parseFloat(e.target.amount.value);
      if (!amount) {
        $.Notification.notify('error', 'top center', 'Error', 'Amount is invalid');
        return;
      }

      m.startComputation();
      m.onLoadingStart();

      Conf.horizon.loadAccount(Auth.keypair().accountId())
        .then(function (source) {
          var tx = new StellarSdk.TransactionBuilder(source)
            .addOperation(StellarSdk.Operation.payment({
              destination: e.target.account.value,
              amount: amount.toString(),
              asset: new StellarSdk.Asset(e.target.asset.value, Conf.master_key)
            }))
            .build();

          tx.sign(Auth.keypair());


          Conf.horizon.submitTransaction(tx)
            .then(function () {
              $.Notification.notify('success', 'top center', 'Success', 'Transfer successful');
              ctrl.infoAsset('');
              ctrl.infoAmount('');
              ctrl.infoAccount('');

              m.onLoadingEnd();
              m.endComputation();

              return Auth.loadAccount();
            })
            .catch(function (err) {
              $.Notification.notify('error', 'top center', 'Error', 'Cannot make transfer');
              console.log(err);
            }).then(function () {
              ctrl.infoAsset('');
              ctrl.infoAmount('');
              ctrl.infoAccount('');

              m.onLoadingEnd();
              m.endComputation();
            });
        });
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
                      <label>Account ID</label>
                      <input name="account" required="required" oninput={m.withAttr("value", ctrl.infoAccount)} pattern=".{56}" title="Account ID should have 56 symbols" class="form-control" value={ctrl.infoAccount()}/>
                  </div>
                  <div class="form-group">
                      <label>Amount</label>
                      <input name="amount" required="required" oninput={m.withAttr("value", ctrl.infoAmount)} class="form-control" value={ctrl.infoAmount()}/>
                  </div>
                  <div class="form-group">
                      <label>Asset</label>
                      <select name="asset" required="required" class="form-control">
                        {Auth.balances().map(function(b){
                          return <option value={b.asset}>{b.asset}</option>
                        })}
                      </select>
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
