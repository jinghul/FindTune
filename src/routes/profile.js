/* Express Routing */
const express = require('express');
const router = express.Router();

/* Utils */
const path = require('path');
const querystring = require('querystring');
const utils = require('../utils');
const HOUR_MS = 3600000;

/* Load Access Variables */
const index_uri = require('../config').app.index();
const login_url = index_uri + '/login';
const profile_url = index_uri + '/profile';

/* Database */
const User = require('../models/user');
const Playlist = require('../models/playlist');

/* refresh token on each call */
router.use((req, res, next) => {
    /* Check if user has a session userid and session hasn't expired */
    if (
        !req.session.userid || !req.session.last_auth ||
        utils.compareTime(new Date(), req.session.last_auth, HOUR_MS)
    ) {
        if (req.path == '/') {
            res.redirect(
                login_url +
                    '?' +
                    querystring.stringify({ auth_redirect_uri: profile_url })
            );
        } else {
            next({ statusCode: 401 });
        }
    } else {
        next();
    }
});

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/profile.html'));
});

router.get('/preferences', (req, res, next) => {
    User.findOne({_id : req.session.user_uid}).then(user => {
        if (!user) {
            res.status(500).send('User not found in database.');
        }

        var { tracks, artists, genres } = user.preferences;
        var weights = {};
        
    })
});

router.use(function(err, req, res, next) {
    console.error(err.stack);
    if (err.statusCode) {
        if (err.statusCode === 401) {
            req.status(401)
                .send('User session expired or not logged in.')
                .end();
        } else {
            res.status(err.statusCode)
                .send(err.statusMessage)
                .end();
        }
    } else {
        res.status(500)
            .send(err)
            .end();
    }
});

module.exports = router;
