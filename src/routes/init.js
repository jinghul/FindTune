/* Express Routing */
const express = require('express');
const router = express.Router();

/* Utils */
const request = require('request');

/* Database */
const User = require('../models/user');
const Playlist = require('../models/playlist');

router.get(
    '/',
    verify_user,
    verify_playlist,
    create_playlist,
    create_playlist_record
);

async function verify_user(req, res, next) {
    var query = req.session.user_uid
        ? { _id: req.session.user_uid }
        : { id: req.session.userid };
    User.findOne(query)
        .then(function(user) {
            if (!user) {
                user = new User({
                    name: req.session.user_name,
                    id: req.session.userid,
                    preferences: [],
                });
                user.save();
                initPreferences(user, req.session.access_token);
            }

            req.session.user_uid = user._id;
            req.session.playlist_uid = user.playlist_uid;
            next();
        })
        .catch(next);
}

function initPreferences(user, access_token) {
    var get_top_options = {
        url:
            'https://api.spotify.com/v1/me/top/tracks',
        headers: { Authorization: 'Bearer ' + access_token },
        json: true,
    };

    request.get(get_top_options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            body.items.foreach(item => (user.preferences.push({
                name : item.name,
                id : item.id,
                type : 'track'
            })));
        }
    });
}


async function verify_playlist(req, res, next) {
    console.log(
        'VERIFY_PLAYLIST: ' +
            req.session.playlistid +
            ' ' +
            req.session.playlist_uid
    );
    if (!req.session.playlist_uid) {
        /* User has no associated playlist. */
        console.log('NO ASSOCIATED PLAYLIST RECORD');
        delete req.session.playlist_uid;
        return next();
    } else {
        var playlist = await Playlist.findOne({
            _id: req.session.playlist_uid,
        });
        if (playlist === null) {
            console.log('NO ASSOCIATED PLAYLIST RECORD');
            delete req.session.playlist_uid;
            return next();
        }
        req.session.playlistid = playlist.id;
        console.log('PLAYLISTID: ' + req.session.playlistid);
    }

    var verify_playlist_options = {
        url:
            'https://api.spotify.com/v1/playlists/' +
            req.session.playlistid +
            '/',
        headers: { Authorization: 'Bearer ' + req.session.access_token },
        json: true,
    };

    // eslint-disable-next-line no-unused-vars
    request.get(verify_playlist_options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            Playlist.findOne({ _id: req.session.playlist_uid }).then(function(
                playlist
            ) {
                if (
                    playlist != null &&
                    playlist.id === req.session.playlistid
                ) {
                    console.log(
                        'FOUND ACTIVE PLAYLIST and CORRESPONDING RECORD'
                    );
                    res.status(200).end();
                } else {
                    console.log('ACTIVE PLAYLIST BUT NO RECORD, creating...');
                    next();
                }
            });
        } else if (response.statusCode == 401) {
            // Unauthorized, needs login again
            res.status(401).send('User access expired or not logged in.');
        } else {
            console.log(response.statusCode + ' ' + response.statusMessage);
            Playlist.findOneAndDelete({ _id: req.session.playlist_uid });
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
        url:
            'https://api.spotify.com/v1/users/' +
            req.session.userid +
            '/playlists',
        headers: { Authorization: 'Bearer ' + req.session.access_token },
        json: {
            name: 'FindTune',
            description: 'Your face built this playlist.',
            public: 'false',
        },
    };

    console.log('CREATING PLAYLIST IN SPOTIFY');
    request.post(create_playlist_options, async (error, response, body) => {
        if (!error && response.statusCode == 201) {
            req.session.playlistid = body.id;
            next();
        } else if (response.statusCode == 401) {
            res.status(401).send('User access expired or not logged in.');
        }
    });
}

function create_playlist_record(req, res, next) {
    if (req.session.playlist_uid != undefined) {
        return next();
    }

    console.log('CREATING PLAYLIST ' + req.session.playlistid + ' RECORD');
    var playlist = new Playlist({
        id: req.session.playlistid,
        songs: [],
    });

    playlist
        .save()
        .then(() => {
            User.findOneAndUpdate(
                { _id: req.session.user_uid },
                { $set: { playlist_uid: playlist._id } }
            );
            req.session.playlist_uid = playlist._id;
            res.status(200).end();
        })
        .catch(() => {
            next('Error saving playlist to MongoDB.');
        });
}