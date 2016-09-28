var Qr = require('../../node_modules/qrcode-npm/qrcode');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');

var Sign = module.exports = {
    controller: function () {
        if (Auth.keypair()) {
            return m.route('/home');
        }

        this.qr = m.prop(false);

        this.signup = function (e) {
            e.preventDefault();

            var ctrl = this;

            if (!e.target.login.value || !e.target.password.value || !e.target.repassword.value) {
                m.flashError(Conf.tr("Please, fill all required fields"));
                return;
            }

            if (e.target.password.value.length < 6) {
                m.flashError(Conf.tr("Password should have 6 chars min"));
                return;
            }

            if (e.target.password.value != e.target.repassword.value) {
                m.flashError(Conf.tr("Passwords should match"));
                return;
            }

            m.onLoadingStart();
            Auth.registration(e.target.login.value, e.target.password.value)
                .then(() => {
                        /*var qr = Qr.qrcode(4, 'M');
                        qr.addData(e.target.password.value);
                        qr.make();
                        var imgTag = qr.createImgTag(4);
                        m.startComputation();
                        ctrl.qr(m.trust(imgTag));
                        m.endComputation();*/
                        Auth.login(e.target.login.value, e.target.password.value)
                            .then(function () {
                                m.onLoadingEnd();
                                m.route('/home');
                            })
                            .catch(err => {
                                m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                            })
                    },
                    err => {
                        m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                    })
                .then(() => {
                    m.onLoadingEnd();
                })
        };
    },

    view: function (ctrl) {
        if (ctrl.qr()) {
            var code = ctrl.qr();
            ctrl.qr(false);
            var img = code.substring((code.indexOf('="') + 2), (code.lastIndexOf('=="') + 2));
            return <div class="wrapper-page">
                <div>
                    <div class="panel panel-color panel-success">
                        <div class="panel-heading">
                            <h3 class="panel-title">{Conf.tr("Registration successful")}</h3>
                            <p class="panel-sub-title font-13">{Conf.tr("Print this QR-code and keep it in secure place. This is the only possible way to recover your password")}!</p>
                        </div>
                        <div class="panel-body">
                            <div class="text-center">
                                {code}
                                <br/>
                                <a href={img} download="qr_password.gif">{Conf.tr("Save code")}</a>
                                <br/>
                                <br/>
                                <a href="/" config={m.route}
                                   class="btn btn-success btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr("Log in")}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }

        return <div class="wrapper-page">
            <div class="text-center logo">
                <a href="/" config={m.route}><img src="assets/img/logo.svg" alt="Smartmoney logo"/></a>
                <h4>{Conf.tr('Sign up new account')}</h4>
            </div>

            <form class="form-horizontal m-t-20" onsubmit={ctrl.signup.bind(ctrl)}>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="text" required="required" placeholder={Conf.tr("Username")}
                               autocapitalize="none"
                               name="login" pattern="[A-Za-z0-9_-]{3,}"
                               title={Conf.tr("Characters and numbers allowed")}/>
                        <i class="md md-account-circle form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="password" required="required"
                               autocapitalize="none"
                               placeholder={Conf.tr("Password")} name="password" pattern=".{6,}"
                               title={Conf.tr("6 characters minimum")}/>
                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="password" required="required"
                               autocapitalize="none"
                               placeholder={Conf.tr("Retype Password")} name="repassword" pattern=".{6,}"
                               title={Conf.tr("6 characters minimum")}/>
                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group m-t-20 text-center">
                    <button
                        class="btn btn-inverse btn-lg btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr("Sign up")}</button>
                </div>
            </form>
        </div>
    }
};
