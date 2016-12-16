# Scrypt plugin for iOS & Android

## Introduction

[scrypt](http://www.tarsnap.com/scrypt.html) is a password-based key derivation function designed to make it costly to perform hardware attacks on the derived keys. While there exist scrypt implentations for the browser in javascript they are extremely slow and impractical for use in mobile apps.

This plugin is for use with [Cordova](http://incubator.apache.org/cordova/) and allows your application to use scrypt on iOS/Android devices using native C code. It is based on [libscrypt](https://github.com/technion/libscrypt).

### Contents

- [Installation](#installation)
- [Plugin API](#plugin-api)
- [LICENSE](#license)

##<a name="installation"></a>Installation

Below are the methods for installing this plugin automatically using command line tools. For additional info, take a look at the [Plugman Documentation](https://github.com/apache/cordova-plugman/blob/master/README.md) and [Cordova Plugin Specification](https://github.com/alunny/cordova-plugin-spec).

### Cordova

The plugin can be installed via the Cordova command line interface:

* Navigate to the root folder for your phonegap project.
* Run the command:

```sh
cordova plugin add cordova-plugin-scrypt
```

or if you want to be running the development version,

```sh
cordova plugin add https://github.com/Crypho/cordova-plugin-scrypt.git
```

##<a name="plugin_api"></a> Plugin API

Grab the plugin instance variable.

```js
var scrypt;

document.addEventListener("deviceready", function(){
    scrypt = window.plugins.scrypt;
    ...
});
```

You can get the derived key in hexadecimal format by invoking ``scrypt(onSuccess, onFailure, password, salt, options)``

```js
var key;

scrypt(
    function (res) { key = res; },
    function (err) { key = null },
    'password', 'salt', {N: 16384}
)
```

The ``salt`` parameter can be a string or an array of uint8. You can provide custom ``scrypt`` parameters in the options dict. The defaults are
```js
{
    N: 16384,
    r: 8,
    p: 1,
    dkLen: 32
}
```

## Testing

### Setup

1. Create a cordova app.
2. Replace ``config.xml`` with the ``testing.config.xml``
3. Add your platforms.
4. Add the ``cordova-plugin-test-framework`` plugin:

```
cordova plugin add http://git-wip-us.apache.org/repos/asf/cordova-plugin-test-framework.git
```

4. Finally add the scrypt plugin as well as the tests from its location

```
cordova plugin add PATH_TO_SCRYPT_PLUGIN
cordova plugin add PATH_TO_SCRYPT_PLUGIN/tests
```

### Running the tests

Just run the app for all platforms. Remember, if you have changes to test you will need to remove the scrypt plugin and add it again for the changes to be seen by the app.

##<a name="license"></a> LICENSE

    The MIT License

    Copyright (c) 2015 Crypho AS.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

    libscrypt is Copyright (c) 2013, Joshua Small under the BSD license. See src/libscrypt/LICENSE
