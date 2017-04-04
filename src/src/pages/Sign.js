var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');
var ProgressBar = require('../components/ProgressBar');
var Helpers = require('../models/Helpers');

var Sign = module.exports = {
    controller: function () {
        var ctrl = this;
        this.showSmsSubmit = m.prop(false);
        this.signParams = m.prop(false);
        this.resendSmsLabel = m.prop(false);
        this.leaveSecondsToResend = m.prop(0);

        this.progress = m.prop(0);
        this.showProgress = m.prop(false);

        if (Auth.keypair()) {
            return m.route('/home');
        }

        window.plugins.sim.getSimInfo(simInfo => {
            if (simInfo.phoneNumber) {
                m.startComputation();
                ctrl.phone = m.prop(VMasker.toPattern(simInfo.phoneNumber, {pattern: Conf.phone.view_mask, placeholder: "x"}));
                m.endComputation();
            }
        }, error => {
            console.log(error);
        });

        this.getPhoneWithViewPattern = function (number) {
            if (number.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix) {
                number = Conf.phone.prefix;
            }
            return m.prop(VMasker.toPattern(number, {pattern: Conf.phone.view_mask, placeholder: "x"}));
        };

        this.addPhoneViewPattern = function (e) {
            ctrl.phone = ctrl.getPhoneWithViewPattern(e.target.value);
            setTimeout(function(){e.target.selectionStart = e.target.selectionEnd = 10000}, 0);
        };

        this.phone = ctrl.getPhoneWithViewPattern(Conf.phone.prefix + Auth.wallet().phone);

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

        //start countdown for resend sms
        setInterval(function () {
            if (ctrl.leaveSecondsToResend() > 0) {
                m.startComputation();
                ctrl.leaveSecondsToResend(parseInt(ctrl.leaveSecondsToResend() - 1));
                m.endComputation();
            }
        }, 1000);

        this.waitForResendShow = function() {
            m.startComputation();
            ctrl.leaveSecondsToResend(parseInt(Conf.sms.resendInterval/1000));
            m.endComputation();

            setTimeout(function () {
                m.startComputation();
                ctrl.resendSmsLabel(true);
                m.endComputation();
            }, Conf.sms.resendInterval);
        };

        this.sendSignSms = function (e) {
            e.preventDefault();

            var login = e.target.login.value;
            var password = e.target.password.value;
            var rePassword = e.target.repassword.value;
            let phone = VMasker.toPattern(e.target.phone.value, Conf.phone.db_mask).substr(2);

            if (phone.length > 0 && phone.match(/\d/g).length != Conf.phone.length) {
                return m.flashError(Conf.tr("Invalid phone"));
            }

            if (!login || !password || !rePassword || !phone) {
                return m.flashError(Conf.tr("Please, fill all required fields"));
            }

            if (login.length < 3) {
                return m.flashError(Conf.tr("Login should have 3 chars min"));
            }

            var pattern = /^([A-Za-z0-9_-]{1,})$/;

            if (!pattern.test(login)) {
                return m.flashError(Conf.tr("Login should contain only latin characters, numbers, - and _"))
            }

            if (password.length < 8) {
                return m.flashError(Conf.tr("Password should have 8 chars min"));
            }

            if (password != rePassword) {
                return m.flashError(Conf.tr("Passwords should match"));
            }

            let regex = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{1,}$/;
            if (!regex.test(password)) {
                return m.flashError(Conf.tr("Password must contain at least one upper case letter and one digit"));
            }

            m.onLoadingStart();
            var accountKeypair = StellarSdk.Keypair.random();
            ctrl.waitForResendShow();
            m.startComputation();
            ctrl.signParams({
                'login': login,
                'phone': phone,
                'password': password,
                'rePassword': rePassword,
                'accountKeypair': accountKeypair,
            });
            m.endComputation();

            Auth.createSms(phone, accountKeypair.accountId()).then(function (result) {
                m.startComputation();
                ctrl.showSmsSubmit(true);
                m.endComputation();
            })
                .catch(err => {
                    m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                })
                .then(function () {
                    m.onLoadingEnd();
                });
        };

        this.submitOTP = function (e) {
            e.preventDefault();
            var otp = e.target.otp.value;
            if (!otp) {
                return m.flashError(Conf.tr("Please, fill all required fields"));
            }

            if (otp.length < 6) {
                return m.flashError(Conf.tr("One time password should have 6 chars min"));
            }

            var pattern = /^([0-9]{1,})$/;

            if (!pattern.test(otp)) {
                return m.flashError(Conf.tr("One time password should contain only numbers"))
            }
            m.onLoadingStart();

            var params = ctrl.signParams();
            Auth.submitOTP(params.phone, params.accountKeypair.accountId(), otp)
                .then(function (result) {
                    if (result.data.items.is_confirmed) {
                        return ctrl.signup();
                    }
                })
                .then(function (result) {
                    m.onLoadingEnd();
                })
                .catch(err => {
                    m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                })
        };

        this.resendSms = function (e) {
            e.preventDefault();
            m.onLoadingStart();
            var params = ctrl.signParams();
            Auth.resendSms(params.phone, params.accountKeypair.accountId())
                .then(function (result) {
                    if (result.items) {
                        m.flashSuccess(Conf.tr('Sms resended'));
                    }
                })
                .catch(err => {
                    m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                })
                .then(function () {
                    m.startComputation();
                    ctrl.resendSmsLabel(false);
                    m.endComputation();
                    ctrl.waitForResendShow();
                    m.onLoadingEnd();
                });
        };

        this.signup = function () {
            m.startComputation();
            ctrl.showSmsSubmit(false);
            ctrl.showProgress(true);
            m.endComputation();

            m.onLoadingStart();
            var params = ctrl.signParams();

            Auth.registration(params.accountKeypair, params.login, params.password, params.phone, ctrl.progressCB)
                .then((wallet) => {
                    Auth.loginByPasswordHash(params.login, wallet.passwordHash)
                        .then(function () {
                            m.onLoadingEnd();
                            m.onProcedureEnd();
                            m.startComputation();
                            ctrl.showProgress(false);
                            ctrl.progress(0);
                            m.endComputation();
                            window.localStorage.setItem('lastLogin', wallet.username);
                            window.localStorage.removeItem('encryptedPasswordHash');
                            m.route('/pin');
                        })
                        .catch(err => {
                            console.error(err);
                            m.startComputation();
                            ctrl.showProgress(false);
                            ctrl.progress(0);
                            m.endComputation();
                            m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                        })
                })
                .catch(err => {
                    console.error(err);
                    m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                })
        };
    },

    view: function (ctrl) {
        if (ctrl.showSmsSubmit()) {
            return Sign.viewSmsSubmit(ctrl);
        }

        if (ctrl.showProgress()) {
            return Sign.viewProgress(ctrl);
        }

        return <div class="wrapper-center-form">
            <div class="form-center">
        <div class="wrapper-page">

            <div class="text-center">
                <a href="index.html" class="logo logo-lg">
                    <img class="logo-img" src="./assets/img/logo_yellow-with-blue.png" />
                </a>
            </div>
            <br/>

            <form class="form-horizontal m-t-20" onsubmit={ctrl.sendSignSms.bind(ctrl)}>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="text"
                               placeholder={Conf.tr("Username")}
                               autocapitalize="none" autofocus
                               name="login"
                               title={Conf.tr("Characters and numbers allowed")}/>
                        <i class="md md-account-circle form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="tel" name="phone" required="required"
                               placeholder={Conf.tr("Enter your mobile phone number: ") + Conf.phone.view_mask}
                               title={Conf.tr("Ukrainian phone number format allowed: +38 (050) 123-45-67")}
                               oninput={ctrl.addPhoneViewPattern.bind(ctrl)}
                               value={ctrl.phone()}
                        />
                        <i class="md md-account-circle form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="password" required="required"
                               autocapitalize="none"
                               placeholder={Conf.tr("Password")} name="password" pattern=".{6,}"
                               title={Conf.tr("8 characters minimum")}/>
                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="password" required="required"
                               autocapitalize="none"
                               placeholder={Conf.tr("Retype Password")} name="repassword" pattern=".{6,}"
                               title={Conf.tr("8 characters minimum")}/>
                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group m-t-20">
                    <div class="col-xs-6 text-left">
                        <a href="/" config={m.route}
                           class="btn btn-default btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr("Back")}</a>
                    </div>
                    <div class="col-xs-6 text-right">
                        <button class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5"
                                type="submit">{Conf.tr("Sign up")}
                        </button>
                    </div>
                </div>

            </form>
        </div>
        </div>
        </div>
    },

    viewSmsSubmit: function (ctrl) {
        return <div class="wrapper-center-form">
            <div class="form-center">
            <div class="wrapper-page">
                <div class="auth-form">
                    <div class="text-center">
                        <h3>{Conf.tr("Submit with a code from sms")}</h3>
                    </div>
                    <form class="form-horizontal m-t-30" onsubmit={ctrl.submitOTP.bind(ctrl)}>
                        <div id="by-login" class="tab-pane active">
                            <div class="form-group">
                                <div class="col-xs-12">
                                    <input class="form-control" type="text"
                                           placeholder={Conf.tr("Code")}
                                           autocapitalize="none"
                                           name="otp"
                                           title={Conf.tr("Only numbers allowed")}/>
                                    <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                                </div>
                            </div>
                            <div class="text-center">
                                {
                                    ctrl.resendSmsLabel() ?
                                        <div class="m-t-10">
                                            <a href="#" onclick={ctrl.resendSms.bind(ctrl)} class="">
                                                {Conf.tr("Resend sms")}
                                            </a>
                                        </div>
                                        :
                                        <p class="text-muted">{Conf.tr('Wait for request new SMS')}: {Helpers.getTimeFromSeconds(ctrl.leaveSecondsToResend())}</p>
                                }
                            </div>
                            <div class="form-group m-t-20 text-center">
                                <button
                                    class="form-control btn btn-primary btn-lg btn-custom waves-effect w-md waves-light m-b-5">
                                    {Conf.tr("Create")}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        </div>
    },

    viewProgress: function(ctrl) {
        return <div class="wrapper-center-form">
            <div class="form-center">
                <div class="form-group m-t-10">
                    {m(ProgressBar, {value: ctrl.progress, text: Conf.tr("Encrypting your account for security")})}
                </div>
            </div>
        </div>
    }
};
