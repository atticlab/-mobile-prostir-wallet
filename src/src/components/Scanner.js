/*****/
var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');

const QR_TYPE_SEND_MONEY = 1;
const QR_TYPE_DEBIT_CARD = 2;

var Scanner = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.keypair()) {
            return m.route('/');
        }

        this.scanCode = function () {
            return cordova.plugins.barcodeScanner.scan(
                function (result) {
                    console.log(result.text);
                    if (result.text.substr(0, 4) == 'http') {
                        console.log(result.text.substr(0, 4));
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET',
                            'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDqY4a5m2DS-pV9LwENP_kofNb0FaXORrg&shortUrl=' + result.text);
                        xhr.onload = function () {
                            var params = JSON.parse(xhr.responseText);
                            var p = params['longUrl'].split('?')[1].split('&');
                            var result = {};
                            p.forEach(function (pair) {
                                pair = pair.split('=');
                                result[pair[0]] = pair[1] || '';
                            });
                            var getString = '?seed=' + result['seed'];
                            return m.route('/cards' + getString);
                        };
                        xhr.send();
                    } else {
                        var params = JSON.parse(result.text);

                        switch (parseInt(params.t)) {
                            case QR_TYPE_SEND_MONEY :
                            {
                                var getString = '?account=' + params.account;
                                getString += '&amount=' + params.amount;
                                getString += '&asset=' + params.asset;
                                getString += '&type=' + params.t;
                                getString += '&memo=' + params.m;
                                return m.route('/transfer' + getString);
                            }
                                break;
                            case QR_TYPE_DEBIT_CARD :
                            {
                                var getString = '?seed=' + params.seed;
                                return m.route('/cards' + getString);
                            }
                                break;
                            default:
                            {
                                m.flashError(Conf.tr('Unknown function number'));
                                return;
                            }
                                break;
                        }
                    }

                },
                function (error) {
                    m.flashError(Conf.tr('Scanning failed: ' + error));
                    return;
                },
                {
                    "preferFrontCamera": false, // iOS and Android
                    "showFlipCameraButton": true, // iOS and Android
                    "prompt": Conf.tr("Place a barcode inside the scan area"), // supported on Android only
                    "formats": "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                    "orientation": "landscape" // Android only (portrait|landscape), default unset so it rotates with the device
                }
            );
        }

    },

    view: function (ctrl) {
        return <a href="#" onclick={ctrl.scanCode.bind(ctrl)}><i class="md md-border-outer"></i>{Conf.tr("Scan code")}
        </a>;
    }
};