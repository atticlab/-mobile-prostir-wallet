var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Settings = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.exists()) {
            return m.route('/');
        }

        this.changePassword = function (e) {

            var oldPassword = parseFloat(e.target.oldPassword.value);
            var newPassword = parseFloat(e.target.newPassword.value);
            var newRePassword = parseFloat(e.target.newRePassword.value);

            e.preventDefault();
            this.clearPassForm(e);
            $.Notification.notify('success', 'top center', 'Success', 'Password changed');
        }

        this.changeAdditionalData = function (e) {

            var email = parseFloat(e.target.email.value);
            var phone = parseFloat(e.target.phone.value);
            e.preventDefault();
            Auth.updateAdvData(email, phone)
                .then(function () {
                    this.clearAddForm(e);
                    $.Notification.notify('success', 'top center', 'Success', 'Additional data saved');
                }, function (err) {
                    $.Notification.notify('error', 'top center', 'Error', 'Additional data saving error! '+err);
                });
        }

        this.clearPassForm = function (e) {
            e.target.oldPassword.value = '';
            e.target.newPassword.value = '';
            e.target.newRePassword.value = '';
        }
        this.clearAddForm = function (e) {
            e.target.email.value = '';
            e.target.phone.value = '';
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
                                                <input class="form-control" type="text" required="" id="oldPassword"
                                                       name="oldPassword"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">New password:</label>
                                                <input class="form-control" type="text" required="" id="newPassword"
                                                       name="newPassword"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">New repassword:</label>
                                                <input class="form-control" type="text" required="" id="newRePassword"
                                                       name="newRePassword"/>
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
                                    <form class="form-horizontal" onsubmit={ctrl.changeAdditionalData.bind(ctrl)}>
                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">Email:</label>
                                                <input class="form-control" type="text" required="" id="email"
                                                       name="email"/>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <div class="col-xs-12">
                                                <label for="">Phone:</label>
                                                <input class="form-control" type="text" required="" id="phone"
                                                       name="phone"/>
                                            </div>
                                        </div>

                                        <div class="form-group m-t-20">
                                            <div class="col-sm-7">
                                                <button class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                        type="submit">
                                                    Save
                                                </button>
                                            </div>
                                        </div>
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
