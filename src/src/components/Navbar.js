var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');

/*****/
var Scanner = require('../components/Scanner.js');

module.exports = {

    controller: function () {
        var ctrl = this;

        this.visible = m.prop(false);

        this.toggleVisible = function () {
            this.visible(!this.visible());

            if (this.visible()) {
                $('#mobile-spec-menu').css('max-height', $(window).height() - $('.topbar-main').height());
            }
        }

    },

    view: function (ctrl) {
        return <header id="topnav">
            <div class="topbar-main">
                <div class="container">

                    <a href="/" config={m.route} class="logo"><img src="assets/img/logo-white.svg" alt=""/></a>

                    <div class="menu-extras">
                        <ul class="nav navbar-nav navbar-right pull-right hidden-xs">
                            <li>
                                <a href="#" onclick={Auth.logout}><i class="fa fa-power-off m-r-5"></i>
                                    {Conf.tr("Logout")}
                                </a>
                            </li>
                        </ul>

                        <div class="menu-item">
                            <a onclick={ctrl.toggleVisible.bind(ctrl)}
                               class={ctrl.visible() ? 'open navbar-toggle' : 'navbar-toggle'}>
                                <div class="lines">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </div>


            <div class="navbar-custom">
                <div class="container">
                    <div id="navigation" style={ctrl.visible()? 'display:block;' : ''}>
                        <ul class="navigation-menu" id="mobile-spec-menu">
                            <li>
                                <a href="/" config={m.route}><i class="md md-dashboard"></i>{Conf.tr("Dashboard")}</a>
                            </li>
                            <li>
                                <a href="/payments" config={m.route}><i class="md md-list"></i>{Conf.tr("Payments")}</a>
                            </li>
                            <li>
                                <a href="/transfer" config={m.route}><i
                                    class="fa fa-money"></i>{Conf.tr("Transfer money")}</a>
                            </li>

                            <li>
                                <a href="/invoice" config={m.route}><i
                                    class="md md-payment"></i>{Conf.tr("Create invoice")}</a>
                            </li>

                            <li>
                                <a href="/settings" config={m.route}><i class="md md-settings"></i>{Conf.tr("Settings")}
                                </a>
                            </li>

                            <li class="has-submenu">
                                {m.component(Scanner)}
                            </li>

                            <li class="visible-xs">
                                <a href="#" onclick={Auth.logout}><i class="fa fa-power-off m-r-5"></i>
                                    {Conf.tr("Logout")}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    }
};