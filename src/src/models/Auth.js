var Conf = require('../config/Config.js');

var Auth = module.exports = {
    keypair: m.prop(false),

    type: m.prop(false),

    username: m.prop(false),

    exists: m.prop(false),

    balances: m.prop([]),

    payments: m.prop([]),

    invoices: m.prop([]),

    updateBalances: function(response) {
        var balances = [];
        Object.keys(response).map(function(index) {
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
    },

    login: function(login, password) {
        return StellarWallet.getWallet({
                server: Conf.wallet_host + '/v2',
                username: login,
                password: password
            }).then(function(wallet) {
                Auth.keypair(StellarSdk.Keypair.fromSeed(wallet.getKeychainData()));
                Auth.username(wallet.username);
                return Auth.loadAccount();
            }).then(function() {
                // TODO: show older transactions (add pagination)
                return Conf.horizon.payments()
                    .forAccount(Auth.keypair().accountId())
                    .order('desc')
                    .limit(25)
                    .call();
            })
            .then(function(result) {
                Conf.horizon.payments()
                    .forAccount(Auth.keypair().accountId())
                    .cursor('now')
                    .stream({
                        onmessage: function(message) {
                            var result = message.data ? JSON.parse(message.data) : message;
                            m.startComputation()
                            Auth.payments().unshift(result);
                            m.endComputation();
                        },
                        onerror: function(error) {}
                    });

                m.startComputation()
                Auth.payments(result.records)
                m.endComputation();

            })
            .catch(function(err) {
                throw err;
            })
    },

    registration: function(login, password) {
        var accountKeypair = StellarSdk.Keypair.random();
        let walletUser = StellarSdk.Keypair.fromSeed(Conf.create_acc_seed);
        return StellarWallet.createWallet({
            server: Conf.wallet_host + '/v2',
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
        .then(function() {
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
            .then(function() {
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
    loadAccount: function() {
        var ctrl = this;

        if (!Auth.keypair()) {
            return this.logout();
        }

        return Conf.horizon.accounts()
            .accountId(Auth.keypair().accountId())
            .call()
            .then(source => {
                Auth.exists(true);
                Auth.type(source.type);

                Conf.horizon.accounts()
                    .accountId(Auth.keypair().accountId())
                    .cursor('now')
                    .stream({
                        onmessage: function(source) {
                            if (source.balances) {
                                ctrl.updateBalances(source.balances);
                            }
                        },
                        onerror: function(error) {

                        }
                    });


                ctrl.updateBalances(source.balances);
            })
        ;
    },
    logout: function() {
        window.location.reload();
    },
    updateAdvData: function(email, phone) {
        console.log(Auth.username());
        return StellarWallet.updateAdvParams({
            server: Conf.wallet_host + '/v2',
            username: Auth.username(), 
            email: email,
            phone: phone,
            accountId : Auth.keypair().accountId(),
            secretKey: Auth.keypair().seed()
        });
    }
};
