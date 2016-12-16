var Conf = require('./config/Config.js');

// Loading spinner
m.onLoadingStart = function (stage) {
    /*if (typeof stage != 'undefined') {
        document.getElementById('data-stage').innerHTML = stage;
    }*/
    m.onIdleEnd();
    document.getElementById('data-spinner').style.display = 'block';
};
m.onLoadingEnd = function () {
    document.getElementById('data-spinner').style.display = 'none';
};
m.onIdleStart = function (stage) {
    /*if (typeof stage != 'undefined') {
        document.getElementById('idle-stage').innerHTML = stage;
    }*/
    m.onLoadingEnd();
    document.getElementById('idle-spinner').style.display = 'block';
};
m.onIdleEnd = function () {
    document.getElementById('idle-spinner').style.display = 'none';
};

// Wrapper for notification which stops animation
m.flashError = function (msg) {
    m.onLoadingEnd();
    m.onIdleEnd();
    $.Notification.notify('error', 'top center', Conf.tr("Error"), msg);
};
m.flashApiError = function (err) {
    if (err && typeof err.message != 'undefined' && err.message == 'Invalid signature') {
        window.location.href = '/';
        return;
    }
    m.onLoadingEnd();
    m.onIdleEnd();
    var msg = err.message ? Conf.tr(err.message) + (err.description ? ': ' + Conf.tr(err.description) : '') : Conf.tr('Unknown error. Contact support');
    $.Notification.notify('error', 'top center', Conf.tr("Error"), msg);
};
m.flashSuccess = function (msg) {
    m.onLoadingEnd();
    m.onIdleEnd();
    $.Notification.notify('success', 'top center', Conf.tr("Success"), msg);
};

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // `load`, `deviceready`, `offline`, and `online`.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of `this` is the event. In order to call the `receivedEvent`
    // function, we must explicity call `app.receivedEvent(...);`
    onDeviceReady: function () {
        // Routing
        m.route.mode = 'hash';
        m.route(document.getElementById('app'), "/", {
            "/": require('./pages/Login.js'),
            "/home": require('./pages/Home.js'),
            "/logout": require('./pages/Logout.js'),
            "/invoice": require('./pages/Invoice.js'),
            "/sign": require('./pages/Sign.js'),
            "/transfer": require('./pages/Transfer.js'),
            "/settings": require('./pages/Settings.js'),
            "/transaction/:trans_id/:target_acc/:amount/:asset": require('./pages/Transaction.js'),
            "/cards": require('./pages/Cards.js'),
            "/payments": require('./pages/Payments.js')
        });

        app.receivedEvent('idle-spinner');
    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        parentElement.setAttribute('style', 'display:none;');

        document.addEventListener("offline", function() {
            if (Conf.networkStatus !== false) {
                m.flashError(Conf.tr('No internet connection'));
                Conf.networkStatus = false;
            }
        }, false);

        document.addEventListener("online", function() {
            if (Conf.networkStatus === false) {
                m.flashSuccess(Conf.tr("Internet connection established"));
                Conf.networkStatus = true;
            }
        }, false);

        if ((device != 'undefined') //it is if network plugin can't work
            && (device.platform != 'undefined')
            && (device.platform != 'browser')) {
            Conf.networkStatus = true;
        }
    }
};

app.initialize();