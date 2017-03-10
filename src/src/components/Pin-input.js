var Auth = require('../models/Auth.js');
var Conf = require('../config/Config.js');

module.exports = {
    controller: function(data) {
        let ctrl = this;
        this.pin = data.pin;
    },

    view: function(ctrl, data) {
        return <div class="pincode-wrapper">
            <div class="row pincode-label">
                {data.options.label === true ?
                    <label class="pincode-label">{data.options.labelText}</label>
                    :
                    ''}
            </div>
            <div class="row">
                {m('input', {
                    type: 'text',
                    config: function (el, init) {
                        if (!init) {
                            $(el).pincodeInput({
                                inputs:4,
                                hideDigits:true,
                                complete : function(value, e, errorElement) {

                                    if (validatePin(value)) {
                                        ctrl.pin(value);

                                        if (data.cb && typeof data.cb === 'function') {
                                            data.cb();
                                        }
                                    } else {
                                        $(el).pincodeInput().data('plugin_pincodeInput').clear();
                                        $(el).pincodeInput().data('plugin_pincodeInput').focus();
                                        $(errorElement).html(Conf.tr("Error!"));
                                        return false;
                                    }
                                }
                            });

                            $('.pincode-input-text').prop('type', 'tel');
                        }
                    }
                })}
            </div>
        </div>
    }
};

function validatePin(value) {
    if (value.length !== 4) {
        m.flashError(Conf.tr("Error! PIN must be 4 characters long"));
        return false;
    }

    let numRegex = /[0-9]{4}/;
    if (!numRegex.test(value)) {
        m.flashError(Conf.tr("Error! You can enter only digits"));
        return false;
    }
    return true;
}