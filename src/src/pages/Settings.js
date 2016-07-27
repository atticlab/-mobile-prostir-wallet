var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Settings = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.exists()) {
            return m.route('/');
        }

        this.phone = m.prop(Auth.wallet().phone || '');
        this.email = m.prop(Auth.wallet().email || '');

        this.changePassword = function (e) {
            e.preventDefault();

            if (!e.target.oldpassword.value || !e.target.password.value || !e.target.repassword.value) {
                $.Notification.notify('error', 'top center', 'Error', 'Please, fill all required fields');
                return;
            }

            if (e.target.password.value.length < 6) {
                $.Notification.notify('error', 'top center', 'Error', 'Password should have 6 chars min');
                return;
            }

            if (e.target.password.value != e.target.repassword.value) {
                $.Notification.notify('error', 'top center', 'Error', 'Passwords should match');
                return;
            }

            if (e.target.oldpassword.value == e.target.password.value) {
                $.Notification.notify('error', 'top center', 'Error', 'New password cannot be same as old');
                return;
            }

            m.onLoadingStart();
            m.startComputation();

            Auth.updatePassword(e.target.oldpassword.value, e.target.password.value)
                .then(function() {
                    $.Notification.notify('success', 'top center', 'Success', 'Password changed');
                    e.target.reset();
                })
                .catch(function(err) {
                    $.Notification.notify('error', 'top center', 'Error', 'Cannot change password');
                })
                .then(function() {
                    m.onLoadingEnd();
                    m.endComputation();
                })
        }

        this.bindData = function (e) {
            e.preventDefault();

            if (e.target.email.value != Auth.wallet().email || e.target.phone.value != Auth.wallet().phone) {

                // TODO: add telephone validator
                // TODO: add email validator
                // TODO: add input mask for telephone number input field

                m.onLoadingStart();
                m.startComputation();

                Auth.update({
                    email: e.target.email.value,
                    phone: e.target.phone.value
                })
                    .then(function () {
                        $.Notification.notify('success', 'top center', 'Success', 'Profile saved');
                    })
                    .catch(function (err) {
                        if (err.message) {
                            $.Notification.notify('error', 'top center', 'Error', err.message);
                        } else {
                            $.Notification.notify('error', 'top center', 'Error', 'Cannot update profile details');
                        }
                    })
                    .then(function() {
                        ctrl.phone = m.prop(Auth.wallet().phone || '');
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
                <div class="container">
                    <h2>Settings</h2>
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">Change password</div>
                                <div class="panel-body">
                                    <form class="form-horizontal" onsubmit={ctrl.changePassword.bind(ctrl)}>
                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">Old password:</label>
                                                <input class="form-control" type="password" required="required" name="oldpassword"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">New password:</label>
                                                <input class="form-control" type="password" required="required" name="password"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">Repeat new password:</label>
                                                <input class="form-control" type="password" required="required" name="repassword"/>
                                            </div>
                                        </div>

                                        <div class="form-group m-t-20">
                                            <div class="col-sm-7">
                                                <button class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                        type="submit">
                                                    Change
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">Change additional data</div>
                                <div class="panel-body">
                                    <form class="form-horizontal" onsubmit={ctrl.bindData.bind(ctrl)}>
                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">Email:</label>
                                                <input class="form-control" type="text" required="required" name="email" oninput={m.withAttr("value", ctrl.email)} value={ctrl.email()}/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">Phone:</label>
                                                <input class="form-control" type="text" required="required" name="phone" oninput={m.withAttr("value", ctrl.phone)} value={ctrl.phone()}/>
                                            </div>
                                        </div>
                                        {

                                            ctrl.phone() != Auth.wallet().phone || ctrl.email() != Auth.wallet().email ?
                                                <div class="form-group m-t-20">
                                                    <div class="col-sm-7">
                                                        <button class="btn btn-primary btn-custom w-md waves-effect waves-light" type="submit">Save</button>
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
