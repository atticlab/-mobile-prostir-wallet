// Loading spinner
m.onLoadingStart = function () { document.getElementById('spinner').style.display = 'block'; }
m.onLoadingEnd =   function () { document.getElementById('spinner').style.display = 'none'; }

// Routing
m.route.mode = 'hash';
m.route(document.getElementById('app'), "/", {
  "/": require('./pages/Login.js'),
  "/home": require('./pages/Home.js'),
  "/logout": require('./pages/Logout.js'),
  "/invoice": require('./pages/Invoice.js'),
  "/sign": require('./pages/Sign.js'),
  "/transfer": require('./pages/Transfer.js'),
  "/settings": require('./pages/Settings.js')
});