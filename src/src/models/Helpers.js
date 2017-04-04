var Conf = require('../config/Config.js');
var Auth = require('../models/Auth.js');

var Helpers = {

    getTimeFromSeconds: function (sec) {
        var dt = new Date();
        dt.setTime(sec*1000);
        var minutes = dt.getMinutes();
        var seconds = dt.getSeconds();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return minutes + ":" + seconds;
    },

};
module.exports = Helpers;