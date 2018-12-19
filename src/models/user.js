const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreferenceSchema = new Schema({
    name: { type: String }, // name of the category
    id: { type: String, required: true }, // categoryID, required – maps to the genre cache
    image: { type: String },
    likes: { type: Number },
    dislikes: { type: Number },
});

const UserSchema = new Schema({
    name: String, // user name, required
    id: { type: String, required: true }, // user id from Spotify, required
    playlist_uid: Schema.Types.ObjectId, // custom playlists for our app
    preferences: {
        // preference based on category
        tracks: [PreferenceSchema],
        badtracks: [PreferenceSchema],
        artists: [PreferenceSchema],
        genres: [PreferenceSchema],
    },
});

/**
 * Performs a binary search on preferences by the id.
 *
 * @param {*} searchId The item to search for within the array.
 * @return {Number} The index of the element which defaults to -1 when not found.
 */
function binaryIndexOf(preferences, searchId) {
    'use strict';

    var left = 0;
    var right = preferences.length;
    var m = 0;

    while (left < right) {
        m = ((left + right) >>> 1) | 0;
        if (preferences[m].id >= searchId) {
            right = m;
        } else {
            left = m + 1;
        }
    }

    return left;
}

UserSchema.methods.updateTrack = function(track, confirm) {
    var preferences = this.preferences.tracks;
    var index = binaryIndexOf(preferences, track.id);
    if (
        preferences.length == 0 ||
        preferences.length <= index ||
        preferences[index].id != track.id
    ) {
        preferences.splice(index, 0, {
            name : track.name,
            id: track.id,
            image: track.albumImg
        });
    }

    if (confirm) {
        this.save();
    }
};

UserSchema.methods.updateGenres = function(genres, update, confirm) {
    var preferences = this.preferences.genres;

    genres.forEach(genre => {
        var index = binaryIndexOf(preferences, genre);
        if (preferences.length > index && preferences[index].id == genre) {
            if (update > 0) {
                preferences[index].likes += 1;
            } else {
                preferences[index].dislikes += 1;
            }
        } else {
            var genrePref = {
                id: genre,
                likes: 0,
                dislikes: 0,
            };

            if (update > 0) {
                genrePref.likes = 1;
            } else {
                genrePref.dislikes = 1;
            }

            preferences.splice(index, 0, genrePref);
        }
    });

    if (confirm) {
        this.save();
    }
};

UserSchema.methods.updateArtists = function(artists, update, confirm) {
    var preferences = this.preferences.artists;

    artists.forEach(artist => {
        var index = binaryIndexOf(preferences, artist.id);
        if (preferences.length > index && preferences[index].id == artist.id) {
            if (update > 0) {
                preferences[index].likes += 1;
            } else {
                preferences[index].dislikes += 1;
            }
        } else {
            var artistPref = {
                name: artist.name,
                id: artist.id,
                likes: 0,
                dislikes: 0,
            };

            if (update > 0) {
                artistPref.likes = 1;
            } else {
                artistPref.dislikes = 1;
            }

            preferences.splice(index, 0, artistPref);
        }
    });

    if (confirm) {
        this.save();
    }
};

UserSchema.statics.findOneAndUpdatePreferences = function(
    query,
    track,
    update
) {
    User.findOne(query).then(user => {
        if (update > 0) {
            user.updateTrack(track);
        }
        user.updateGenres(track.genres, update);
        user.updateArtists(track.artists, update);
        user.save();
    });
};

const User = mongoose.model('user', UserSchema);

module.exports = User;
