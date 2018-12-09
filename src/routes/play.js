/* Express Routing */
const express = require('express');
const router = express.Router();
const init = require('./init');

/* Utility Methods */
const path = require('path');
const request = require('request');
const querystring = require('querystring');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const utils = require('../utils');
const HOUR_MS = 3600000;

/* Load Access Variables */
const index_uri = require('../config').app.index();
const login_url = index_uri + '/login';
const play_url = index_uri + '/play';

/* Database */
const User = require('../models/user');
const Playlist = require('../models/playlist');
const genres = require('../resources/genres.json').genres;

/* Spotify */
const MAX_SEED_LENGTH = 5;
const NUM_RETURN_RECS = 10;

/* refresh token on each call */
router.use((req, res, next) => {
    if (!req.session.userid || utils.compareTime(new Date(), req.session.last_auth, HOUR_MS)) {
        if (req.path == '/') {
            res.redirect(
                login_url +
                    '?' +
                    querystring.stringify({ auth_redirect_uri: play_url })
            );
        } else {
            res.status(401).send('User session expired or not logged in.');
        }
    } else {
        next();
    }
});

router.get('/',  (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/play.html'));
});

router.use('/init', init);

router.get('/recommend', async (req, res, next) => {
    console.log('GETTING RECOMMENDATIONS');

    try {
        var user = await User.findOne({ _id: req.session.user_uid });
        if (!user) {
            return next(
                'User has no corresponding record - log in or refresh.'
            );
        }
    } catch (error) {
        return next(error);
    }

    // Use existing preferences if they exist, otherwise random genres.
    var seed_list;
    var seed_tracks = '',
        seed_artists = '',
        seed_genres = '';

    // TODO: Make max 4, and always include a random genre
    if (user.preferences.length < MAX_SEED_LENGTH) {
        var random_genres = utils.getRandomElements(
            genres,
            MAX_SEED_LENGTH - user.preferences.length
        );
        random_genres.forEach(random_genre => {
            seed_genres += random_genre + '%2C';
        });

        console.log(random_genres);
        seed_list = user.preferences;
    } else {
        seed_list = utils.getRandomElements(user.preferences, MAX_SEED_LENGTH);
    }


    seed_list.forEach(seed => {
        console.log(seed);
        if (seed.type === 'artist') {
            seed_artists += seed.id + '%2C';
        } else if (seed.type === 'genre') {
            seed_genres += seed.id + '%2C';
        } else if (seed.type === 'track') {
            seed_tracks += seed.id + '%2C';
        }
    });

    console.log('tracks' + seed_tracks);

    seed_tracks =
        seed_tracks === ''
            ? ''
            : 'seed_tracks=' +
              seed_tracks.slice(0, seed_tracks.length - 3) +
              '&';
    seed_artists =
        seed_artists === ''
            ? ''
            : 'seed_artists=' +
              seed_artists.slice(0, seed_artists.length - 3) +
              '&';
    seed_genres =
        seed_genres === ''
            ? ''
            : 'seed_genres=' +
              seed_genres.slice(0, seed_genres.length - 3) +
              '&';

    console.log(
        'seeds: ' +
            seed_tracks +
            seed_artists +
            seed_genres +
            '&min_popularity=50'
    );
    var seeds = seed_tracks + seed_artists + seed_genres + '&min_popularity=50';
    var recommendation_options = {
        url:
            'https://api.spotify.com/v1/recommendations?limit=' +
            NUM_RETURN_RECS +
            '&' +
            seeds,
        headers: { Authorization: 'Bearer ' + req.session.access_token },
        json: true,
    };

    request.get(recommendation_options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            res.json({
                track_ids: body.tracks.map(track => track.id),
            });
        } else {
            next(error);
        }
    });
});

router.post('/like', jsonParser, (req, res, next) => {
    var track = req.body.track;

    var add_track_options = {
        url:
            'https://api.spotify.com/v1/playlists/' +
            req.session.playlistid +
            '/tracks?' +
            querystring.stringify({
                uris: track.uri,
            }),
        headers: { Authorization: 'Bearer ' + req.session.access_token },
        json: true,
    };

    // eslint-disable-next-line no-unused-vars
    request.post(add_track_options, (error, response, body) => {
        if (error || response.statusCode != 201) {
            // failed to add song to playlist...
            next(error);
        } else {
            Playlist.findOneAndUpdate(
                { _id: req.session.playlist_uid },
                { $addToSet: { songs: track } }
            );
        }
    });

    User.findOneAndUpdatePreferences({ _id: req.session.user_uid }, track, 1);
});

router.post('/dislike', jsonParser, req => {
    User.findOneAndUpdatePreferences(
        { _id: req.session.user_uid },
        req.body.track,
        -1
    );
});

// eslint-disable-next-line no-unused-vars
router.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = router;
