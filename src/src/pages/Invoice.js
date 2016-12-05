var Qr = require('qrcode-npm/qrcode');
var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Invoice = module.exports = {

    controller: function () {
        var ctrl = this;

        this.invoiceCode = m.prop(false);
        this.qr = m.prop(false);
        this.barcode = m.prop(false);

        if (!Auth.keypair()) {
            return m.route('/');
        }

        //create invoice function
        this.createInvoice = function (e) {
            e.preventDefault();

            var amount = e.target.amount.value;
            var asset = e.target.asset.value;
            // TODO: check if asset is available in Auth.balances

            m.onLoadingStart();

            Auth.api().createInvoice({asset: asset, amount: parseFloat(parseFloat(amount).toFixed(2))})
                .then(function(response){
                    m.flashSuccess(Conf.tr("Invoice created"));
                    ctrl.invoiceCode(id);

                    if (!response.id) {
                        m.flashError(Conf.tr("Invalid response. Contact support"));
                    }

                    ctrl.invoiceCode(response.id);

                    // QR-CODE
                    var jsonData = {
                        "account": Auth.keypair().accountId(),
                        "amount": amount,
                        "asset": asset,
                        "t": 1
                    };
                    var jsonDataStr = JSON.stringify(jsonData);

                    //calculate the qrCode size
                    var qrSize = 8;
                    // 5 = (496b), 6 = (608b), 7 = (704b), 8 = 108 (880b), 9 = 130 (1056b)
                    var lenInBytes = Qr.qrcode.stringToBytes(jsonDataStr).length * 8 + 16;
                    if (lenInBytes > 880) qrSize++;
                    if (lenInBytes > 1056) qrSize++;
                    var qr = Qr.qrcode(qrSize, 'Q');
                    qr.addData(jsonDataStr);
                    qr.make();

                    var imgTag = qr.createImgTag(4);

                    m.startComputation();
                    ctrl.qr(m.trust(imgTag));
                    // ctrl.barcode(m.trust('<img width="230" height="118"' +
                    //     'src="http://www.barcode-generator.org/zint/api.php?bc_number=13&bc_data=482000' +
                    //     id + '">'));
                    m.endComputation();
                })
                .catch(err => {
                    m.flashApiError(err);
                })
                .then(() => {
                    m.onLoadingEnd();
                })
        }

        this.newForm = function (e) {
            this.invoiceCode(false);
        }
    },

    view: function (ctrl) {
        var code = ctrl.qr();

        return [m.component(Navbar),
            <div class="wrapper">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-6">
                            {
                                (!ctrl.invoiceCode()) ?
                                    <div class="panel panel-color panel-purple">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr("Create a new invoice")}</h3>
                                        </div>
                                        <div class="panel-body">
                                            <form class="form-horizontal" onsubmit={ctrl.createInvoice.bind(ctrl)}>

                                                <div class="form-group">
                                                    <div class="col-xs-4">
                                                        <label for="">{Conf.tr("Amount")}:</label>
                                                        <input class="form-control" type="number" required="required"
                                                               id="amount"
                                                               min="0.01"
                                                               step="0.01"
                                                               placeholder="0.00"
                                                               name="amount"/>
                                                    </div>
                                                </div>

                                                <div class="form-group">
                                                    <div class="col-xs-4">
                                                        <select name="asset" class="form-control">
                                                            {Auth.assets().map(function (b) {
                                                                return <option>{b.asset}</option>
                                                            })}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div class="form-group m-t-20">
                                                    <div class="col-sm-7">
                                                        <button
                                                            class="btn btn-purple btn-custom w-md waves-effect waves-light"
                                                            type="submit">
                                                            {Conf.tr("Create")}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                    :
                                    <div class="panel panel-border panel-inverse">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">{Conf.tr("Invoice code")}</h3>
                                        </div>
                                        <div class="panel-body text-center">
                                            <h2>{ctrl.invoiceCode()}</h2>
                                            <i>{Conf.tr("Copy this invoice code and share it with someone you need to get money from")}</i>
                                            <br/>
                                            <br/>
                                            {code}
                                            <br/>
                                            <br/>
                                            {/*{ctrl.barcode() ? ctrl.barcode() : ''}*/}
                                            <br/>
                                            <br/>
                                            <button class="btn btn-purple waves-effect w-md waves-light m-b-5"
                                                    onclick={ctrl.newForm.bind(ctrl)}>{Conf.tr("Create new")}
                                            </button>
                                        </div>
                                    </div>
                            }
                        </div>
                    </div>
                </div>
            </div>

        ];
    }
};
