/**
 * This file is the OAuth as provided by Spotify.
 * It logs an user in and then saves the key for API calls.
 * A router is used to add these paths to the /auth url
 * of our domain when an user first comes to our app.
 */

/**
 * Get access + refresh token and pass to client side for them to ask for
 * refreshes every 50 min on their timer. Then let the client call our server
 * for recommendations and next song to return from the queue -- so store song name, uri, artist, and image uri
 * for it to display and play.
 * Can implement hisotry later to go back/queue display on the side
 */

var express = require('express');
var router = express.Router();

/* Request and HTTP utils */
var utils = require('../utils');
var request = require('request');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

/* Load Auth Variables */
const config = require('../config');
const keys = config.keys;
const client_id = keys.spotify.client;
const client_secret = keys.spotify.secret;
const spotify_redirect_uri = config.app.index() + '/login/callback/';

/* Spotify Client Permission Variables */
const stateKey = 'spotify_auth_state';
const auth_redirect_key = 'auth_redirect_uri';
const scope = 'user-top-read user-modify-playback-state user-read-private playlist-modify-public playlist-modify-private';

router.use(cors())
      .use(cookieParser());


router.get('/', function(req, res, next) {
    console.log('authorizing!!');
    var state = utils.generateRandomString(16);

    // on the index page when user clicks login or from another page,
    // get current window location and redirect to it after
    res.cookie(stateKey, state);
    res.cookie(auth_redirect_key, req.query.auth_redirect_uri);

    // your application requests authorization
    console.log('redirecting to spotify auth');
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: spotify_redirect_uri,
            state: state
        }));
});

router.get('/callback', function(req, res, next) {
    console.log('authorize callback');
    // application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        return next("ERROR: State Mismatch");
    }

    res.clearCookie(stateKey);
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: spotify_redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    };

    request.post(authOptions, async function(error, response, body) {
        if (!error && response.statusCode === 200) {
            req.session.access_token = body.access_token;
            req.session.refresh_token = body.refresh_token;

            try {
                var user_profile = await get_profile(body.access_token);
                req.session.user_name = user_profile.name;
                req.session.userid = user_profile.id;
            } catch(error) {
                return next(error);
            }

            var auth_redirect_uri = (req.cookies && req.cookies[auth_redirect_key]) ? req.cookies[auth_redirect_key] : config.app.index();
            res.clearCookie(auth_redirect_key);
            res.redirect(decodeURIComponent(auth_redirect_uri));
        } else {
            next("ERROR: Invalid Token\n" + error);
        }
    });
});

function get_profile(access_token) {
    var prof_options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };

    // caught in wrapper function
    return new Promise((resolve, reject) => {
        request.get(prof_options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var user_profile = {
                    name : body.display_name, 
                    id : body.id,
                }
                resolve(user_profile);
            } else {
                reject(error);
            }
        });
    });
}

module.exports = router;