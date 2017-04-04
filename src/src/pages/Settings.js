var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');
var ProgressBar = require('../components/ProgressBar');

var Settings = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.progressCb = function (stage) {
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

        this.myScroll = null;
        this.initPullToRefresh = function () {
            if (ctrl.myScroll == null) {
                var topnavSize = document.getElementById('topnav').offsetHeight;
                document.getElementById('container').style.top = topnavSize + 10 + "px";
                document.addEventListener('touchmove', function (e) {
                    e.preventDefault();
                }, false);
                ctrl.myScroll = new IScroll('#container', {
                    useTransition: true,
                    startX: 0,
                    topOffset: 0
                });
            }
        };

        this.progress = m.prop(0);
        this.showProgress = m.prop(false);

        setTimeout(function () {
            ctrl.initPullToRefresh();
        }, 500);
        
        this.email = m.prop(Auth.wallet().email || '');

        this.changePassword = function (e) {
            e.preventDefault();

            var pass = e.target.password.value;
            var oldpass = e.target.oldpassword.value;

            if (!oldpass || !pass || !e.target.repassword.value) {
                m.flashError(Conf.tr("Please, fill all required fields"));
                return;
            }

            if (pass.length < 6) {
                m.flashError(Conf.tr("Password should have 6 chars min"));
                return;
            }

            if (pass != e.target.repassword.value) {
                m.flashError(Conf.tr("Passwords should match"));
                return;
            }

            if (oldpass == pass) {
                m.flashError(Conf.tr("New password cannot be same as old"));
                return;
            }

            let regex = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{1,}$/;
            if (!regex.test(pass)) {
                return m.flashError(Conf.tr("Password must contain at least one upper case letter and one digit"));
            }

            m.onLoadingStart();
            m.startComputation();
            ctrl.showProgress(true);
            m.endComputation();

            Auth.updatePassword(oldpass, pass, ctrl.progressCb)
                .then(function () {
                    m.flashSuccess(Conf.tr("Password changed"));
                    window.localStorage.removeItem('encryptedPasswordHash');
                    e.target.reset();
                })
                .catch(function (err) {
                    console.error(err);
                    m.flashError(err.message ? Conf.tr(err.message) : Conf.tr("Cannot change password"));
                })
                .then(function () {
                    m.startComputation();
                    ctrl.showProgress(false);
                    ctrl.progress(0);
                    m.endComputation();
                })
        };

        this.bindData = function (e) {
            e.preventDefault();

            if (e.target.email.value != Auth.wallet().email) {

                m.onLoadingStart();

                var dataToUpdate = {};

                    //validate email
                if (e.target.email.value.length > 0) {
                    var email_re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    if (!email_re.test(e.target.email.value)) {
                        return m.flashError(Conf.tr("Invalid email"));
                    }
                }
                dataToUpdate.email = e.target.email.value;

                Auth.update(dataToUpdate)
                    .then(function () {
                        m.flashSuccess(Conf.tr("Profile saved"));
                    })
                    .catch(function (err) {
                        if (err.message) {
                            if (err.message == 'Nothing to update') {
                                m.flashSuccess(Conf.tr(err.message));
                            } else {
                                m.flashError(err.message);
                            }
                        } else {
                            m.flashError(Conf.tr("Cannot update profile details"));
                        }
                    })
                    .then(function () {
                        m.startComputation();
                        Auth.wallet().email = dataToUpdate.email;
                        ctrl.email = m.prop(Auth.wallet().email || '');
                        m.onLoadingEnd();
                        m.endComputation();
                    })
            }
        }
    },

    view: function (ctrl) {
        return [m.component(Navbar),
            <div class="wrapper">
                <div class="container puller" id="container">
                    {ctrl.showProgress() ?
                        <div class="form-group m-t-20">
                            {m(ProgressBar, {value: ctrl.progress, text: Conf.tr("Encrypting your new password")})}
                        </div>
                        :
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="panel panel-color panel-inverse">
                                    <div class="panel-heading">
                                        <h3 class="panel-title">{Conf.tr("Change password")}</h3>
                                    </div>
                                    <div class="panel-body">
                                        <form class="form-horizontal" onsubmit={ctrl.changePassword.bind(ctrl)}>
                                            <div class="form-group">
                                                <div class="col-xs-12">
                                                    <label for="">{Conf.tr("Old password")}:</label>
                                                    <input class="form-control" type="password" required="required"
                                                           name="oldpassword"/>
                                                </div>
                                            </div>

                                            <div class="form-group">
                                                <div class="col-xs-12">
                                                    <label for="">{Conf.tr("New password")}:</label>
                                                    <input class="form-control" type="password" required="required"
                                                           name="password"/>
                                                </div>
                                            </div>

                                            <div class="form-group">
                                                <div class="col-xs-12">
                                                    <label for="">{Conf.tr("Repeat new password")}:</label>
                                                    <input class="form-control" type="password" required="required"
                                                           name="repassword"/>
                                                </div>
                                            </div>

                                            <div class="form-group m-t-20">
                                                <div class="col-sm-7">
                                                    <button
                                                        class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                        type="submit">
                                                        {Conf.tr("Change")}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="panel panel-color panel-inverse">
                                    <div class="panel-heading">
                                        <h3 class="panel-title">{Conf.tr("Change additional data")}</h3>
                                    </div>
                                    <div class="panel-body">
                                        <form class="form-horizontal" onsubmit={ctrl.bindData.bind(ctrl)}>
                                            <div class="form-group">
                                                <div class="col-xs-12">
                                                    <label for="">{Conf.tr("Email")}:</label>
                                                    <input class="form-control" type="text" name="email"
                                                           oninput={m.withAttr("value", ctrl.email)}
                                                           value={ctrl.email()}/>
                                                </div>
                                            </div>

                                            {

                                                ctrl.email() != Auth.wallet().email ?
                                                    <div class="form-group m-t-20">
                                                        <div class="col-sm-7">
                                                            <button
                                                                class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                                type="submit">{Conf.tr("Save")}</button>
                                                        </div>
                                                    </div>
                                                    :
                                                    ''
                                            }
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>

        ];
    }
};
