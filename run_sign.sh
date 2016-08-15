#!/bin/bash

#gulp build
cd src
gulp bundle
cd ../

cp -n src/node_modules/stellar-sdk/dist/stellar-sdk.min.js www/js/stellar-sdk.min.js
cp -n src/node_modules/stellar-wallet-js-sdk/build/stellar-wallet.min.js www/js/stellar-wallet.min.js
cp -n src/node_modules/vanilla-masker/build/vanilla-masker.min.js www/js/vanilla-masker.min.js

#PHONEGAP BUILD
phonegap build android --release

#SIGN
APK_PATH="platforms/android/build/outputs/apk/android-release-unsigned.apk"
BUILD_PATH="build/MobileWallet.apk"

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore key.store $APK_PATH mobile_wallet
jarsigner -verify -verbose -certs $APK_PATH
rm -rf $BUILD_PATH
zipalign -v 4 $APK_PATH $BUILD_PATH
