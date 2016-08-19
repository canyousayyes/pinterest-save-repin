'use strict';

let rp = require('request-promise');
let Cookie = require('cookie');

function Pinterest() {
    this.jar = rp.jar();
    this.csrftoken = '';
}

/**
 * Login to Pinterest.
 * @param  {string}  username_or_email Pinterest user name, or email
 * @param  {string}  password          Plaintext password.
 * @return {Promise}                  Return a Promise when success.
 */
Pinterest.prototype.login = function (username_or_email, password) {
    let login_url = 'https://www.pinterest.com/resource/UserSessionResource/create/';
    let self = this;
    let options = {
        url: login_url,
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': ':_auth=0; csrftoken=K4C0QUu35Eoq1xjajbMluw7hOKibpQSW;',
            'DNT': 1,
            'Host': 'www.pinterest.com',
            'Origin': 'https://www.pinterest.com',
            'Referer': 'https://www.pinterest.com/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
            'X-APP-VERSION': '18733c1',
            'X-CSRFToken': 'K4C0QUu35Eoq1xjajbMluw7hOKibpQSW',
            'X-NEW-APP': 1,
            'X-Pinterest-AppState': 'active',
            'X-Requested-With': 'XMLHttpRequest'
        },
        formData: {
            'source_url': '/login/',
            'data': JSON.stringify({
                'options': {
                    'username_or_email': username_or_email,
                    'password': password
                },
                'context':{}
            }),
            'module_path': 'App>LoginPage>Login>Button(class_name=primary data-test-loginBaseButton, text=Log in, type=submit, size=large, state_badgeValue="", state_accessibilityText=Log in, state_disabled=true)'
        },
        jar: self.jar,
        followRedirect: true
    }

    return rp(options)
    .then(function (response) {
        let response_obj = JSON.parse(response);
        if (response_obj.resource_response.error) {
            throw new Error(response_obj.resource_response.error);
        }

        let cookie_string = self.jar.getCookieString(login_url);
        let cookie_obj = Cookie.parse(cookie_string);
        if (cookie_obj.csrftoken) {
            self.csrftoken = cookie_obj.csrftoken;
            return true;
        }

        throw new Error('Failed to save the csrf token');
    });
};

/**
 * Make a repin from source pin_url. Requires to call the login() first.
 * @param  {string}  board_id Pinterest board ID to pin to. Make sure the login-ed user has permission to pin to it.
 * @param  {string}  pin_url  The source pin url, in the form of https://www.pinterest.com/pin/<pin_id>
 * @return {Promise}          Promise with the resolved value of the repin ID.
 */
Pinterest.prototype.repin = function (board_id, pin_url) {
    let self = this;
    let repin_url = 'https://www.pinterest.com/resource/RepinResource/create/';

    // Validate pin_url
    let pin_id_matches = pin_url.match(/^https?:\/\/www\.pinterest\.com\/pin\/(\d+)/);
    if (!pin_id_matches || !pin_id_matches[1]) {
        throw new Error('pin_url is not in the form of https://www.pinterest.com/pin/<pin_id>');
    }

    board_id = board_id.toString();
    let pin_id = pin_id_matches[1];
    let source_url = `/pin/${pin_id}/`;
    let description = '';
    let link = '';

    return rp(pin_url)
    .then(function (response) {
        // Grep the description and link from source pin_url
        let description_matches = response.match(/<meta\s+property=\"og:description\"\s+name=\"og:description\"\s+content=\"(.*?)\"\s+data-app>/);
        if (description_matches && description_matches[1]) {
            description = description_matches[1];
        }

        let link_matches = response.match(/<meta\s+property=\"og:description\"\s+name=\"og:description\"\s+content=\"(.*?)\"\s+data-app>/);
        if (link_matches && link_matches[1]) {
            link = link_matches[1];
        }
    })
    .then(function () {
        let options = {
            url: repin_url,
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'DNT': 1,
                'Host': 'www.pinterest.com',
                'Origin': 'https://www.pinterest.com',
                'Referer': 'https://www.pinterest.com/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
                'X-APP-VERSION': '18733c1',
                'X-CSRFToken': self.csrftoken,
                'X-NEW-APP': 1,
                'X-Pinterest-AppState': 'active',
                'X-Requested-With': 'XMLHttpRequest'
            },
            formData: {
                'source_url': source_url,
                'data': JSON.stringify({
                    'options': {
                        'pin_id': pin_id,
                        'is_buyable_pin': false,
                        'description': description,
                        'link': link,
                        'is_video': false,
                        'board_id': board_id
                    },
                    'context':{}
                }),
                'module_path': 'App>ModalManager>Modal>PinCreate>PinCreateBoardPicker>BoardPicker>SelectList(view_type=pinCreate, selected_section_index=undefined, selected_item_index=undefined, highlight_matched_text=true, suppress_hover_events=undefined, scroll_selected_item_into_view=true, select_first_item_after_update=false, item_module=[object Object])'
            },
            jar: self.jar,
            followRedirect: true
        };
        return rp(options);
    })
    .then(function (response) {
        let response_obj = JSON.parse(response);
        if (response_obj.resource_response.error) {
            throw new Error(response_obj.resource_response.error);
        }
        return response_obj.resource_response.data.id;
    });
};

module.exports = Pinterest;
