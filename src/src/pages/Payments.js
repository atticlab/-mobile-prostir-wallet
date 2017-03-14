var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var Payments = require('../components/Payments.js');

module.exports = {
    controller: function () {
        var ctrl = this;
        this.myScroll = null; //iScroll

        this.current_cursor = m.prop(null);
        this.payments = m.prop([]);
        this.next = m.prop(false);
        this.pullDownPhrase = m.prop(0);

        if (!Auth.keypair()) {
            return m.route('/');
        }
        this.initPullToRefresh = function () {
            if (ctrl.myScroll == null) {
                var topnavSize = document.getElementById('topnav').offsetHeight;
                document.getElementById('puller').style.top = topnavSize + 10 + "px";
                document.addEventListener('touchmove', function (e) {
                    e.preventDefault();
                }, false);
                ctrl.myScroll = new IScroll('#puller', {
                    useTransition: true,
                    startX: 0,
                    topOffset: 0
                });

                ctrl.myScroll.on('scrollEnd', function () {
                    m.startComputation();
                    ctrl.pullDownPhrase(2);
                    m.endComputation();
                    ctrl.paymentsLoad().then(function () {
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

        this.checkNextPaymentsExist = function () {
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
            return ctrl.current_cursor().next()
                .then(function (result) {
                    m.startComputation();
                    ctrl.current_cursor(result);
                    ctrl.payments(ctrl.payments().concat(result.records));
                    m.endComputation();
                    myScroll.refresh();
                    return ctrl.checkNextPaymentsExist();
                })
                .catch(err => {
                    m.flashError(err.name + ((err.message) ? ': ' + err.message : ''));
                })
                .then(() => {
                    m.onLoadingEnd();
                });
        };
        this.paymentsLoad = function() {
            return Conf.horizon.payments()
                .forAccount(Auth.keypair().accountId())
                .order('desc')
                .limit(Conf.payments.onpage)
                .call()
                .then(function (result) {
                    m.startComputation();
                    ctrl.current_cursor(result);
                    ctrl.payments(result.records);
                    m.endComputation();
                    ctrl.initPullToRefresh();
                    return ctrl.checkNextPaymentsExist();
                })
                .catch(err => {
                    // If you're here, everything's still ok - it means acc wasn't created yet
                });
        };

        ctrl.paymentsLoad();
    },

    view: function (ctrl) {
        return [
            m.component(Navbar),
            <div class="wrapper">

                <div class="container puller" id="puller">
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
                        <div class="panel panel-color panel-inverse">
                            <div class="panel-heading">
                                <h3 class="panel-title">{Conf.tr("Account transactions")}</h3>
                                <p class="panel-sub-title font-13">{Conf.tr("Overview of recent transactions")}.</p>
                            </div>

                            <div class="panel-body">
                                {m.component(Payments, {payments: ctrl.payments()})}
                            </div>
                            {(ctrl.next()) ?
                                <div class="panel-footer text-center">
                                    <button class="btn btn-primary waves-effect w-md waves-light m-b-5"
                                            onclick={ctrl.loadMorePayments.bind(ctrl)}>{Conf.tr("Show older")}
                                    </button>
                                </div>
                                :
                                ''
                            }
                            <div class="clearfix"></div>
                        </div>
                    </div>
                </div>
            </div>
        ]
    }
};
