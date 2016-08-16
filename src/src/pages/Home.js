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

  },

  view: function (ctrl) {
    return [
      m.component(Navbar),
      <div class="wrapper">
        <div class="container">
          <div class="row">
            <div class="col-md-9">
              <h4 class="page-title">{Conf.tr("Welcome")}, {Auth.username()}!</h4>
              <p class="account_overflow">{Conf.tr("Account id")}: {Auth.keypair().accountId()}</p>
            </div>
            <div class="col-md-3">
              <div class="panel panel-primary panel-border">
                <div class="panel-heading">
                  <h3 class="panel-title">{Conf.tr("Account info")}</h3>
                </div>
                <div class="panel-body">
                  <table class="table m-0">
                    <tbody>
                    <tr>
                      <td>{Conf.tr("Type")}:</td>
                      <td>{Auth.type()}</td>
                    </tr>
                    <tr>
                      <td>{Conf.tr("Balance")}:</td>
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
            <h4 class="text-dark header-title m-t-0">{Conf.tr("Account transactions")}</h4>
            <p class="text-muted m-b-25 font-13">
              {Conf.tr("Overview of recent transactions")}.
            </p>

            <div class="table-responsive">
              <table class="table">
                <thead>
                <tr>
                  <th>{Conf.tr("Account id")}</th>
                  <th>{Conf.tr("Amount")}</th>
                  <th>{Conf.tr("Type")}</th>
                </tr>
                </thead>
                <tbody>
                {Auth.payments().map(function(payment) {
                  var trans_link = payment._links.transaction.href;
                  var trans_id = trans_link.substr(trans_link.lastIndexOf('/') + 1);
                  var accountId = payment.to == Auth.keypair().accountId()? payment.from : payment.to
                  //The reason for send an amount and asset code instead of payment id is that there is
                  //no method in SDK to get payment by id.
                  var trans_url = '/transaction/'+trans_id+'/'+ accountId+'/'+payment.amount+'/'+payment.asset_code;
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
                          {(payment.to == Auth.keypair().accountId())? Conf.tr("Debit") : Conf.tr("Credit")}
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
