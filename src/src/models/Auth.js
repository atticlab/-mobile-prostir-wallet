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
        this.api = m.prop(false);
        this.ttl = m.prop(0);
        this.time_live = m.prop(0);
    },

    updateBalances: function (account_id) {

        var assets = [];
        var balances = [];
        var account = null;

        return Auth.getAnonymousAssets()
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
    loadingCB: function (stage) {
        m.startComputation();
        if (stage.type == 'request') {
            m.onLoadingStart();
        } else {
            m.onProcedureStart();
        }
        m.endComputation();
    },
    login: function (login, password, progressCb) {
        var master = null;
        m.onProcedureStart();
        return this.loadAccountById(Conf.master_key)
            .then(function (master_info) {
                master = master_info;
                return StellarWallet.getWallet({
                    server: Conf.keyserver_host + '/v2',
                    username: login,
                    password: password,
                    cb: progressCb
                });

            })
            .then(function (wallet) {
                m.onProcedureEnd();
                m.onLoadingEnd();
                var is_admin = false;
                m.onProcedureStart();
                if ((typeof master != 'undefined') && (typeof master.signers != 'undefined')) {
                    master.signers.forEach(function (signer) {
                        if (signer.weight == StellarSdk.xdr.SignerType.signerAdmin().value &&
                            signer.public_key == StellarSdk.Keypair.fromSeed(wallet.getKeychainData()).accountId()) {
                            is_admin = true;
                        }
                    });

                    if (is_admin) {
                        m.onProcedureEnd();
                        throw new Error('Login/password combination is invalid');
                    }
                }

                return wallet;
            })
            .then(Auth.initAuthData);
    },

    loginByPin: function (pin, username, passwordHash) {
        m.onProcedureStart();
        return StellarWallet.decryptAuthData({
            encryptedPasswordHash: passwordHash,
            pin: pin
        })
            .then(authData => {
                console.log("-------- authData in Auth.loginByPin() --------");
                console.log(authData);

                return StellarWallet.getWallet({
                    server: Conf.keyserver_host + '/v2',
                    username: username,
                    passwordHash: authData.decryptedPasswordHash,
                    cb: Auth.loadingCB
                });
            })
            .then(Auth.initAuthData)
    },

    loginByPasswordHash: function (login, passwordHash) {
        var master = null;
        m.onProcedureStart();
        return this.loadAccountById(Conf.master_key)
            .then(function (master_info) {
                master = master_info;
                return StellarWallet.getWallet({
                    server: Conf.keyserver_host + '/v2',
                    username: login,
                    passwordHash: passwordHash,
                    cb: Auth.loadingCB
                });
            })
            .then(function (wallet) {
                m.onProcedureEnd();
                m.onLoadingEnd();
                var is_admin = false;
                m.onProcedureStart();
                if ((typeof master != 'undefined') && (typeof master.signers != 'undefined')) {
                    master.signers.forEach(function (signer) {
                        if (signer.weight == StellarSdk.xdr.SignerType.signerAdmin().value &&
                            signer.public_key == StellarSdk.Keypair.fromSeed(wallet.getKeychainData()).accountId()) {
                            is_admin = true;
                        }
                    });

                    if (is_admin) {
                        m.onProcedureEnd();
                        throw new Error('Login/password combination is invalid');
                    }
                }

                return wallet;
            })
            .then(Auth.initAuthData);
    },

    initAuthData: function (wallet) {
        console.log("-------- in initAuthData() --------");
        console.log(wallet);

        m.startComputation();
        Auth.wallet(wallet);
        Auth.keypair(StellarSdk.Keypair.fromSeed(wallet.getKeychainData()));
        Auth.username(wallet.username);
        Auth.api(new StellarWallet.Api(Conf.api_host, Auth.keypair()));
        m.endComputation();
        m.onProcedureEnd();
    },

    registration: function (login, password, progressCb) {
        m.onProcedureStart();
        var accountKeypair = StellarSdk.Keypair.random();
        m.onLoadingStart();
        return this.checkConnection()
            .then(() => {
                return StellarWallet.createWallet({
                    server: Conf.keyserver_host + '/v2',
                    username: login,
                    password: password,
                    accountId: accountKeypair.accountId(),
                    publicKey: accountKeypair.rawPublicKey().toString('base64'),
                    keychainData: accountKeypair.seed(),
                    mainData: 'mainData',
                    kdfParams   : {
                        algorithm: 'scrypt',
                        bits     : 256,
                        n        : 2,
                        r        : 8,
                        p        : 1,
                        passwordHashAlgorithm: 'sha256',
                        hashRounds: Math.pow(2, 19)
                    },
                    cb: progressCb
                })
            });
    },

    logout: function () {
        window.location.reload();
    },

    updatePassword: function (old_pwd, new_pwd, progressCb) {
        return this.checkConnection()
            .then(() => {
                return StellarWallet.getWallet({
                    server: Conf.keyserver_host + '/v2',
                    username: Auth.username(),
                    password: old_pwd,
                    cb: progressCb
                })
            })
            .then(function (wallet) {

                console.log("-------- wallet before changePassword in Auth --------");
                console.log(wallet);

                return wallet.changePassword({
                    newPassword: new_pwd,
                    secretKey: Auth.keypair()._secretKey.toString('base64'),
                    cb: progressCb
                });
            }).then(function (wallet) {
                Auth.wallet(wallet);
            });
    },

    update: function (data) {
        return this.checkConnection()
            .then(Auth.wallet().update({
                update: data,
                secretKey: Auth.keypair()._secretKey.toString('base64')
            }))
            .catch(e => {
                console.error(e);
            });
    },

    loadTransactionInfo: function (tid) {
        return Conf.horizon.transactions()
            .transaction(tid)
            .call();
    },

    loadAccountById: function (aid) {
        return Conf.horizon.accounts()
            .accountId(aid)
            .call();
    },

    checkConnection: function () {
        return new Promise(function (resolve, reject) {
            if ((Conf.networkStatus != null) && (Conf.networkStatus === false)) {
                reject({message: Conf.tr('No internet connection')});
            } else {
                resolve();
            }
        });
    },

    getAnonymousAssets: function () {

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
    },

    checkPinCreated: function () {
        return !!(window.localStorage.getItem('encryptedPasswordHash'));
    },

    getLastLogin: function () {
        return window.localStorage.getItem('lastLogin');
    }
};

Auth.setDefaults();

module.exports = Auth;