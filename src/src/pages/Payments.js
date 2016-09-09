var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Footer = require('../components/Footer.js');
var Auth = require('../models/Auth.js');
var DateFormat = require('dateformat');

var Payments = module.exports = {
    controller: function () {
        var ctrl = this;

        this.current_cursor = m.prop(null);
        this.payments       = m.prop([]);
        this.next           = m.prop(false);

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.checkNextPaymentsExist = function() {

            m.startComputation();
            ctrl.next(false);
            m.endComputation();

            return ctrl.current_cursor().next()
                .then(function (next_result) {

                    if (next_result.records.length > 0) {
                        m.startComputation();
                        ctrl.next(true);
                        m.endComputation();
                    }

                })
                .catch(err => {
                    m.flashError(err.name + ((err.message) ? ': ' + err.message : ''));
                })

        };

        //show next payments
        this.loadMorePayments = function (e) {
            e.preventDefault();

            m.onLoadingStart();

            ctrl.current_cursor().next()
                .then(function (result) {
                    m.startComputation();
                    ctrl.current_cursor(result);
                    ctrl.payments(ctrl.payments().concat(result.records));
                    m.endComputation();

                    return ctrl.checkNextPaymentsExist();
                })
                .catch(err => {
                    m.flashError(err.name + ((err.message) ? ': ' + err.message : ''));
                })
                .then(() => {
                    m.onLoadingEnd();
                });
        };

        Conf.horizon.payments()
            .forAccount(Auth.keypair().accountId())
            .order('desc')
            .limit(Conf.payments.onpage)
            .call()
            .then(function (result) {

                m.startComputation();
                ctrl.current_cursor(result);
                ctrl.payments(result.records);
                m.endComputation();

                return ctrl.checkNextPaymentsExist();

            })
            .catch(err => {
                // If you're here, everything's still ok - it means acc wasn't created yet
            });

    },

    view: function (ctrl) {
        return [
            m.component(Navbar),
            <div class="wrapper">
                <div class="container">

                    <div class="col-lg-12 visible-xs">
                        <div class="panel panel-color panel-primary">
                            <div class="panel-heading">
                                <h3 class="panel-title">{Conf.tr("Account transactions")}</h3>
                                <p class="panel-sub-title font-13 text-muted">{Conf.tr("Overview of recent transactions")}.</p>
                            </div>
                            <div class="panel-body">
                                {
                                    (!ctrl.payments().length) ?
                                        <p class="text-primary">{Conf.tr("No payments yet")}</p>
                                        :
                                        ctrl.payments().map(function (payment, index) {
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
                                                                                      href={trans_url} config={m.route}>
                                                        {accountId}
                                                    </a></b></small>
                                                </div>
                                            </div>
                                        })
                                }
                                <br/>
                                {
                                    (ctrl.next()) ?
                                    <button class="btn btn-primary waves-effect w-md waves-light m-b-5"
                                    onclick={ctrl.loadMorePayments.bind(ctrl)}>{Conf.tr("Show older")}
                                    </button>
                                    :
                                    ''
                                }

                            </div>
                        </div>
                    </div>

                    <div class="card-box hidden-xs">
                        <h4 class="text-dark header-title m-t-0">{Conf.tr("Account transactions")}</h4>
                        <p class="text-muted m-b-25 font-13">
                            {Conf.tr("Overview of transactions history")}.
                        </p>
                        {
                            (!ctrl.payments().length) ?
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

                                        {ctrl.payments().map(function (payment) {
                                            var trans_link = payment._links.transaction.href;
                                            var trans_id = trans_link.substr(trans_link.lastIndexOf('/') + 1);
                                            var accountId = payment.to == Auth.keypair().accountId() ? payment.from : payment.to
                                            //The reason for send an amount and asset code instead of payment id is that there is
                                            //no method in SDK to get payment by id.
                                            var trans_url = '/transaction/' + trans_id + '/' + accountId + '/' + payment.amount + '/' + payment.asset_code;
                                            return <tr>
                                                <td>
                                                    <a class="hidden-xs" href={trans_url} config={m.route}>
                                                        {accountId}
                                                    </a>
                                                    <a class="visible-xs" href={trans_url} config={m.route}>
                                                        {payment.to == Auth.keypair().accountId() ? payment.from.substr(0, 5) : payment.to.substr(0, 5)}...
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
                            </div>
                        }
                        {
                            (ctrl.next()) ?
                                <button class="btn btn-primary waves-effect w-md waves-light m-b-5"
                                        onclick={ctrl.loadMorePayments.bind(ctrl)}>{Conf.tr("Show older")}
                                </button>
                                :
                                ''
                        }
                    </div>
                </div>
            </div>
            ,
            m.component(Footer)
        ]
    }
};
