// Loading spinner
m.onLoadingStart = function () { document.getElementById('spinner').style.display = 'block'; }
m.onLoadingEnd =   function () { document.getElementById('spinner').style.display = 'none'; }

var app = {
  // Application Constructor
  initialize: function() {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // `load`, `deviceready`, `offline`, and `online`.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  // deviceready Event Handler
  //
  // The scope of `this` is the event. In order to call the `receivedEvent`
  // function, we must explicity call `app.receivedEvent(...);`
  onDeviceReady: function() {
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
      "/payments": require('./pages/Payments.js')
    });

    app.receivedEvent('spinner');
  },

  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    parentElement.setAttribute('style', 'display:none;');
  }
};

app.initialize();