# pinterest-save-repin
Simple npm package for making repin / save pin in Pinterest.

## Install

`git+https://github.com/canyousayyes/pinterest-save-repin.git`

## Usage

```
var Pinterest = require('pinterest-save-repin');
var p = new Pinterest();

p.login('user_name_or_email', 'password')
.then(function () {
    // repin(board_id, source_pin_url)
    p.repin('550494823140995277', 'https://www.pinterest.com/pin/35114072071975952/');
})
.then(function (repin_id) {
    console.log(repin_id);
});
```

## Notes

1. Not offical API. May break due to Pinterest request format changes.
2. Very minimal functions. I do this only for the repin function. (which is not avaiable by official API).

## TODO

1. Functions for get list of boards, list of pins.
2. Use a new CSRF token when login, instead of hard coded value.
3. Feel free to suggest in Issue / Pull Request.

## Credit

This repo referenced the project https://bitbucket.org/smh377/pinterest-api
