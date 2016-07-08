var Auth = require('../models/Auth.js');

var Navbar = module.exports = {

    controller: function() {
        var ctrl = this;

        this.visible = m.prop(false);

        this.toggleVisible = function() {
            this.visible(!this.visible());
        }
    },

    view: function(ctrl) {
        return <header id="topnav">
            <div class="topbar-main">
                <div class="container">

                    <div class="logo">
                        <a href="/" config={m.route} class="logo"><i class="md md-equalizer"></i> <span>Web Wallet</span> </a>
                    </div>

                    <div class="menu-extras">

                        <ul class="nav navbar-nav navbar-right pull-right">
                            <li class="dropdown">
                                <a href="" class="dropdown-toggle waves-effect waves-light profile" data-toggle="dropdown" aria-expanded="true"><img src="./assets/img/avatar-1.jpg" alt="user-img" class="img-circle" /></a>
                                <ul class="dropdown-menu">
                                    <li><a href="#" onclick={Auth.logout}><i class="ti-power-off m-r-5"></i> Logout</a></li>
                                </ul>
                            </li>
                        </ul>

                        <div class="menu-item">
                            <a onclick={ctrl.toggleVisible.bind(ctrl)} class={ctrl.visible() ? 'open navbar-toggle' : 'navbar-toggle'}>
                                <div class="lines">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </div>


            <div class="navbar-custom">
                <div class="container">
                <div id="navigation" style={ctrl.visible()? 'display:block;' : ''}>
                    <ul class="navigation-menu">
                        <li class="has-submenu active">
                            <a href="/" config={m.route}><i class="md md-dashboard"></i>Dashboard</a>
                        </li>
                        <li class="has-submenu">
                            <a href="/transfer" config={m.route}><i class="fa fa-money"></i>Transfer Money</a>
                        </li>

                        <li class="has-submenu">
                            <a href="/invoice" config={m.route}><i class="md md-payment"></i>Create invoice</a>
                        </li>

                        <li class="has-submenu">
                            <a href="/settings" config={m.route}><i class="md md-settings"></i>Settings</a>
                        </li>
                    </ul>
                </div>
            </div>
            </div>
        </header>
    }
};

/*
<li class="dropdown hidden-xs">
    <a href="#" data-target="#" class="dropdown-toggle waves-effect waves-light"
       data-toggle="dropdown" aria-expanded="true">
        <i class="md md-notifications"></i> <span
            class="badge badge-xs badge-pink">3</span>
    </a>
    <ul class="dropdown-menu dropdown-menu-lg">
        <li class="text-center notifi-title">Notification</li>
        <li class="list-group nicescroll notification-list">
            <a href="javascript:void(0);" class="list-group-item">
                <div class="media">
                    <div class="pull-left p-r-10">
                        <em class="fa fa-diamond noti-primary"></em>
                    </div>
                    <div class="media-body">
                        <h5 class="media-heading">Lorem</h5>
                        <p class="m-0">
                            <small>ipsum</small>
                        </p>
                    </div>
                </div>
            </a>
        </li>

        <li>
            <a href="javascript:void(0);" class=" text-right">
                <small><b>See all notifications</b></small>
            </a>
        </li>

    </ul>
</li>*/