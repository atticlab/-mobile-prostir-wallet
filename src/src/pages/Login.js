var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Login = module.exports = {
    controller: function() {
        if (Auth.exists()) {
            return m.route('/home');
        }

        this.login = function(e) {
            var ctrl = this;

            e.preventDefault();
            m.onLoadingStart();

            Auth.login(e.target.login.value, e.target.password.value)
                .then(function() {
                    m.route('/home');
                }, function(err) {
                    switch (err.name) {
                        case 'WalletNotFound':
                            $.Notification.notify('error', 'top center', 'Error', 'Login/password combination is invalid');
                            break;
                        case 'ConnectionError':
                            $.Notification.notify('error', 'top center', 'Error', 'Connection error');
                            break;
                        default:
                            $.Notification.notify('error', 'top center', 'Error', err.name);
                    }

                })
                .then(function(){
                    m.onLoadingEnd();
                })
        };
    },

    view: function(ctrl) {
        return <div class="wrapper-page">

            <div class="text-center">
                <a href="index.html" class="logo logo-lg"><i class="md md-equalizer"></i> <span>SmartMoney</span> </a>
            </div>

            <form class="form-horizontal m-t-20" onsubmit={ctrl.login.bind(ctrl)}>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="text" required="required" placeholder="Username" name="login"/>
                        <i class="md md-account-circle form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-xs-12">
                        <input class="form-control" type="password" required="required" placeholder="Password" name="password"/>
                        <i class="md md-vpn-key form-control-feedback l-h-34"></i>
                    </div>
                </div>

                <div class="form-group text-right m-t-20">
                    <div class="col-lg-5 col-xs-6 text-left">
                        <a href="/sign" config={m.route} style="margin-top: 8px;display: block;">Create an account</a>
                    </div>
                    <div class="col-lg-7 col-xs-6">
                        <button class="btn btn-primary btn-custom w-md waves-effect waves-light" type="submit">Log In
                        </button>
                    </div>
                </div>
            </form>
        </div>
    }
};
