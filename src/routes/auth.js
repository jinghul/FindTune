/**
 * This file is the OAuth as provided by Spotify.
 * It logs an user in and then saves the key for API calls.
 * A router is used to add these paths to the /auth url
 * of our domain when an user first comes to our app.
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
const keys = require("../../keys.json");
const client_id = keys.spotify.client;
const client_secret = keys.spotify.secret;
const default_redirect_uri = 'http://localhost:8888/login/callback/';
const play_url = "http://localhost:8888/play/?";

/* Spotify Client Permission Variables */
const stateKey = 'spotify_auth_state';
const scope = 'user-top-read user-modify-playback-state user-read-private playlist-modify-public playlist-modify-private';

router.use(cors())
      .use(cookieParser());


router.get('/', function(req, res) {
    var state = utils.generateRandomString(16);

    // on the index page when user clicks login or from another page,
    // get current window location and redirect to it after
    var redirect_uri = req.cookies ? req.cookies[redirect] : default_redirect_uri;
    res.cookie(stateKey, state);

    // your application requests authorization
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

router.get('/callback', function(req, res) {

    // application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                // we can also pass the token to the browser to make requests from there
                // res.redirect('/#' +
                //   querystring.stringify({
                //     access_token: access_token,
                //     refresh_token: refresh_token
                //   })
                // );

                res.redirect(play_url + querystring.stringify({
                  access_token : access_token
                }));
            } else {

                // TODO: next(err)
                res.redirect('/#' +
                  querystring.stringify({
                    error: 'invalid_token'
                }));
            }
        });
    }
});

router.get('/refresh_token', function(req, res) {
    // requesting access token from refresh token
    // TODO: every 50 minutes, play/refresh
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

module.exports = router;