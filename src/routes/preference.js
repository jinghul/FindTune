const request = require('request');
const querystring = require('querystring');

const Playlist = require('../models/playlist');
const User = require('../models/user');

function like(req, res, next) {
    var track = JSON.parse(req.body.track);

    Playlist.findOne({_id : req.session.playlist_uid}).then(playlist => {
        if (!playlist) {
            return res.status(401).send('Playlist not found.');
        }

        var found = false;
        for (var i=0; i < playlist.songs.length; i++) {
            if (playlist.songs[i].id == track.id) {
                found = true;
                break;
            }
        }

        return found;
    }).then(found => {

        if (found) {
            return res.status(200).send('Song already exists in playlist.');
        }

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
            if (!error && response.statusCode == 201) {
                Playlist.findOneAndUpdate(
                    { _id: req.session.playlist_uid },
                    { $addToSet: { songs: track } }
                );
            } else {
                next({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                });
            }
        });
    
        User.findOneAndUpdatePreferences({ _id: req.session.user_uid }, track, 1);
        res.json({ action: 'like', trackId: track.id }).end();
    });
}

// eslint-disable-next-line no-unused-vars
function dislike(req, res, next) {
    var track = JSON.parse(req.body.track);

    User.findOneAndUpdatePreferences(
        { _id: req.session.user_uid },
        track,
        -1
    );

    res.json({ action: 'dislike', trackId: track.id }).end();
}

module.exports.like = like;
module.exports.dislike = dislike;