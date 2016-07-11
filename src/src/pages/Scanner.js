var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Scanner = module.exports = {

    controller: function () {
        var ctrl = this;

        if (!Auth.exists()) {
            return m.route('/');
        }

        this.scanCode = function () {
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    var params = JSON.parse(result.text);

                    switch(parseInt(params.t)) {
                        case 1 : {
                            var getString = '?account='+params.account;
                            getString += '&amount='+params.amount;
                            getString += '&asset='+params.asset;
                            return m.route('/transfer'+getString);
                        } break;
                        default: {
                            $.Notification.notify('error', 'top center', 'Error', 'Unknown function number');
                            return;
                        } break;
                    }


                },
                function (error) {
                    $.Notification.notify('error', 'top center', 'Error', 'Scanning failed: ' + error);
                    return;
                },
                {
                    "preferFrontCamera": false, // iOS and Android
                    "showFlipCameraButton": true, // iOS and Android
                    "prompt": "Place a barcode inside the scan area", // supported on Android only
                    "formats": "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                    "orientation": "landscape" // Android only (portrait|landscape), default unset so it rotates with the device
                }
            );
        }

    },

    view: function (ctrl) {
        return [m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    <h2>Scan QR-Code</h2>
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="panel panel-primary">

                                <div class="form-group m-t-20">
                                    <div class="col-sm-7">
                                        <button class="btn btn-primary btn-custom w-md waves-effect waves-light"
                                                onclick={ctrl.scanCode.bind(ctrl)}
                                        >
                                            Scan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        ];
    }
};