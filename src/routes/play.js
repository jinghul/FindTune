/* Express Routing */
const express = require('express');
const router = express.Router();
const init = require('./init');
const preference = require('./preference');

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
const genres = require('../resources/genres.json').genres;

/* Spotify */
const MAX_SEED_LENGTH = 5;
const NUM_RETURN_RECS = 10;

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
                    querystring.stringify({ auth_redirect_uri: play_url })
            );
        } else {
            next({ statusCode: 401 });
        }
    } else {
        next();
    }
});

router.use('/init', init);

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/play.html'));
});

router.get('/recommend', (req, res, next) => {
    User.findOne({ _id: req.session.user_uid }).then(user => {
        if (!user) {
            return next(
                'User has no corresponding record - log in or refresh.'
            );
        }

        var seedTracks = '',
            seedArtists = '',
            seedGenres = '';
        
        var preferences = {...user.preferences};
        var prefTracks = preferences.tracks;
        var prefArtists = preferences.artists;
        var prefGenres = preferences.genres;

        var totalLength = prefTracks.length + prefArtists.length + prefGenres.length;
        if (totalLength < MAX_SEED_LENGTH) {
            var random_genres = utils.getRandomElements(
                genres,
                MAX_SEED_LENGTH - totalLength
            );

            random_genres.forEach(randomGenre => {
                seedGenres += randomGenre + '%2C';
            });
        } else {
            var total = 0;
            while (total < MAX_SEED_LENGTH) {
                var randomCategory = utils.getRandomNumber(3);
                let randomIndex;
                if (randomCategory == 0 && prefTracks.length > 0) {
                    randomIndex = utils.getRandomNumber(prefTracks.length);
                    seedTracks += prefTracks[randomIndex].id + '%2C';
                    prefTracks.splice(randomIndex, 1);
                    total += 1;
                } else if (randomCategory == 1 && prefArtists.length > 0) {
                    randomIndex = utils.getRandomNumber(prefArtists.length);
                    seedArtists += prefArtists[randomIndex].id + '%2C';
                    prefArtists.splice(randomIndex, 1);
                    total += 1;
                } else if (prefGenres.length > 0) {
                    randomIndex = utils.getRandomNumber(prefGenres.length);
                    seedGenres += prefGenres[randomIndex].id + '%2C';
                    prefGenres.splice(randomIndex, 1);
                    total += 1;
                }
            }
        }

        function parse(seed_type, seed_name) {
            return seed_type === ''
                ? ''
                : seed_name +
                      '=' +
                      seed_type.slice(0, seed_type.length - 3) +
                      '&';
        }

        seedTracks = parse(seedTracks, 'seed_tracks');
        seedArtists = parse(seedArtists, 'seed_artists');
        seedGenres = parse(seedGenres, 'seed_genres');

        var seeds =
            seedTracks + seedArtists + seedGenres + 'min_popularity=50';
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
                Promise.all(
                    body.tracks.map(track => {
                        return getTrackInfo(
                            track.id,
                            req.session.access_token
                        ).then(trackInfo => {
                            return trackInfo;});
                    })
                )
                    .then(tracks => {
                        res.json({
                            tracks: tracks,
                        });
                    })
                    .catch(next);
            } else {
                next({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                });
            }
        });
    });
});

function getTrackInfo(songId, access_token) {
    var getSongOptions = {
        url: 'https://api.spotify.com/v1/tracks/' + songId,
        headers: { Authorization: 'Bearer ' + access_token },
        json: true,
    };

    return new Promise((resolve, reject) => {
        request.get(getSongOptions, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var songInfo = {};
                songInfo.name = body.name;
                songInfo.id = body.id;
                songInfo.uri = body.uri;
                songInfo.href = body.external_urls.spotify;
                songInfo.albumImg = body.album.images[0].url; // 640 x 640 album image
                songInfo.artists = body.artists.map(artist => ({
                    name: artist.name,
                    id: artist.id,
                }));

                resolve(songInfo);
            } else {
                reject({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                });
            }
        });
    })
        .then(songInfo => {
            var getArtistOptions = {
                url:
                    'https://api.spotify.com/v1/artists/' +
                    songInfo.artists[0].id,
                headers: { Authorization: 'Bearer ' + access_token },
                json: true,
            };

            return new Promise((resolve, reject) => {
                request.get(getArtistOptions, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        songInfo.genres = body.genres;
                        resolve(songInfo);
                    } else {
                        reject({
                            statusCode: response.statusCode,
                            statusMessage: response.statusMessage,
                        });
                    }
                });
            });
        })
        .catch(err => err);
}

router.post('/like', jsonParser, preference.like);
router.post('/dislike', jsonParser, preference.dislike);

// eslint-disable-next-line no-unused-vars
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
