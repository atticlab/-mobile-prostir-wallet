var Conf = require('../config/Config.js');

var Auth = {
    setDefaults: function () {
        this.keypair = m.prop(false);
        this.type = m.prop(false);
        this.username = m.prop(false);
        this.balances = m.prop([]);
        this.payments = m.prop([]);
        this.wallet = m.prop(false);
    },

    updateBalances: function (account_id) {
        // Use this function instead of load account to gather more data
        return Auth.loadAccountById(account_id)
            .then(source => {
                var response = source.balances;
                var balances = [];
                Object.keys(response).map(function (index) {
                    if (response[index].asset_type != 'native') {
                        balances.push({
                            balance: response[index].balance,
                            asset: response[index].asset_code
                        });
                    }
                });

                m.startComputation();
                Auth.balances(balances);
                m.endComputation();

                return source;
            });
    },

    login: function (login, password) {
        return StellarWallet.getWallet({
            server: Conf.keyserver_host + '/v2',
            username: login,
            password: password
        })
            .then(function (wallet) {
                Auth.wallet(wallet);
                Auth.keypair(StellarSdk.Keypair.fromSeed(wallet.getKeychainData()));
                Auth.username(wallet.username);

                return Auth.updateBalances(Auth.keypair().accountId());
            })
            .then(function (source) {
                Auth.type(source.type);

                return Conf.horizon.payments()
                    .forAccount(Auth.keypair().accountId())
                    .order('desc')
                    .limit(25)
                    .call();
            })

            .then(function (result) {
                Auth.payments(result.records);

                return Conf.horizon.payments()
                    .forAccount(Auth.keypair().accountId())
                    .cursor('now')
                    .stream({
                        onmessage: function (message) {
                            var result = message.data ? JSON.parse(message.data) : message;
                            m.startComputation()
                            Auth.payments().unshift(result);
                            m.endComputation();

                            // Update user balance
                            Auth.updateBalances(Auth.keypair().accountId());
                        },
                        onerror: function () {
                            console.log('Cannot get payment from stream');
                        }
                    });
            });
    },

    registration: function (login, password) {
        var accountKeypair = StellarSdk.Keypair.random();
        let walletUser = StellarSdk.Keypair.fromSeed(Conf.create_acc_seed);
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
                n: Math.pow(2, 11),
                r: 8,
                p: 1
            }
        })
            .then(function () {
                return Conf.horizon.loadAccount(walletUser.accountId());
            })
            .then(source => {
                let tx = new StellarSdk.TransactionBuilder(source)
                    .addOperation(StellarSdk.Operation.createAccount({
                        destination: accountKeypair.accountId(),
                        accountType: StellarSdk.xdr.AccountType.accountAnonymousUser().value
                    }))
                    .build();

                tx.sign(walletUser);

                return Conf.horizon.submitTransaction(tx);
            })
            .then(function () {
                var sequence = '0';
                var anonymousAccount = new StellarSdk.Account(accountKeypair.accountId(), sequence);

                var tx = new StellarSdk.TransactionBuilder(anonymousAccount)
                    .addOperation(
                        StellarSdk.Operation.changeTrust({
                            asset: new StellarSdk.Asset('EUAH', Conf.master_key)
                        }))
                    // .addOperation(
                    // StellarSdk.Operation.changeTrust({
                    //         asset: new StellarSdk.Asset('DUAH', Conf.master_key)
                    //     })
                    // )
                    .build();

                tx.sign(accountKeypair);
                return Conf.horizon.submitTransaction(tx);
            })

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

Auth.setDefaults();

module.exports = Auth;