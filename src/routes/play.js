const express = require('express');
const path = require('path');
var router = express.Router();

/* Utility Methods */
const request = require('request');
const querystring = require('querystring');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()
const utils = require('../utils');

/* Load Access Variables */
const login_url = "http://localhost:8888/login/";

/* Database */
const User = require('../models/user');
const Playlist = require('../models/playlist');
const genres = require('../resources/genres.json').genres;

/* Spotify */
const MAX_SEED_LENGTH = 5;
const MAX_QUEUE_LENGTH = 10;
const MIN_QUEUE_LENGTH = 5;

/* refresh token on each call */
router.use((req, res, next) => {
    if (!req.session.userid || !req.session.access_token) {
        // TODO: Query params of redirect instead of cookie
        req.session.auth_redirect_key = '../play';
        res.redirect(login_url);
    } else {
        return next();
    }
});

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/play.html'));
});

router.post('/init', 
    verify_user, 
    verify_playlist, 
    create_playlist, 
    create_playlist_record);

function verify_user(req, res, next) {
    var query = req.session.user_uid ? {_id : req.session.user_uid} : {id : req.session.userid}
    User.findOne(query).then(function(user) {
        if (!user) {
            user = new User({
                name : req.session.user_name, 
                id : req.session.userid,
                preferences : []
            });
            user.save();
        }

        req.session.user_uid = user._id;
        req.session.playlist_uid = user.playlist_uid;
        next();
    }).catch(next);
}

async function verify_playlist(req, res, next) {
    console.log("VERIFY_PLAYLIST: " + req.session.playlistid +" " + req.session.playlist_uid);
    if (!req.session.playlist_uid) {
        /* User has no associated playlist. */
        console.log("NO ASSOCIATED PLAYLIST RECORD");
        delete req.session.playlist_uid;
        return next();
    } else {
        var playlist = await Playlist.findOne({_id : req.session.playlist_uid});
        if (playlist === null) {
            console.log("NO ASSOCIATED PLAYLIST RECORD");
            delete req.session.playlist_uid;
            return next();
        }
        req.session.playlistid = playlist.id;
        console.log("PLAYLISTID: " + req.session.playlistid);
    }

    var verify_playlist_options = {
        url : 'https://api.spotify.com/v1/playlists/' + req.session.playlistid + '/',
        headers: { 'Authorization': 'Bearer ' + req.session.access_token },
        json: true
    };

    request.get(verify_playlist_options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            Playlist.findOne({_id : req.session.playlist_uid}).then(function(playlist) {
                if (playlist != null && playlist.id === req.session.playlistid) {
                    console.log("FOUND ACTIVE PLAYLIST and CORRESPONDING RECORD");
                    res.status(200).end();
                } else {
                    console.log("ACTIVE PLAYLIST BUT NO RECORD, creating...");
                    next();
                }
            });
        } else {
            console.log(response.statusCode + " " + response.statusMessage);
            Playlist.findOneAndDelete({_id : req.session.playlist_uid});
            delete req.session.playlistid;
            delete req.session.playlist_uid;
            next();
        }
    });
}

function create_playlist(req, res, next) {
    if (req.session.playlistid != undefined) {
        return next();
    }

    var create_playlist_options = {
        url : 'https://api.spotify.com/v1/users/' + req.session.userid + '/playlists',
        headers: { 'Authorization': 'Bearer ' + req.session.access_token },
        json: {
            "name" : "FindTune",
            "description" : "Your face built this playlist.",
            "public" : "false"
        }
    }

    console.log("CREATING PLAYLIST IN SPOTIFY");
    request.post(create_playlist_options, async (error, response, body) => {
        if (!error && response.statusCode == 201) {
            req.session.playlistid = body.id;
            next();
        } else {
            // TODO: past playlist moved
            next(error);
        }
    });
}

function create_playlist_record(req, res, next) {
    if (req.session.playlist_uid != undefined) {
        return next();
    }

    console.log("CREATING PLAYLIST " + req.session.playlistid + " RECORD");
    var playlist = new Playlist({
        id : req.session.playlistid,
        songs : [],
        queue : []
    });

    playlist.save().then(() => {
        User.findOneAndUpdate({_id: req.session.user_uid}, {$set : {playlist_uid : playlist._id}});
        req.session.playlist_uid = playlist._id;
        res.status(200).end();
    }).catch(() => {
        next("Error saving playlist to MongoDB.");
    });
}

async function get_recommendations(req, res, next) {
    console.log("GETTING RECOMMENDATIONS");
    var num_of_recs = 0;

    try {
        var user = await User.findOne({_id: req.session.user_uid});
        if (!user) {
            return next("User has no corresponding record - log in or refresh.");
        } else if (user.preferences === undefined) {
            user.preferences = [];
            user.save();
        }

        var playlist = await Playlist.findOne({_id : req.session.playlist_uid});
        if (playlist.queue === undefined) {
            playlist.queue = [];
            playlist.save();
        }
        
        if (playlist.queue.length < MIN_QUEUE_LENGTH) {
            num_of_recs = MAX_QUEUE_LENGTH - playlist.queue.length;
        } else {
            return next();
        }
    } catch (error) {
        return next(error);
    }

    // Use existing preferences if they exist, otherwise random genres.
    var seeds = "";
    var seed_list;
    var seed_tracks = "seed_tracks="
    var seed_artists = "seed_artists=";
    var seed_genres = "seed_genres="

    if (user.preferences.length <= MAX_SEED_LENGTH) {
        var random_genres = await get_random_genres(MAX_SEED_LENGTH - user.preferences.length);
        for (var i = 0; i < random_genres.length; i++) {
            seed_genres += random_genres[i] + "%2C";
        }

        console.log(random_genres);
        seed_list = user.preferences;
    } else {
        seed_List = utils.getRandomElements(user.preferences, MAX_SEED_LENGTH);
    }

    for (var seed in seed_list) {
        if (seed.type == "artist") {
            seed_artists += seed.id + "%2C";
        } else if (seed.type == "genre") {
            seed_genres += seed.id + "%2C";
        } else if (seed.type == "track") {
            seed_tracks += seed.id + "%2C";
        }
    }

    if (seed_tracks == "seed_tracks=") {
        seed_tracks = "";
    } else {
        seed_tracks = seed_tracks.slice(0, seeds.length - 3) + "&";
    }
    if (seed_artists == "seed_artists=") {
        seed_artists = "";
    } else {
        seed_artists = seed_artists.slice(0, seeds.length - 3) + "&";
    }
    if (seed_genres == "seed_genres=") {
        seed_genres = "";
    } else {
        seed_genres = seed_genres.slice(0, seeds.length - 3) + "&";
    }

    console.log("seeds: " + seed_artists + seed_genres + "min_popularity=50");
    seeds = seed_artists + seed_genres + "&min_popularity=50";

    var recommendation_options = {
        url : 'https://api.spotify.com/v1/recommendations?limit=' + num_of_recs + '&' + seeds,
        headers : {'Authorization' : 'Bearer ' + req.session.access_token},
        json : true
    }

    request.get(recommendation_options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            console.log(body.tracks.length);
            Playlist.findOneAndUpdate({_id : user.playlist_uid}, {$push : {queue : {$each : body.tracks}}}).then(() => {   
                console.log("FINISHED GETTING RECOMMENDATIONS");
                next();
            }).catch(next);
        } else {
            next(error);
        }
    });
}

function get_random_genres(count) {
    if (count == 0) {
        return [];
    }
    return utils.getRandomElements(genres, count);
}

router.post('/next', get_recommendations, (req, res, next) => {
    // get next playlist in queue
    Playlist.findOne({_id : req.session.playlist_uid}).then((playlist) => {
        var next_song = playlist.queue[0];
        console.log(next_song);
        playlist.queue.shift();
        playlist.save();
        res.send(next_song);
    }).catch(next);
});

router.post('/like', jsonParser, (req, res) => {
    // like song and save to playlist, also get recommendations and add to queue
    var track = req.body.track;
    var new_preferences = [];

    var add_track_options = {
        url : "https://api.spotify.com/v1/playlists/" + req.session.playlistid + "/tracks?" +
            querystring.stringify({
                uris : track.uri
            }),
        headers : {'Authorization' : 'Bearer ' + req.session.access_token},
        json : true
    }

    request.post(add_track_options, (error, response, body) => {
        if (error || response.statusCode != 201) {
            // failed to add song to playlist...
            next(err);
        }
    });

    new_preferences.push({
        name : track.name,
        id : track.id,
        type : "track"
    }, {
        name : track.artist.name,
        id : track.artist.id,
        type : "artist"
    }, {
        name : track.genre.name,
        id : track.genre.id,
        type : "genre"
    });

    User.findOneAndUpdate({_id : req.session.user_uid}, {$push : {$each : {preferences : new_preferences}}})
});

// TODO: Error handler
router.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = router;