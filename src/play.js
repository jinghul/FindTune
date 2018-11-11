var express = require('express');
var router = express.Router();

/* Utility Methods */
var request = require('request');
var cors = require('cors');
var querystring = require('querystring');

/* Load Access Variables */
var access_token, userid, playlistid;
var login_url = "http://localhost:8888/login/";

/* Database */
var mongoose = require('mongoose');
var User = require('./models/user');
var Category = require('./models/cache');
var database_ref = 'mongodb://localhost/findtune'


// check if connection exits?
mongoose.connect(database_ref, { useNewUrlParser: true }); // test database

mongoose.connection.once('open', function() {
    console.log("Connection made with MongoDB database.");
}).on('error', function(error) {
    console.log('Connection error: ', error);	
});

router.use((req,res,next) => {
    if (req.query.access_token) {
        access_token = req.query.access_token;
    } else if (!access_token) {
        console.log("redirect");
        res.redirect(login_url);
    }
    next();
});

router.get('/', (req, res) => {
    var prof_options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
    
    var user;

    // get the user profile and see if they exist in database
    request.get(prof_options, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            User.findOne({userid:body.id}).then(function(record) {
                if (!record) {
                    user = new User({
                        name : body.display_name, 
                        userid : body.id,
                        premium : body.product === "premium"
                    }).save();

                    userid = body.id;
                } else {
                    user = record;
                    user.premium = body.product === "premium";
                    userid = user.userid;
                    playlistid = user.playlistid;
                    user.save();
                }

                
            }).then(() => {verify_playlist(user);});
        } else {
            res.send(response).end();
        }
    });

    // get camera access

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
        playlistid = body.id;
        user.playlistid = body.id;
        user.save().then(() => {
            console.log(body);
        }).catch(() => {});
    });
}

var verify_playlist = function(user) {
    if (playlistid) {
        var check_playlist_options = {
            url : 'https://api.spotify.com/v1/playlists/' + playlistid + '/',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
        }

        request.get(check_playlist_options, (error, response, body) => {
            if (error || response.statusCode != 200) {
                create_playlist(user);
            }
        });
    } else {
        create_playlist(user);
    }
}

router.get('/skip', (req, res) => {
    // skip this song, if possible, and remember preference
    
});

router.get('/like', (req, res) => {
    // like song and save to playlist

});

router.get('/update', (req, res) => {
    access_token = req.query.access_token;

});

module.exports = router;