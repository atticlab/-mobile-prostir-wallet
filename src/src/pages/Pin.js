const Conf = require('../config/Config.js');
const Navbar = require('../components/Navbar.js');
const Payments = require('../components/Payments.js');
const Footer = require('../components/Footer.js');
const Auth = require('../models/Auth.js');
const PinInput = require('../components/Pin-input');
const swal = require('sweetalert2');

module.exports = {
    controller: function () {
        let ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.pin = m.prop(null);

        this.submit = function (e) {
            e.preventDefault();

            if (ctrl.pin().length !== 4) {
                m.flashError(Conf.tr("PIN should contain 4 digits"));
                return;
            }

            let numRegex = /[0-9]{4}/;
            if (!numRegex.test(ctrl.pin())) {
                m.flashError(Conf.tr("Error! You can enter only digits"));
                return false;
            }

            return Conf.SmartApi.Wallets.encryptAuthData({
                passwordHash: Auth.wallet().passwordHash,
                pin         : ctrl.pin()
            })
                .then(data => {
                    window.localStorage.setItem('encryptedPasswordHash', data.encryptedPasswordHash);
                    window.localStorage.setItem('pinAttempts', 3);

                    // delete Auth.wallet().passwordHash;

                    m.flashSuccess(Conf.tr("PIN was created successfully"));
                    m.route('/home');
                })
                .catch(err => {
                    console.error(err);
                    return m.flashError("Error while creating pin");
                });
        };

        this.removePin = function (e) {
            e.preventDefault();

            if (Auth.checkPinCreated()) {
                m.onProcedureStart();

                return Conf.SmartApi.Wallets.decryptAuthData({
                    encryptedPasswordHash: window.localStorage.getItem('encryptedPasswordHash'),
                    pin                  : ctrl.pin()
                })
                    .then(authData => {

                        console.log("-------- authData in removePin --------");
                        console.log(authData);

                        return Conf.SmartApi.Wallets.get({
                            username: window.localStorage.getItem('lastLogin'),
                            passwordHash: authData.decryptedPasswordHash,
                        });
                    })
                    .then(() => {
                        window.localStorage.removeItem('encryptedPasswordHash');
                        m.onProcedureEnd();
                        m.flashSuccess(Conf.tr("PIN was successfully removed"));
                        m.route('/home');
                    })
                    .catch(err => {
                        console.error(err);
                        return m.flashError(Conf.tr("Wrong PIN! Try again"));
                    });
            } else {
                return m.flashError(Conf.tr("Error! PIN is not created yet"));
            }
        };

        this.cancel = function (e) {
            e.preventDefault();

            swal({
                title: Conf.tr("Are you sure?"),
                text: Conf.tr("If you don't create a PIN, you have to wait for decrypting account every time you log in"),
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#1D7DCA',
                cancelButtonColor: '#ED3C39',
                confirmButtonText: Conf.tr("Yes, skip it"),
                cancelButtonText: Conf.tr("Cancel")
            }).then(() => {
                m.route('/home');
            })
            .catch(() => {
                m.route('/pin');
            })
        }
    },

    view: function (ctrl) {
        return <div class="wrapper-page">
            <div class="text-center logo">
                <img src="assets/img/logo.svg" alt="Smartmoney logo"/>
                <br />
                <h4>{Auth.checkPinCreated() ? Conf.tr("Remove PIN") : Conf.tr("Create PIN")}</h4>
            </div>

            <form class="form-horizontal m-t-20" onsubmit={ctrl.submit.bind(ctrl)}>

                {m(PinInput, {pin: ctrl.pin,  cb: ctrl.inputCompleteCB, options: {
                    label: true,
                    labelText: !Auth.checkPinCreated() ?
                        Conf.tr("Please create a PIN for encrypting your account. This allows you to quickly and safely sign in to your account without waiting for account decrypting next time.")
                        : Conf.tr("Enter your PIN to remove it")
                }})}

                <div class="form-group m-t-20">
                    <div class="col-xs-6">
                        {!Auth.checkPinCreated() ?
                            <button class="btn btn-warning btn-custom waves-effect w-md waves-light m-b-5"
                                    type="button" onclick={ctrl.cancel.bind(ctrl)}>
                                {Conf.tr("Cancel")}
                            </button>
                        :
                            <a href="/home" config={m.route}
                               class="btn btn-inverse btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr("Back")}</a>
                        }
                    </div>

                    <div class="col-xs-6 text-right">
                        {Auth.checkPinCreated() ?
                            <button class="btn btn-danger btn-custom waves-effect w-md waves-light m-b-5"
                                    type="button" onclick={ctrl.removePin.bind(ctrl)}>{Conf.tr("Remove PIN")}
                            </button>
                            :
                            <button class="btn btn-primary btn-custom waves-effect w-md waves-light m-b-5"
                                    type="submit">{Conf.tr("Create PIN")}
                            </button>
                        }
                    </div>
                </div>
            </form>
        </div>
    }
};
