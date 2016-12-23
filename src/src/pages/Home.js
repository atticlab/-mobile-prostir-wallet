var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Payments = require('../components/Payments.js');
var Footer = require('../components/Footer.js');
var Auth = require('../models/Auth.js');

module.exports = {
    controller: function () {
        var ctrl = this;

        this.myScroll = null; //iScroll

        this.pullDownPhrase = m.prop(0);

        if (!Auth.keypair()) {
            return m.route('/');
        }

        // We'll query balances on each page load until we receive some money and start a stream
        if (!Auth.payments().length) {
            Auth.updateBalances(Auth.keypair().accountId())
                .then(function (source) {
                    if (source) {
                        Auth.type(source.type);
                    }
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
                    ctrl.initPullToRefresh();
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
                    console.log(err);
                    // If you're here, everything's still ok - it means acc wasn't created yet
                });
        } else {
            setTimeout(function () {
                ctrl.initPullToRefresh();
            }, 500);
        }

        this.copyAccountId = function (e) {
            e.preventDefault();
            cordova.plugins.clipboard.copy(
                Auth.keypair().accountId(),
                function () {
                    m.flashSuccess(Conf.tr("AccountId copied!"));
                }
            );
            return false;
        };

        this.initPullToRefresh = function () {
            console.debug(ctrl.myScroll);
            if (ctrl.myScroll == null) {
                var topnavSize = document.getElementById('topnav').offsetHeight;
                document.getElementById('home-puller').style.top = topnavSize + 10 + "px";
                document.addEventListener('touchmove', function (e) {
                    e.preventDefault();
                }, false);
                ctrl.myScroll = new IScroll('#home-puller', {
                    useTransition: true,
                    startX: 0,
                    topOffset: 0
                });

                ctrl.myScroll.on('scrollEnd', function () {
                    m.startComputation();
                    ctrl.pullDownPhrase(2);
                    m.endComputation();
                    Auth.updateBalances(Auth.keypair().accountId())
                        .then(function () {
                            m.startComputation();
                            ctrl.pullDownPhrase(0);
                            ctrl.myScroll.refresh();
                            m.endComputation();
                        });


                });
                ctrl.myScroll.on('scrollCancel', function () {
                    m.startComputation();
                    ctrl.pullDownPhrase(0);
                    m.endComputation();
                });
                ctrl.myScroll.on('scrollStart', function () {
                    m.startComputation();
                    ctrl.pullDownPhrase(1);
                    m.endComputation();
                });
            }
        };
    },

    view: function (ctrl) {
        var type = Auth.type() ? Auth.type() : 'anonymous_user';
        return [
            m.component(Navbar),
            <div class="wrapper">
                <div class="container puller" id="home-puller">
                    <div>
                        {(ctrl.pullDownPhrase() == 1) ?
                            <div id="pull-info" class="center-block">
                                <p class="lead m-t-10">
                                    <span class="fa fa-arrow-up fa-2x m-r-10"></span>
                                    {Conf.tr("Release to refresh")}
                                </p>
                            </div>
                            : (ctrl.pullDownPhrase() == 2) ?
                            <div>
                                <p class="lead m-t-10">
                                    <i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i>
                                    {Conf.tr("Updating...")}
                                </p>
                            </div>
                            : ''
                        }
                        <div class="row">
                            <div class="col-sm-6">
                                <div class="card-box widget-user">
                                    <div>
                                        <img src="assets/img/no-avatar.png" class="img-responsive img-circle"
                                             alt="user"/>
                                        <div class="wid-u-info">
                                            <h4 class="m-t-0 m-b-5">{Conf.tr("Welcome")}, {Auth.username()}</h4>
                                            <p class="text-muted m-b-5 font-13 account_overflow">
                                                <a href="#" onclick={ctrl.copyAccountId.bind(this)}>
                                                    {Auth.keypair().accountId()}
                                                </a>
                                            </p>

                                            <small>
                                                <b>{Conf.tr(type)}</b>
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-sm-6">
                                <div class="widget-simple text-center card-box">
                                    <h3 class="text-primary counter">
                                        {Auth.balances().length ?
                                            Auth.balances().map(b => {
                                                return <div class="col-sm-2 p-t-10">
                                            <span class="label label-primary">
                                                {parseFloat(b.balance).toFixed(2) + " " + Conf.defaultAsset}
                                            </span>
                                                </div>
                                            })
                                            :
                                            '0.00'
                                        }
                                    </h3>
                                    <p class="text-muted" style="margin: 2px;">{Conf.tr("Balance")}</p>
                                </div>
                            </div>

                            <div class="clearfix"></div>
                        </div>

                        <div class="panel panel-color panel-inverse">
                            <div class="panel-heading">
                                <h3 class="panel-title">{Conf.tr("Account transactions")}</h3>
                                <p class="panel-sub-title font-13">{Conf.tr("Overview of recent transactions")}.</p>
                            </div>

                            <div class="panel-body">
                                {m.component(Payments, {payments: Auth.payments()})}
                            </div>

                            <div class="panel-footer text-center">
                                <a href="/payments" config={m.route}
                                   class="btn btn-primary btn-custom waves-effect w-md btn-sm waves-light">
                                    {Conf.tr("All transactions")}
                                </a>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            ,
            m.component(Footer)
        ]
    }
};
