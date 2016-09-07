var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Footer = require('../components/Footer.js');
var Auth = require('../models/Auth.js');
var DateFormat = require('dateformat');

var Home = module.exports = {
  controller: function () {
    var ctrl = this;

    if (!Auth.keypair()) {
      return m.route('/');
    }

    // We'll query balances on each page load until we receive some money and start a stream
    if (!Auth.payments().length) {
      Auth.updateBalances(Auth.keypair().accountId())
          .then(function (source) {
            Auth.type(source.type);

            return Conf.horizon.payments()
                .forAccount(Auth.keypair().accountId())
                .order('desc')
                .limit(Conf.payments.onpage)
                .call();
          })
          .then(function (result) {
            m.startComputation();
            Auth.payments(result.records);
            m.endComputation();

            return Conf.horizon.payments()
                .forAccount(Auth.keypair().accountId())
                .cursor('now')
                .stream({
                  onmessage: function (message) {
                    var result = message.data ? JSON.parse(message.data) : message;
                    m.startComputation();
                    Auth.payments().unshift(result);
                    m.endComputation();

                    // Update user balance
                    Auth.updateBalances(Auth.keypair().accountId());
                  },
                  onerror: function () {
                    console.log('Cannot get payment from stream');
                  }
                });
          })
          .catch(err => {
            // If you're here, everything's still ok - it means acc wasn't created yet
          });
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
                    <tr>
                      <td>{Conf.tr("Type")}</td>
                      <td>{Auth.type() ? Auth.type() : Conf.tr('Anonymous user')}</td>
                    </tr>
                    {Auth.balances().length ?
                        <tr>
                          <td>{Conf.tr("Balance")}:</td>
                          <td>
                            {Auth.balances().map(b => {
                              return parseFloat(b.balance).toFixed(2) + " " + b.asset
                            })}
                          </td>
                        </tr>
                        :
                        ''
                    }
                  </table>
                </div>
              </div>
            </div>

            <div class="col-lg-12 visible-xs">
              <div class="panel panel-color panel-primary">
                <div class="panel-heading">
                  <h3 class="panel-title">{Conf.tr("Account transactions")}</h3>
                  <p class="panel-sub-title font-13 text-muted">{Conf.tr("Overview of recent transactions")}.</p>
                </div>
                {
                  (!Auth.payments().length) ?
                      <div class="panel-body">
                        <p class="text-primary">{Conf.tr("No payments yet")}</p>
                      </div>
                      :
                      <div class="panel-body">
                        {Auth.payments().map(function (payment, index) {
                          var trans_link = payment._links.transaction.href;
                          var trans_id = trans_link.substr(trans_link.lastIndexOf('/') + 1);
                          var accountId = payment.to == Auth.keypair().accountId() ? payment.from : payment.to
                          //The reason for send an amount and asset code instead of payment id is that there is
                          //no method in SDK to get payment by id.
                          var trans_url = '/transaction/' + trans_id + '/' + accountId + '/' + payment.amount + '/' + payment.asset_code;
                          return <div class="card-box">
                            <div class="wid-u-info">
                              <h4 class="m-t-0 m-b-5"><span
                                  class={(payment.to == Auth.keypair().accountId()) ? 'label label-success' : 'label label-danger'}>
                                                                        {(payment.to == Auth.keypair().accountId()) ? Conf.tr("Debit") : Conf.tr("Credit")}
                                                                    </span>&nbsp;&nbsp;&nbsp;{parseFloat(payment.amount).toFixed(2)} {payment.asset_code}
                              </h4>
                              <p class="text-muted m-b-5 font-13">{DateFormat(payment.closed_at, 'dd.mm.yyyy HH:MM:ss')}</p>
                              <small class="text-warning"><b><a class="account_overflow"
                                                                href={trans_url}
                                                                config={m.route}>
                                {accountId}
                              </a></b></small>
                            </div>
                          </div>
                        })}
                        <a href="/payments" config={m.route}>
                          {Conf.tr("All transactions")}
                        </a>
                      </div>
                }
              </div>
            </div>

          </div>

          <div class="card-box hidden-xs">
            <h4 class="text-dark header-title m-t-0">{Conf.tr("Account transactions")}</h4>
            <p class="text-muted m-b-25 font-13">
              {Conf.tr("Overview of recent transactions")}.
            </p>
            {
              (!Auth.payments().length) ?
                  <p class="text-primary">{Conf.tr("No payments yet")}</p>
                  :
                  <div class="table-responsive">
                    <table class="table">
                      <thead>
                      <tr>
                        <th>{Conf.tr("Account id")}</th>
                        <th>{Conf.tr("Date")}</th>
                        <th>{Conf.tr("Amount")}</th>
                        <th>{Conf.tr("Type")}</th>
                      </tr>
                      </thead>
                      <tbody>
                      {Auth.payments().map(function (payment) {
                        var trans_link = payment._links.transaction.href;
                        var trans_id = trans_link.substr(trans_link.lastIndexOf('/') + 1);
                        var accountId = payment.to == Auth.keypair().accountId() ? payment.from : payment.to
                        //The reason for send an amount and asset code instead of payment id is that there is
                        //no method in SDK to get payment by id.
                        var trans_url = '/transaction/' + trans_id + '/' + accountId + '/' + payment.amount + '/' + payment.asset_code;
                        return <tr>
                          <td>
                            <a class="account_overflow" href={trans_url} config={m.route}>
                              {accountId}
                            </a>
                          </td>
                          <td>{DateFormat(payment.closed_at, 'dd.mm.yyyy HH:MM:ss')}</td>
                          <td>{parseFloat(payment.amount).toFixed(2)} {payment.asset_code}</td>
                          <td>
                                                    <span
                                                        class={(payment.to == Auth.keypair().accountId())? 'label label-success' : 'label label-danger'}>
                                                        {(payment.to == Auth.keypair().accountId()) ? Conf.tr("Debit") : Conf.tr("Credit")}
                                                    </span>
                          </td>
                        </tr>
                      })}

                      </tbody>
                    </table>
                    <hr/>
                    <a href="/payments" config={m.route}>
                      {Conf.tr("All transactions")}
                    </a>
                  </div>
            }
          </div>
        </div>
      </div>
      ,
      m.component(Footer)
    ]
  }
};
