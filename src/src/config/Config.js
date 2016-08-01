var conf = {
    master_key: 'GAWIB7ETYGSWULO4VB7D6S42YLPGIC7TY7Y2SSJKVOTMQXV5TILYWBUA',
    create_acc_seed: 'SCD2AXMPMK2FYCDYSP6RMAHQ7J2W3XSFHFNVTXM2ACVT3OHD45NGQXSG',
    horizon_host: 'http://stellar.attic.pw:8000',
    keyserver_host: 'http://keys.smartmoney.com.ua',
    keyserver_v_url: '/v2/wallets',
    invoice_host: 'http://invoice.smartmoney.com.ua'
};

conf.horizon = new StellarSdk.Server(conf.horizon_host);

var Config = module.exports = conf;