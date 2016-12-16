cordova.define("cordova-plugin-scrypt.scrypt", function(require, exports, module) {
var scrypt = function(successCallback, errorCallback, message, salt, options) {
    if (typeof errorCallback != "function")  {
        console.log("ScryptPlugin.scrypt failure: failure parameter not a function");
        return;
    }

    if (typeof successCallback != "function") {
        console.log("ScryptPlugin.scrypt failure: success callback parameter must be a function");
        return;
    }
    options = options || {};
    cordova.exec(successCallback, errorCallback, "ScryptPlugin", "scrypt", [message, salt, options]);
};


if(!window.plugins) {
    window.plugins = {};
}
if (!window.plugins.scrypt) {
    window.plugins.scrypt = scrypt;
}

if (typeof module != 'undefined' && module.exports) {
  module.exports = scrypt;
}
});
