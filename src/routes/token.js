const express = require('express');
var router = express.Router();

/* Utils */
const config = require('../config');
const request = require('request');

router.use((req, res, next) => {
    // requesting access token from refresh token
    var refresh_token = req.session.refresh_token;
    if (!req.session.userid || !refresh_token) {
        // TODO: use query params
        req.session.auth_redirect = config.app.index() + '/play';
        res.redirect(config.app.index() + '/login');
    }

    var refresh_options = {
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

    request.post(refresh_options, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            req.session.access_token = body.access_token;
            next();
        } else {
            // TODO: Query params for redirect
            req.session.auth_redirect = config.app.index() + '/play';
            res.redirect(config.app.index() + '/login');
        }
    });
});

router.get('/get_tokens', (req, res) => {
    if (req.session.userid && req.session.access_token) {
        res.send({
            'access_token' : req.session.access_token,
            'refresh_token' : req.session.refresh_token
        });
    } else {
        res.status(404).send("No tokens available.");
    }
});

module.exports = router;