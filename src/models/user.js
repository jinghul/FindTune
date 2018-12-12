const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreferenceSchema = new Schema({
    name: { type: String }, // name of the category
    id: { type: String, required: true }, // categoryID, required – maps to the genre cache
    image: { type: String },
    likes: { type: Number },
    dislikes: { type: Number },
});

PreferenceSchema.valueOf = function() {
    return this.id;
};

const UserSchema = new Schema({
    name: String, // user name, required
    id: { type: String, required: true }, // user id from Spotify, required
    playlist_uid: Schema.Types.ObjectId, // custom playlists for our app
    preferences: {
        // preference based on category
        tracks: [PreferenceSchema],
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
function binaryIndexOf(searchId) {
    'use strict';

    var minIndex = 0;
    var maxIndex = this.length - 1;
    var currentIndex;
    var currentElement;

    while (minIndex <= maxIndex) {
        currentIndex = ((minIndex + maxIndex) >>> 1) | 0;
        currentElement = this[currentIndex];

        if (currentElement < searchId) {
            minIndex = currentIndex + 1;
        } else if (currentElement > searchId) {
            maxIndex = currentIndex - 1;
        } else {
            return currentIndex;
        }
    }

    if (minIndex > currentIndex) {
        return ~minIndex;
    } else if (maxIndex > currentIndex) {
        return ~maxIndex;
    }
    return ~currentIndex;
}

UserSchema.methods.updateTracks = function(track, confirm) {
    Array.prototype.binaryIndexOf = binaryIndexOf;

    var preferences = this.preferences.tracks;
    var index = preferences.binaryIndexOf(track.id);
    if (index < 0) {
        preferences.splice(Math.abs(index), 0, {
            name: track.name,
            id: track.id,
            image: track.albumImg,
        });
    }

    if (confirm) {
        this.save();
    }
};

UserSchema.methods.updateGenres = function(genres, update, confirm) {
    Array.prototype.binaryIndexOf = binaryIndexOf;

    var preferences = this.preferences.genres;
    genres.forEach(genre => {
        var index = preferences.binaryIndexOf(genre.id);
        if (index >= 0) {
            if (update > 0) {
                preferences[index].likes += 1;
            } else {
                preferences[index].likes -= 1;
            }
        } else {
            var genrePref = {
                id : genre,
                likes: 0,
                dislikes: 0,
            }

            if (update > 0) {
                genrePref.likes = 1;
            } else {
                genrePref.dislikes = 1;
            }

            preferences.splice(Math.abs(index), 0, genrePref);
        }
    });

    if (confirm) {
        this.save();
    }
};

UserSchema.methods.updateArtists = function(artists, update, confirm) {
    Array.prototype.binaryIndexOf = binaryIndexOf;

    var preferences = this.preferences.artists;
    artists.forEach(artist => {
        var index = preferences.binaryIndexOf(artist.id);
        if (index >= 0) {
            if (update > 0) {
                preferences[index].likes += 1;
            } else {
                preferences[index].likes -= 1;
            }
        } else {
            var artistPref = {
                name: artist.name,
                id: artist.id,
                likes: 0,
                dislikes: 0,
            }

            if (update > 0) {
                artistPref.likes = 1;
            } else {
                artistPref.dislikes = 1;
            }

            preferences.splice(Math.abs(index), 0, artistPref);
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
        user.updateTracks(track);
        user.updateGenres(track.genres, update);
        user.updateArtists(track.artists, update);
        user.save();
    });
};

const User = mongoose.model('user', UserSchema);

module.exports = User;
