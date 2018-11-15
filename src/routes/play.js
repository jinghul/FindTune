const express = require('express');
const path = require('path');
var router = express.Router();

/* Utility Methods */
var request = require('request');
var cors = require('cors');
var querystring = require('querystring');

/* Load Access Variables */
var access_token, userid, playlistid;
var login_url = "http://localhost:8888/login/";

/* Database */
var User = require('../models/user');
var Cache = require('../models/cache');
var Song = Cache.Song;
var Playlist = Cache.Playlist;


/* Database Instances -- Use cache instead with mongoose */
var user;
var playlist;
var queue;

router.use((req,res,next) => {
    if (!access_token) {
        console.log("redirect");
        res.redirect(login_url); // TODO: return here after
    }

    next();
});

router.get('/', (req, res) => {
    if (req.query.access_token) {
        access_token = req.query.access_token;
    } else {
        // next(new Error)
    }

    var prof_options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
    
    // get the user profile and see if they exist in database
    request.get(prof_options, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            // set USER cookie, or keep it on the front end with refresh token...
            User.findOne({userid:body.id}).then(function(record) {
                if (!record) {
                    user = new User({
                        name : body.display_name, 
                        userid : body.id,
                        premium : body.product === "premium",
                        preferences : []
                    });
                    user.save();

                    userid = body.id;
                } else {
                    user = record;
                    user.premium = body.product === "premium";
                    userid = user.userid;
                    playlistid = user.playlistid;
                    user.save();
                }
            }).then(() => {
                /* verify playlist or create playlist, then load the queue */
                if (playlistid) {
                    var check_playlist_options = {
                        url : 'https://api.spotify.com/v1/playlists/' + playlistid + '/',
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        json: true
                    }

                    request.get(check_playlist_options, (error, response, body) => {
                        if (error || response.statusCode != 200) {
                            Playlist.findOneAndDelete({playlistid : playlistid});
                            create_playlist(user);
                        } else {
                            Playlist.findOne({playlistid : playlistid}).then(function(record) {
                                playlist = record;
                                queue = record.queue; 
                            });
                        }
                    });
                } else {
                    create_playlist(user);
                }
            });
        } else {
            res.send(response).end();
        }
    });

    res.sendFile(path.join(__dirname, '/public/play.html'));
    // face api should get camera access
});

var create_playlist = function(user) {
    // create playlist
    var create_playlist_options = {
        url : 'https://api.spotify.com/v1/users/' + userid + '/playlists',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: {
            "name" : "FindTune",
            "description" : "Your face built this playlist.",
            "public" : "false"
        }
    }

    request.post(create_playlist_options, (error, response, body) => {
        user.playlistid = body.id;
        user.save();
        playlist = new Playlist({
            playlistid : body.id,
            songs : [],
            queue : []
        });
        playlist.save();
    });
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