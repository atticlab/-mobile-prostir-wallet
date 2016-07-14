#!/bin/bash
APK_PATH="platforms/android/build/outputs/apk/android-release-unsigned.apk"
BUILD_PATH="build/MobileWallet.apk"

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore key.store $APK_PATH mobile_wallet
jarsigner -verify -verbose -certs $APK_PATH
rm -rf $BUILD_PATH
zipalign -v 4 $APK_PATH $BUILD_PATH
