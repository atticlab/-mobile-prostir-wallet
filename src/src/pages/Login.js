var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');
var PinInput = require('../components/Pin-input');
var ProgressBar = require('../components/ProgressBar');

var Login = module.exports = {
    controller: function () {
        var ctrl = this;

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

        let lastLogin = window.localStorage.getItem('lastLogin');
        ctrl.username = m.prop(lastLogin ? lastLogin : '');

        this.getPhoneWithViewPattern = function (number) {
            if (number.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix) {
                number = Conf.phone.prefix;
            }
            return m.prop(VMasker.toPattern(number, {pattern: Conf.phone.view_mask, placeholder: "x"}));
        };

        this.addPhoneViewPattern = function (e) {
            ctrl.login = ctrl.getPhoneWithViewPattern(e.target.value);
            setTimeout(function(){e.target.selectionStart = e.target.selectionEnd = 10000}, 0);
        };

        this.attempts = m.prop(window.localStorage.getItem("pinAttempts") || 0);
        this.progress = m.prop(0);
        this.showProgress = m.prop(false);
        this.pin = m.prop(null);
        this.encryptedPasswordHash = m.prop(window.localStorage.getItem('encryptedPasswordHash') || null);
        this.showLoginByPin = m.prop((ctrl.attempts() > 0) && ctrl.encryptedPasswordHash());

        this.progressCB = function (stage) {
            console.log(stage);

            switch (stage.type) {
                case 'request':
                    m.onLoadingStart();
                    break;
                case 'progress':
                    m.startComputation();
                    ctrl.progress(stage.progress);
                    m.endComputation();
                    break;
                default:
                    m.onProcedureStart();
            }
        };

        this.signin = function(e) {
            e.preventDefault();


            ctrl.showProgress(true);

            Auth.login(e.target.login.value, e.target.password.value, ctrl.progressCB)
                .then(function () {
                    ctrl.showProgress(false);
                    window.localStorage.setItem('lastLogin', Auth.wallet().username);
                    window.localStorage.removeItem('encryptedPasswordHash');

                    if (!Auth.checkPinCreated()) {
                        m.route('/pin');
                    } else {
                        m.route('/home');
                    }
                })
                .catch(err => {
                    m.startComputation();
                    ctrl.showProgress(false);
                    ctrl.progress(0);
                    m.endComputation();
                    if (err.name === "ConnectionError") {
                        console.error(err);
                        return m.flashError(Conf.tr("Service error. Please contact support"));
                    } else {
                        console.log(err);
                        return m.flashError(Conf.tr("Login/password combination is invalid"));
                    }
                })
        };

        this.inputCompleteCB = function () {
            m.startComputation();
            ctrl.loginByPin();
            m.endComputation();
            m.redraw('true');
        };

        this.loginByPin = function(e) {
            if (e) e.preventDefault();

            if (ctrl.pin().length === 0) {
                return m.flashError(Conf.tr("Enter your PIN"));
            }

            if (ctrl.pin().length !== 4) {
                return m.flashError(Conf.tr("PIN should contain 4 digits"));
            }

            if (Auth.checkPinCreated()) {
                let attempts = window.localStorage.getItem("pinAttempts");

                if (attempts > 0) {
                    Auth.loginByPin(ctrl.pin(), ctrl.username(), ctrl.encryptedPasswordHash())
                        .then(() => {
                            window.localStorage.setItem('lastLogin', Auth.wallet().username);
                            window.localStorage.setItem('pinAttempts', 3);
                            m.route('/home');
                        })
                        .catch(err => {
                            console.info(err);
                            ctrl.pin('');
                            attempts -= 1;
                            window.localStorage.setItem('pinAttempts', attempts);

                            if (attempts > 0) {
                                m.flashError(Conf.tr("Wrong PIN! Attempts left: $[1]", attempts));
                            } else {
                                window.localStorage.removeItem('encryptedPasswordHash');
                                m.startComputation();
                                ctrl.showLoginByPin(false);
                                document.querySelector('.pincode-input-container').remove();
                                m.endComputation();
                                m.flashError(Conf.tr("You entered wrong PIN 3 times! It has been removed from your device. Sign in by password"));
                                return m.redraw(true);
                            }
                        })
                }
            } else {
                m.startComputation();
                ctrl.showLoginByPin(false);
                m.endComputation();
                return m.flashError(Conf.tr("You cannot sign in via PIN, you must first create it!"));
            }
        };

        this.forgetPin = function () {
            m.startComputation();
            ctrl.showLoginByPin(false);
            m.endComputation();
            document.querySelector('.pincode-input-container').remove();
        };
    },

    view: function (ctrl) {
        return <div class="wrapper-center-form">
        <div class="form-center">
        <div class="wrapper-page">

            <div class="text-center">
                <span class="logo-img-helper"></span>
                <a href="index.html" class="logo logo-lg">
                    <img class="logo-img" src="./assets/img/logo_blue-with-yellow.png" />
                </a>
                <br/>
                <small>{ctrl.appVersion()}</small>
                <h4>{Conf.tr('Login')}</h4>
            </div>

            {ctrl.showLoginByPin() ?
                <form class="form-horizontal m-t-20" onsubmit={ctrl.loginByPin.bind(ctrl)}>
                    {m(PinInput, {pin: ctrl.pin,  cb: ctrl.inputCompleteCB,
                        options: {
                            label: true,
                            labelText: Conf.tr("Enter PIN to sign in to your account")
                        }})}

                    <div class="form-group m-t-20 text-center">
                        <div class="col-xs-6 text-left">
                            <button class="btn btn-inverse btn-custom waves-effect w-md waves-light m-b-5"
                                    type="button" onclick={ctrl.forgetPin}>{Conf.tr("Forget PIN")}
                            </button>
                        </div>
                        <div class="col-xs-6 text-right">
                            <button class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5"
                                    type="submit">{Conf.tr("Login")}
                            </button>
                        </div>
                    </div>
                </form>
                :
                <div>
                    {ctrl.showProgress() ?
                        <div class="form-group m-t-10">
                            {m(ProgressBar, {value: ctrl.progress, text: Conf.tr("Decrypting your account for signing in")})}
                        </div>
                        :
                        <form class="form-horizontal m-t-20" onsubmit={ctrl.signin.bind(ctrl)}>

                            <div class="form-group">
                                <div class="col-xs-12">
                                    <input class="form-control" type="text" required="required" placeholder={Conf.tr("Username")}
                                           autocapitalize="none"
                                           name="login" autofocus
                                           onchange={m.withAttr("value", ctrl.username)}
                                           value={ctrl.username()}/>
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
                                    <button class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5"
                                            type="submit">{Conf.tr("Log in")}
                                    </button>
                                </div>
                            </div>
                        </form>
                    }
                </div>
            }
        </div>
        </div>
        </div>
    }
};
