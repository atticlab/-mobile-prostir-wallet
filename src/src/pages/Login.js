var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');

var Login = module.exports = {
    controller: function () {
        var ctrl = this;
        var lastLogin = window.localStorage.getItem('lastLogin');
        this.lastLogin = m.prop(((typeof lastLogin != 'undefined') || ((lastLogin != null))) ? lastLogin : '');
        if (Auth.keypair()) {
            return m.route('/home');
        }

        /******/
        this.appVersion = m.prop('');
        cordova.getAppVersion.getVersionNumber(function (version) {
            m.startComputation();
            ctrl.appVersion('v' + version);
            m.endComputation();
        });
        this.makeRequest = function (method, url, done) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                done(null, xhr.response);
            };
            xhr.onerror = function () {
                done(xhr.response);
            };
            xhr.send();
        };

        this.login = function (e) {
            e.preventDefault();
            Auth.login(e.target.login.value, e.target.password.value)
                .then(function () {
                    window.localStorage.setItem('lastLogin', Auth.wallet().username);
                    m.route('/home');
                })
                .catch(err => {
                    m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                })
        };
    },

    view: function (ctrl) {
        return <div class="wrapper-page">

            <div class="text-center logo">
                <img src="assets/img/logo.svg" alt="Smartmoney logo"/>
                <br />
                <small>{ctrl.appVersion()}</small>
                <h4>{Conf.tr('Login')}</h4>
            </div>

            <form class="form-horizontal m-t-20" onsubmit={ctrl.login.bind(ctrl)}>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="text" required="required" placeholder={Conf.tr("Username")}
                               autocapitalize="none"
                               name="login"
                               onchange={m.withAttr("value", ctrl.lastLogin)}
                                value={ctrl.lastLogin()}/>
                        <i class="md md-account-circle form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="password" required="required" autocapitalize="none"
                               placeholder={Conf.tr("Password")}
                               name="password"/>
                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group m-t-20">
                    <div class="col-xs-6">
                        <a href="/sign" config={m.route}
                           class="btn btn-default btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr("Create an account")}</a>
                    </div>
                    <div class="col-xs-6 text-right">
                        <button class="btn btn-inverse btn-custom waves-effect w-md waves-light m-b-5"
                                type="submit">{Conf.tr("Log in")}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    }
};
