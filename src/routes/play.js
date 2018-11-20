const express = require('express');
const path = require('path');
var router = express.Router();

/* Utility Methods */
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const utils = require('../utils');

/* Load Access Variables */
const login_url = "http://localhost:8888/login/";

/* Database */
const User = require('../models/user');
const Playlist = require('../models/playlist');
// var Genres;

/* Spotify */
const MAX_SEED_LENGTH = 5;
var refresh_token = require('./auth').refresh_token;

// loadGenres();
// function loadGenres() {
//     try {

//     } catch (...) {

//     }
// }

/* refresh token on each call */
router.use(refresh_token, (req, res, next) => {
    if (req.err) {
        // most likely access_token expired, redirect to login
        console.log("*** ERROR: NEEDS NEW ACCESS TOKEN ***")

        // TODO: Query params of redirect instead of cookie
        req.session.auth_redirect_key = '../play';
        res.redirect(login_url);
    } else {
        console.log("SUCCESS: REDIRECTED AND GOT ACCESS");
        next();
    }
});

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/play.html'));
});

router.post('/init', async (req, res, next) => {
    if (!req.session.userid) {
        return next("User is not logged in.");
    }

    try {
        var user;
        var playlist_uid;
        var playlistid = req.session.playlistid;
        await User.findOne({id:req.session.userid}).then(function(found) {
            if (!found) {
                user = new User({
                    name : req.session.user_name, 
                    id : req.session.userid,
                    preferences : []
                });
            } else {
                user = found;
                playlist_uid = user.playlist_uid;
            }
        });

        var verified_playlist = await verify_playlist(req.session.userid, playlistid, playlist_uid, req.session.access_token);
        req.session.playlistid = verified_playlist.id;

        if (playlist_uid != verified_playlist.uid) {
            user.playlist_uid = verified_playlist.uid;
            user.save();
        } else {
            console.log("PLAYLIST MATCHES USER");
        }

        // DEBUG
        console.log(playlistid);
        // await get_recommendations();
        res.status(200).send("OK");
    } catch (error) {
        return next(error);
    }
});

function verify_playlist(userid, playlistid, playlist_uid, access_token) {
    if (!playlist_uid) {
        /* User has no associated playlist. */
        console.log("NO ASSOCIATED PLAYLIST RECORD");
        return create_playlist(userid, access_token);
    }

    var verify_playlist_options = {
        url : 'https://api.spotify.com/v1/playlists/' + playlistid + '/',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };

    return new Promise((resolve, reject) => {
        request.get(verify_playlist_options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                Playlist.findOne({_id : playlist_uid, id : playlistid}).then(function(found) {
                    if (found) {
                        console.log("FOUND ACTIVE PLAYLIST and CORRESPONDING RECORD");
                        resolve({
                            uid : found._id,
                            id : found.id
                        });
                    } else {
                        console.log("ACTIVE PLAYLIST BUT NO RECORD, creating...");
                        resolve(create_playlist_record(playlistid));
                    }
                });
            } else {
                Playlist.findOneAndDelete({_id : playlist_uid});
                resolve(create_playlist(userid, access_token));
            }
        });
    });
}

function create_playlist(userid, access_token) {
    var create_playlist_options = {
        url : 'https://api.spotify.com/v1/users/' + userid + '/playlists',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: {
            "name" : "FindTune",
            "description" : "Your face built this playlist.",
            "public" : "false"
        }
    }

    console.log("CREATING PLAYLIST IN SPOTIFY");
    return new Promise((resolve, reject) => {
        request.post(create_playlist_options, async (error, response, body) => {
            if (!error && response.statusCode == 201) {
                resolve(create_playlist_record(body.id));
            } else {
                console.log(error + " " + response.statusCode + " " + response.statusMessage);
                reject(error);
            }
        });
    })
}

function create_playlist_record(playlistid) {
    console.log("CREATING PLAYLIST " + playlistid + " RECORD");
    return new Promise((resolve, reject) => {
        var playlist = new Playlist({
            id : playlistid,
            songs : [],
            queue : []
        });

        playlist.save().then(() => {
            resolve({
                uid : playlist._id,
                id : playlistid
            });
        }).catch(() => {
            reject("Error saving playlist to MongoDB.");
        });
    });
}

async function get_recommendations() {
    var seeds = await get_random_seeds();
    var recommendation_options = {
        url : 'https://api.spotify.com/v1/recommendations?limit=5&' + encodeURIComponent(seeds),
        headers : {'Authorization' : 'Bearer ' + req.session.access_token},
        json : true
    }
}

async function get_random_seeds() {
    User.findOne({id: req.session.userid}).then(function(user) {
        // Existing preferences exist
        var seeds = "";
        var seed_list;
        var seed_artists = "seed_artists=";
        var seed_genres = "seed_genres="

        if (user.preferences.length <= MAX_SEED_LENGTH) {
            seed_genres += get_random_genres(MAX_SEED_LENGTH - user.preferences.length);
            seed_list = user.preferences;
        } else {
            seed_List = utils.getRandomElements(user.preferences, MAX_SEED_LENGTH);
        }

        for (var seed in seed_list) {
            if (seed.type == "artist") {
                seed_artists += seed.id + ","
            } else if (seed.type == "genre") {
                seed_genres += seed.id + ","
            }
            // TODO: Track
        }

        if (seed_artists == "seed_artists=") {
            seed_artists = "";
        } else {
            seed_artists = seed_artists.slice(0, seeds.length - 1);
        }
        if (seed_genres == "seed_genres=") {
            seed_genres = "";
        } else {
            seed_genres = seed_genres.slice(0, seeds.length - 1);
        }

        return seed_artists + "&" + seed_genres;
    });
}

async function get_random_genres(count) {
    if (count == 0) {
        return;
    }

    var cached_genres = await Cache.findOne({name : "Genre"});
    if (!cached_genres) {
        var get_genres_options = {
            url : "https://api.spotify.com/v1/recommendations/available-genre-seeds",
            headers : {'Authorization' : 'Bearer ' + req.session.access_token},
            json : true
        }
    
        request.get(get_genres_options, (err, response, body) => {
            if (!error && response.statusCode == 200) {
                Cache.insertOne({
                    name : "Genre",
                    data : body.genres
                });
                return utils.getRandomElements(body.genres, count);
            }
        });
    } else {
        return utils.getRandomElements(cached_genres.data, count);
    }
}

router.post('/skip', (req, res) => {
    // get next playlist in queue
    var skip_song_options = {
        url : 'https://api.spotify.com/v1/me/player/next/',
        headers: {'Authorization' : 'Bearer ' + req.session.access_token },
        json : true
    }

    request.post(skip_song_options, (error, response, body) => {
        res.json(response).end();
    });

});

router.post('/like', (req, res) => {
    // like song and save to playlist, also get recommendations and add to queue

});

router.post('/refresh', (req, res) => {
    access_token = req.query.access_token;
});

module.exports = router;