var Qr = require('../../node_modules/qrcode-npm/qrcode');
var Conf = require('../config/Config.js');
var Navbar = require('../components/Navbar.js');
var Auth = require('../models/Auth.js');

var Invoice = module.exports = {

    controller: function () {
        var ctrl = this;

        this.invoiceCode = m.prop(false);
        this.qr = m.prop(false);

        if (!Auth.exists()) {
            return m.route('/');
        }


        //create invoice function
        this.createInvoice = function (e) {
            e.preventDefault();

            var amount = parseFloat(e.target.amount.value) * 100;
            var asset = e.target.asset.value;

            if (!amount || amount < 0) {
                $.Notification.notify('error', 'top center', 'Error', 'Bad amount. Check value!');
                return;
            }

            // TODO: check if asset is available in Auth.balances

            if (!asset) {
                $.Notification.notify('error', 'top center', 'Error', 'Asset is invalid!');
                return;
            }

            var formData = new FormData();

            formData.append("amount", amount);
            formData.append("asset", asset);
            formData.append("account", Auth.keypair().accountId());
            var jsonData = {
                "account" : Auth.keypair().accountId(),
                "amount" : amount,
                "asset" : asset,
                "t" : 1
            }

            var qr = Qr.qrcode(8, 'Q');
            qr.addData(JSON.stringify(jsonData));

            qr.make();
            var imgTag = qr.createImgTag(4);
            ctrl.qr(m.trust(imgTag));

            m.onLoadingStart();

            try {

                var xhr = new XMLHttpRequest();
                xhr.open("POST", Conf.invoice_host + Conf.invoice_add_url, false); // false for synchronous request
                xhr.send(formData);

                var response = JSON.parse(xhr.responseText);
                if (response.error) {
                    switch (response.error) {
                        case 'bad amount':
                            $.Notification.notify('error', 'top center', 'Error', 'Bad amount. Check value!');
                            break;
                        default:
                            $.Notification.notify('error', 'top center', 'Error', 'Network error');
                            break;
                    }

                    m.onLoadingEnd();
                    return;
                }

            } catch (e) {
                $.Notification.notify('error', 'top center', 'Error', 'Network error');
            }

            m.onLoadingEnd();

            m.startComputation();
            this.invoiceCode(response);
            m.endComputation();

            $.Notification.notify('success', 'top center', 'Success', 'Invoice Created');
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
                        <h2>Transfer</h2>
                        <div class="row">
                            <div class="col-lg-4">
                                {
                                    (!ctrl.invoiceCode())?
                                        <div class="panel panel-primary">
                                            <div class="panel-heading">Create a new invoice</div>
                                            <div class="panel-body">
                                                <form class="form-horizontal" onsubmit={ctrl.createInvoice.bind(ctrl)}>

                                                    <div class="form-group">
                                                        <div class="col-xs-4">
                                                            <label for="">Amount:</label>
                                                            <input class="form-control" type="text" required="" id="amount"
                                                                   placeholder="0.00"
                                                                   name="amount"/>
                                                        </div>
                                                    </div>

                                                    <div class="form-group">
                                                        <div class="col-xs-4">
                                                            <select name="asset" class="form-control">
                                                                {Auth.balances().map(function (b) {
                                                                    return <option>{b.asset}</option>
                                                                })}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div class="form-group m-t-20">
                                                        <div class="col-sm-7">
                                                            <button class="btn btn-primary btn-custom w-md waves-effect waves-light" type="submit">
                                                                Create
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                :
                                    <div class="panel panel-border panel-inverse">
                                        <div class="panel-heading">
                                            <h3 class="panel-title">Invoice code</h3>
                                        </div>
                                        <div class="panel-body text-center">
                                            <h2>{ctrl.invoiceCode()}</h2>
                                            <i>Copy this invoice code and share it with someone you need to get money from</i>
                                            <br/>
                                            <br/>
                                            {code}
                                            <br/>
                                            <br/>
                                            <button class="btn btn-purple waves-effect w-md waves-light m-b-5" onclick={ctrl.newForm.bind(ctrl)}>Create new</button>
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
