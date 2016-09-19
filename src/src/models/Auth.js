var Conf = require('../config/Config.js');
var Errors = require('../errors/Errors.js');

var Auth = {
    setDefaults: function () {
        this.keypair = m.prop(false);
        this.type = m.prop(false);
        this.username = m.prop(false);
        this.balances = m.prop([]);
        this.assets = m.prop([]);
        this.payments = m.prop([]);
        this.wallet = m.prop(false);
    },

    updateBalances: function (account_id) {

        var assets = [];
        var balances = [];
        var account = null;

        return getAnonymousAssets()
            .then(assets_list => {
                Object.keys(assets_list).map(function (index) {
                    if (assets_list[index].asset_type != 'native') {
                        assets.push({
                            asset: assets_list[index].asset_code
                        });
                    }
                });

                // Use this function instead of load account to gather more data
                return Auth.loadAccountById(account_id);
            })
            .then(source => {

                var response = source.balances;
                Object.keys(response).map(function (index) {
                    if (response[index].asset_type != 'native') {
                        balances.push({
                            balance: response[index].balance,
                            asset: response[index].asset_code
                        });
                        assets.push({
                            asset: response[index].asset_code
                        });
                    }
                });

                account = source;

            })
            .catch(err => {
                console.log(err);
                //step this err, because user can be not created yet (before first payment)
            })
            .then(function () {

                //only unique values
                var flags = {};
                assets = assets.filter(function (item) {
                    if (flags[item.asset]) {
                        return false;
                    }
                    flags[item.asset] = true;
                    return true;
                });

                m.startComputation();
                Auth.balances(balances);
                Auth.assets(assets);
                m.endComputation();

                return account;
            })
    },

    login: function (login, password) {

        var master = null;

        return this.loadAccountById(Conf.master_key)
            .then(function (master_info) {

                master = master_info;

                return StellarWallet.getWallet({
                    server: Conf.keyserver_host + '/v2',
                    username: login,
                    password: password
                });

            })
            .then(function (wallet) {

                var is_admin = false;

                if (typeof master.signers != 'undefined') {

                    master.signers.forEach(function (signer) {
                        if (signer.weight == StellarSdk.xdr.SignerType.signerAdmin().value &&
                            signer.public_key == StellarSdk.Keypair.fromSeed(wallet.getKeychainData()).accountId()) {
                            is_admin = true;
                        }
                    });

                    if (is_admin) {
                        throw new Error('Login/password combination is invalid');
                    }

                }

                return wallet;
            })
            .then(function (wallet) {
                m.startComputation();
                Auth.wallet(wallet);
                Auth.keypair(StellarSdk.Keypair.fromSeed(wallet.getKeychainData()));
                Auth.username(wallet.username);
                m.endComputation();
            });
    },

    registration: function (login, password) {
        var accountKeypair = StellarSdk.Keypair.random();
        return StellarWallet.createWallet({
            server: Conf.keyserver_host + '/v2',
            username: login,
            password: password,
            accountId: accountKeypair.accountId(),
            publicKey: accountKeypair.rawPublicKey().toString('base64'),
            keychainData: accountKeypair.seed(),
            mainData: 'mainData',
            kdfParams: {
                algorithm: 'scrypt',
                bits: 256,
                n: Math.pow(2, 3),
                r: 8,
                p: 1
            }
        });
    },

    logout: function () {
        window.location.reload();
    },

    updatePassword: function (old_pwd, new_pwd) {
        return StellarWallet.getWallet({
            server: Conf.keyserver_host + '/v2',
            username: Auth.username(),
            password: old_pwd
        }).then(function (wallet) {
            return wallet.changePassword({
                newPassword: new_pwd,
                secretKey: Auth.keypair()._secretKey.toString('base64')
            });
        }).then(function (wallet) {
            Auth.wallet(wallet);
        })
    },

    update: function (data) {
        return Auth.wallet().update({
            update: data,
            secretKey: Auth.keypair()._secretKey.toString('base64')
        });
    },

    loadTransactionInfo: function (tid) {
        return Conf.horizon.transactions()
            .transaction(tid)
            .call()
    },

    loadAccountById: function (aid) {
        return Conf.horizon.accounts()
            .accountId(aid)
            .call();
    }
};

function getAnonymousAssets() {

    return m.request({method: "GET", url: Conf.horizon_host + Conf.assets_url})
        .then(response => {
            if (typeof response._embedded == 'undefined' || typeof response._embedded.records == 'undefined') {
                throw new Error(Conf.tr(Errors.assets_empty));
            }

            let assets_list = response._embedded.records;

            Object.keys(assets_list).forEach(function (key) {
                if (typeof assets_list[key].is_anonymous == 'undefined') {
                    delete assets_list[key];
                }
                if (!assets_list[key].is_anonymous) {
                    delete assets_list[key];
                }
            });

            return assets_list;
        });
}

Auth.setDefaults();

module.exports = Auth;