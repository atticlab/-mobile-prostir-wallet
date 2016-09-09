var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Settings = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        //return phone in pattern or prefix
        this.getPhoneWithViewPattern = function(number){
            if(number.substr(0, Conf.phone.prefix.length) != Conf.phone.prefix){
                number = Conf.phone.prefix;
            }
            return m.prop(VMasker.toPattern(number, {pattern: Conf.phone.view_mask, placeholder: "x"}));
        }

        this.addPhoneViewPattern = function(e) {
            ctrl.phone = ctrl.getPhoneWithViewPattern(e.target.value);
        };

        this.phone = ctrl.getPhoneWithViewPattern(Conf.phone.prefix + Auth.wallet().phone);
        this.email = m.prop(Auth.wallet().email || '');

        this.changePassword = function (e) {
            e.preventDefault();

            if (!e.target.oldpassword.value || !e.target.password.value || !e.target.repassword.value) {
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

            if (e.target.oldpassword.value == e.target.password.value) {
                m.flashError(Conf.tr("New password cannot be same as old"));
                return;
            }

            m.onLoadingStart();
            m.startComputation();

            Auth.updatePassword(e.target.oldpassword.value, e.target.password.value)
                .then(function() {
                    m.flashSuccess(Conf.tr("Password changed"));
                    e.target.reset();
                })
                .catch(function(err) {
                    m.flashError(Conf.tr("Cannot change password"));
                })
                .then(function() {
                    m.endComputation();
                })
        }

        this.bindData = function (e) {
            e.preventDefault();

            //reformat phone to database format
            e.target.phone.value = VMasker.toPattern(e.target.phone.value, Conf.phone.db_mask);
            e.target.phone.value = e.target.phone.value.substr(2);

            if (e.target.email.value != Auth.wallet().email || e.target.phone.value != Auth.wallet().phone) {

                //validate email
                var email_re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (!email_re.test(e.target.email.value)) {
                    return m.flashError(Conf.tr("Invalid email"));
                }

                //validate phone
                if (e.target.phone.value.length > 0 && e.target.phone.value.match(/\d/g).length != Conf.phone.length) {
                    return m.flashError(Conf.tr("Invalid phone"));
                }

                m.onLoadingStart();
                m.startComputation();

                var dataToUpdate = {};
                if (e.target.email.value) {dataToUpdate.email = e.target.email.value}
                if (e.target.phone.value) {dataToUpdate.phone = e.target.phone.value}

                Auth.update(dataToUpdate)
                    .then(function () {
                        m.flashSuccess(Conf.tr("Profile saved"));
                    })
                    .catch(function (err) {
                        if (err.message) {
                            m.flashError(err.message);
                        } else {
                            m.flashError(Conf.tr("Cannot update profile details"));
                        }
                    })
                    .then(function() {
                        ctrl.phone = ctrl.getPhoneWithViewPattern(Conf.phone.prefix + Auth.wallet().phone)
                        ctrl.email = m.prop(Auth.wallet().email || '');

                        m.endComputation();
                    })
            }
        }
    },

    view: function (ctrl) {
        return [m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    <h2>{Conf.tr("Settings")}</h2>
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">{Conf.tr("Change password")}</div>
                                <div class="panel-body">
                                    <form class="form-horizontal" onsubmit={ctrl.changePassword.bind(ctrl)}>
                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">{Conf.tr("Old password")}:</label>
                                                <input class="form-control" type="password" required="required" name="oldpassword"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">{Conf.tr("New password")}:</label>
                                                <input class="form-control" type="password" required="required" name="password"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">{Conf.tr("Repeat new password")}:</label>
                                                <input class="form-control" type="password" required="required" name="repassword"/>
                                            </div>
                                        </div>

                                        <div class="form-group m-t-20">
                                            <div class="col-sm-7">
                                                <button class="btn btn-primary btn-custom w-md waves-effect waves-light"
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
                            <div class="panel panel-primary">
                                <div class="panel-heading">{Conf.tr("Change additional data")}</div>
                                <div class="panel-body">
                                    <form class="form-horizontal" onsubmit={ctrl.bindData.bind(ctrl)}>
                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">{Conf.tr("Email")}:</label>
                                                <input class="form-control" type="text" name="email" oninput={m.withAttr("value", ctrl.email)} value={ctrl.email()}/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">{Conf.tr("Phone")}:</label>
                                                <input class="form-control" type="text" name="phone" placeholder={Conf.phone.view_mask} oninput={ctrl.addPhoneViewPattern.bind(ctrl)} value={ctrl.phone()}/>
                                            </div>
                                        </div>
                                        {

                                            ctrl.phone() != Auth.wallet().phone || ctrl.email() != Auth.wallet().email ?
                                                <div class="form-group m-t-20">
                                                    <div class="col-sm-7">
                                                        <button class="btn btn-primary btn-custom w-md waves-effect waves-light" type="submit">{Conf.tr("Save")}</button>
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
                </div>
            </div>

        ];
    }
};
