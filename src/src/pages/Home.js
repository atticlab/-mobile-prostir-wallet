var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Footer = require('../components/Footer.js');
var Auth = require('../models/Auth.js');

var Home = module.exports = {
  controller: function () {
    var ctrl = this;

    if (!Auth.exists()) {
      return m.route('/');
    }

    this.navbar = new Navbar.controller();

    this.invoceAssetExist = m.prop(false);

    this.error = m.prop('');

    this.showInvoiceGetForm = m.prop(false);

    this.getInvoiceFormFields = m.prop(
        {
          asset : {
            data: '',
            hname:'Asset:',
          },
          amount : {
            data: '',
            hname:'Amount:',
          },
          code : {
            data: '',
            hname:'Code:',
          },
          payer : {
            data: '',
            hname:'Payer:',
          },
          account : {
            data: '',
            hname:'To account:',
          },
        }
    );


    this.ShowGetForm = function () {
      this.showInvoiceGetForm = m.prop(true);
    }

    this.HideGetForm = function (){
      this.showInvoiceGetForm = m.prop(false);
    }.bind(this);

    this.getInvoice = function(e) {
      e.preventDefault();

      this.error('');
      this.showInvoiceGetForm = m.prop(false);
      ctrl.invoceAssetExist = m.prop(false);

      m.startComputation();
      m.onLoadingStart();

      var code  = e.target.code.value;

      if ( code <= 0 || !code ) {
        ctrl.error(m(".alert.alert-danger.animated.fadeInUp", 'Bad code. Check value!'));
        m.onLoadingEnd();
        m.endComputation();
        return;
      }

      var formData = new FormData();

      formData.append("id", code);
      formData.append("account", Auth.keypair().accountId());

      try {

        var xhr = new XMLHttpRequest();
        xhr.open( "POST", Conf.invoice_host + Conf.invoice_get_url, false ); // false for synchronous request
        xhr.send( formData );
        response = JSON.parse(xhr.responseText);
        if(response.error){
          switch(response.error){
            case 'Invalid id':
              console.log('error: ' + response.error);
              $.Notification.notify('error', 'top center', 'Error', 'Invalid invoice code!');
              break;
            case 'no invoice':
              console.log('error: ' + response.error);
              $.Notification.notify('error', 'top center', 'Error', 'Invalid invoice code!');
              break;
            case 'invoice already requested':
              console.log('error: ' + response.error);
              $.Notification.notify('error', 'top center', 'Error', 'Invoice already requested');
              break;
            default:
              $.Notification.notify('error', 'top center', 'Error', 'Stellar error');
              console.log('Can not get invoice!');
              console.log(response);
          }
        } else {


          Auth.balances().map(function(b){

            if(b.asset == response.asset){
              ctrl.invoceAssetExist(m.prop(true));
            }
          })


          ctrl.ShowGetForm();

          this.getInvoiceFormFields()['code'].data = response._id;
          this.getInvoiceFormFields()['asset'].data = response.asset;
          this.getInvoiceFormFields()['amount'].data = response.amount/100;
          this.getInvoiceFormFields()['payer'].data = response.payer;
          this.getInvoiceFormFields()['account'].data = response.account;
        }
      } catch (e){
        $.Notification.notify('error', 'top center', 'Error', 'Stellar error');
        console.log('Can not send data to invoice server!');
        console.log(e);
      }

      m.onLoadingEnd();
      m.endComputation();

    }
  },

  view: function (ctrl) {
    return [
      m.component(Navbar),
      <div class="wrapper">
        <div class="container">
          <div class="row">
            <div class="col-md-9">
              <h4 class="page-title">Welcome, {Auth.username()}!</h4>
              <p class="account_overflow">Account id: {Auth.keypair().accountId()}</p>
            </div>
            <div class="col-md-3">
              <div class="panel panel-primary panel-border">
                <div class="panel-heading">
                  <h3 class="panel-title">Account info</h3>
                </div>
                <div class="panel-body">
                  <table class="table m-0">
                    <tbody>
                    <tr>
                      <td>Type</td>
                      <td>{Auth.type()}</td>
                    </tr>
                    <tr>
                      <td>Balance:</td>
                      <td>
                        {Auth.balances().map(b => {
                          return parseFloat(b.balance).toFixed(2) + " " +b.asset
                        })}
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="card-box">
            <h4 class="text-dark header-title m-t-0">Account Transactions</h4>
            <p class="text-muted m-b-25 font-13">
              Overview of recent transactions.
            </p>

            <div class="table-responsive">
              <table class="table">
                <thead>
                <tr>
                  <th>Account id</th>
                  <th>Amount</th>
                  <th>Type</th>
                </tr>
                </thead>
                <tbody>
                {Auth.payments().map(function(payment) {
                  var trans_link = payment._links.transaction.href;
                  var trans_id = trans_link.substr(trans_link.lastIndexOf('/') + 1);
                  var accountId = payment.to == Auth.keypair().accountId()? payment.from : payment.to
                  var trans_url = '/transaction/'+trans_id+'/'+ accountId;
                  return <tr>
                    <td>
                      <a class="hidden-xs" href={trans_url} config={m.route}>
                        {accountId}
                      </a>
                      <a class="visible-xs" href={trans_url} config={m.route}>
                        {payment.to == Auth.keypair().accountId()? payment.from.substr(0, 5) : payment.to.substr(0, 5)}...
                      </a>
                    </td>
                    <td>{parseFloat(payment.amount).toFixed(2)}  {payment.asset_code}</td>
                    <td>
                        <span class={(payment.to == Auth.keypair().accountId())? 'label label-success' : 'label label-danger'}>
                          {(payment.to == Auth.keypair().accountId())? 'Debit' : 'Credit'}
                        </span>
                    </td>
                  </tr>
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      ,
      m.component(Footer)
    ]
  }
};
