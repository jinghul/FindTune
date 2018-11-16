const express = require('express');
const path = require('path');
var router = express.Router();

/* Utility Methods */
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');

/* Load Access Variables */
const auth_redirect_key = "auth_redirect_uri"
const login_url = "http://localhost:8888/login/";

/* Database */
const User = require('../models/user');
const Cache = require('../models/cache');
const Song = Cache.Song;
const Playlist = Cache.Playlist;
var refresh_token = require('./auth').refresh_token;

/* refresh token on each call */
router.use(refresh_token, (req, res, next) => {
    if (req.err) {
        // most likely access_token expired, redirect to login
        console.log("*** ERROR: NEEDS NEW ACCESS TOKEN ***")
        req.session.auth_redirect_key = '../play';
        res.redirect(login_url);
    } else {
        console.log("SUCCESS: REDIRECTED AND GOT ACCESS");
        next();
    }
});

router.get('/', async (req, res) => {
    // return res.sendFile(path.join(__dirname, '../public/play.html'));
    var playlistid;
    var user;

    try {
        await User.findOne({userid:req.session.userid}).then(function(found) {
            if (!found) {
                user = new User({
                    name : body.display_name, 
                    userid : body.id,
                    preferences : []
                });
            } else {
                user = found;
                playlistid = user.playlistid;
            }
        });

        var playlistid = await verify_playlist(req.session.userid, playlistid);
        user.playlistid = playlistid;

        // DEBUG
        console.log(playlistid);
        user.save();
    } catch (error) {
        next(error);
    }
    
    res.sendFile(path.join(__dirname, '/public/play.html'));
});

function verify_playlist(userid, playlistid) {
    if (!playlistid) {
        return create_playlist;
    }

    var verify_playlist_options = {
        url : 'https://api.spotify.com/v1/playlists/' + playlistid + '/',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    }

    request.get(verify_playlist_options, (error, response, body) => {
        if (error || response.statusCode != 200) {
            Playlist.findOneAndDelete({playlistid : playlistid});
            create_playlist(userid, playlistid);
        } else {
            Playlist.findOne({playlistid : playlistid}).then(function(record) {
                playlist = record;
                queue = record.queue; 
            });
        }
    });
}

function create_playlist(userid) {
    var create_playlist_options = {
        url : 'https://api.spotify.com/v1/users/' + userid + '/playlists',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: {
            "name" : "FindTune",
            "description" : "Your face built this playlist.",
            "public" : "false"
        }
    }

    return new Promise((resolve, reject) => {
        request.post(create_playlist_options, (error, response, body) => {
            // if not error and statusCOde!!!
            playlist = new Playlist({
                playlistid : body.id,
                songs : [],
                queue : []
            });
            playlist.save();
        });
    })
}

router.post('/skip', (req, res) => {
    // skip this song, if possible, and remember preference
    var skip_song_options = {
        url : 'https://api.spotify.com/v1/me/player/next/',
        headers: {'Authorization' : 'Bearer ' + access_token },
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