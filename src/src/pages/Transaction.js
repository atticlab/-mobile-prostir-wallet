var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Footer = require('../components/Footer.js');
var Auth = require('../models/Auth.js');

var Transaction = module.exports = {
    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.navbar = new Navbar.controller();

        this.transaction = m.prop(false);
        this.account = m.prop(false);
        this.payment = m.prop(false);
        this.balances = m.prop([]);

        this.getAccount = function (aid) {
            Auth.loadAccountById(aid)
                .then((accountResult) => {
                    m.startComputation();
                    ctrl.account(accountResult);
                    m.endComputation();
                })
                .catch(function (err) {
                    console.error(err);
                    m.onLoadingEnd();
                    $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Can't load account by transaction"));
                })
        }

        this.getTransaction = function (tid) {
            Auth.loadTransactionInfo(tid)
                .then((transactionResult) => {
                    m.startComputation();
                    ctrl.transaction(transactionResult);
                    m.endComputation();
                }).catch(function (err) {
                console.log(err);
                m.onLoadingEnd();
                $.Notification.notify('error', 'top center', Conf.tr("Error"), Conf.tr("Transaction loading error"));
            })
        }

        this.getTransaction(m.route.param("trans_id"));
        this.getAccount(m.route.param("target_acc"));
    },

    view: function (ctrl) {
        return [
            m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    <div class="row">
                        <h2><a href="/" config={m.route}
                               type="button"
                               class="btn btn-primary">
                            <span class="fa fa-arrow-left" aria-hidden="true"></span>
                            &nbsp;{Conf.tr("Back")}
                        </a>&nbsp;{Conf.tr("Transaction")}</h2>
                        <div class="panel panel-primary">
                            <div class="panel-body">
                                <div class="form-group">
                                    <label>{Conf.tr("Created at")}:&nbsp;</label>
                                    <span>{new Date(ctrl.transaction().created_at).toLocaleString()}</span>
                                </div>
                                <div class="form-group">
                                    <label>{Conf.tr("Transaction memo")}:&nbsp;</label>
                                    <span>{ctrl.transaction().memo}</span>
                                </div>
                                <div class="form-group">
                                    <label>{Conf.tr("Target account ID")}:&nbsp;</label>
                                    <span>{ctrl.account().id}</span>
                                </div>
                                <div class="form-group">
                                    <label>{Conf.tr("Target account balances")}:&nbsp;</label>
                                    <span>{ctrl.account().balances ? ctrl.account().balances.map(b => {
                                        if (b.asset_type!='native') {
                                            return parseFloat(b.balance).toFixed(2) + " " + b.asset_code + " "
                                        } else {return '';}
                                    }): ''}</span>
                                </div>
                                <div class="form-group">
                                    <label>{Conf.tr("Target account type")}:&nbsp;</label>
                                    <span>{ctrl.account().type}</span>
                                </div>
                                <div class="hidden-xs">
                                    <label>{Conf.tr("Target account on infohost")}:&nbsp;</label>
                                    <a href={'http://info.smartmoney.com.ua/account/info/'+ctrl.account().id}
                                       class="btn btn-secondary"
                                       target="_blank"
                                    >
                                        <span class="fa fa-external-link"></span>
                                        &nbsp;{Conf.tr("Infohost")}
                                    </a>
                                </div>
                                <div class="hidden-xs">
                                    <label>{Conf.tr("Repeat this payment")}:&nbsp;</label>
                                    <a href={'/transfer' + '?account='+ctrl.account().id +
                                                            '&amount='+m.route.param("amount") +
                                                            '&asset='+m.route.param("asset")}
                                       config={m.route}
                                       class="btn btn-primary"
                                    >
                                        <span class="fa fa-repeat"></span>
                                        &nbsp;{Conf.tr("Repeat")}
                                    </a>
                                </div>
                            </div>
                            <div class="panel-footer"><small>{Conf.tr("Transaction ID")}: {ctrl.transaction().id}</small></div>
                        </div>
                    </div>
                </div>
            </div>
            ,
            m.component(Footer)
        ]
    }
};
