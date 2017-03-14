var Qr = require('../../node_modules/qrcode-npm/qrcode');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');
var PinInput = require('../components/Pin-input');
var ProgressBar = require('../components/ProgressBar');

var Sign = module.exports = {
    controller: function () {
        var ctrl = this;

        if (Auth.keypair()) {
            return m.route('/home');
        }

        window.plugins.sim.getSimInfo(simInfo => {
            if (simInfo.phoneNumber) {
                ctrl.phone = m.prop(VMasker.toPattern(simInfo.phoneNumber, {pattern: Conf.phone.view_mask, placeholder: "x"}));
                m.redraw(true);
            }
        }, error => {
            console.log(error);
        });

        this.progress = m.prop(0);
        this.showProgress = m.prop(false);

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

        this.signup = function (e) {
            e.preventDefault();

            let pass = e.target.password.value;

            if (!e.target.phone.value || !pass || !e.target.repassword.value) {
                m.flashError(Conf.tr("Please, fill all required fields"));
                return;
            }

            if (pass.length < 8) {
                m.flashError(Conf.tr("Password should have 8 chars min"));
                return;
            }

            let regex = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{1,}$/;
            if (!regex.test(pass)) {
                return m.flashError(Conf.tr("Password must contain at least one upper case letter and one digit"));
            }


            if (pass != e.target.repassword.value) {
                m.flashError(Conf.tr("Passwords should match"));
                return;
            }

            let phoneNum = VMasker.toPattern(e.target.phone.value, Conf.phone.db_mask).substr(2);

            if (phoneNum.length > 0 && phoneNum.match(/\d/g).length != Conf.phone.length) {
                return m.flashError(Conf.tr("Invalid phone"));
            }

            m.startComputation();
            ctrl.showProgress(true);
            m.endComputation();

            m.onLoadingStart();
            Auth.registration(phoneNum, pass, ctrl.progressCB)
                .then((wallet) => {
                    console.log("-------- wallet --------");
                    console.log(wallet);
                    console.info('success');

                    console.log("-------- wallet.passwordHash --------");
                    console.info(wallet.passwordHash);

                    Auth.loginByPasswordHash(phoneNum, wallet.passwordHash)
                        .then(function () {
                            m.onLoadingEnd();
                            m.onProcedureEnd();
                            ctrl.showProgress(false);
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
        return <div class="wrapper-page">

            <div class="text-center">
                <a href="index.html" class="logo logo-lg">
                    {((Conf.localeStr == 'uk') || (Conf.localeStr == 'ru')) ?
                        <img class="logo-img" src="./img/logo-ua-tagline.svg" />
                        : <img class="logo-img" src="./img/logo-en-tagline.svg" />
                    }
                </a>
            </div>

            {ctrl.showProgress() ?
                <div class="form-group m-t-10">
                    {m(ProgressBar, {value: ctrl.progress, text: Conf.tr("Encrypting your account for security")})}
                </div>
                :
                <form class="form-horizontal m-t-20" onsubmit={ctrl.signup.bind(ctrl)}>

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
                        <div class="col-xs-6">
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
            }
        </div>
    }
};
