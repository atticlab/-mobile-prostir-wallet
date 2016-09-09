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
                m.flashError(Conf.tr("Error"), Conf.tr("Password should have 6 chars min"));
                return;
            }

            if (e.target.password.value != e.target.repassword.value) {
                m.flashError(Conf.tr("Passwords should match"));
                return;
            }

            m.onLoadingStart();
            m.startComputation();
            Auth.registration(e.target.login.value, e.target.password.value)
                .then(() => {
                        var qr = Qr.qrcode(4, 'M');
                        qr.addData(e.target.password.value);
                        qr.make();
                        var imgTag = qr.createImgTag(4);
                        ctrl.qr(m.trust(imgTag));
                    },
                    err => {
                        m.flashError(err.message ? Conf.tr(err.message) : Conf.tr('Service error. Please contact support'));
                    })
                .then(() => {
                    m.onLoadingEnd();
                    m.endComputation();
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
                            <p class="panel-sub-title font-13 text-muted">{Conf.tr("Print this QR-code and keep it in secure place. This is the only possible way to recover your password")}!</p>
                        </div>
                        <div class="panel-body">
                            <div class="text-center">
                                {code}
                                <br/>
                                <a href={img} download="qr_password.gif">{Conf.tr("Save code")}</a>
                                <br/>
                                <br/>
                                <a href="/login" config={m.route} class="btn btn-success btn-custom waves-effect w-md waves-light m-b-5">{Conf.tr("Log in")}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }

        return <div class="wrapper-page">

            <div class="text-center">
                <a href="index.html" class="logo logo-lg"><i class="md md-equalizer"></i> <span>SmartMoney</span> </a>
            </div>

            <h4 class="text-center">{Conf.tr("Sign up new account")}</h4>

            <form class="form-horizontal m-t-20" onsubmit={ctrl.signup.bind(ctrl)}>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="text" required="required" placeholder={Conf.tr("Username")} name="login" pattern="[A-Za-z0-9_-]{3,}" title={Conf.tr("Characters and numbers allowed")} />
                        <i class="md md-account-circle form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="password" required="required" placeholder={Conf.tr("Password")} name="password" pattern=".{6,}" title={Conf.tr("6 characters minimum")}/>
                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="password" required="required" placeholder={Conf.tr("Retype Password")} name="repassword" pattern=".{6,}" title={Conf.tr("6 characters minimum")}/>
                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group text-right m-t-20">
                    <div class="col-sm-5 text-right">
                        <a href="/login" config={m.route} style="margin-top: 8px;display: block;">{Conf.tr("Already registered")}?</a>
                    </div>
                    <div class="col-sm-7">
                        <button class="btn btn-primary btn-custom w-md waves-effect waves-light">{Conf.tr("Sign up")}</button>
                    </div>
                </div>
            </form>
        </div>
    }
};
