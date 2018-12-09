const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreferenceSchema = new Schema({
    name: { type: String, required: true }, // name of the category
    id: { type: String, required: true }, // categoryID, required – maps to the genre cache
    type: { type: String, required: true }, // the type of category e.g. artist, genre, track
    likes: { type: Number },
    dislikes: { type: Number },
});

const UserSchema = new Schema({
    name: String, // user name, required
    id: { type: String, required: true }, // user id from Spotify, required
    playlist_uid: Schema.Types.ObjectId, // custom playlists for our app
    preferences: [PreferenceSchema], // preference array based on category
});

function updatePreferences(query, items, type, update) {
    items.forEach(artist => {
        query['preferences.id'] = artist.id;
        User.findOneAndUpdate(
            query,
            { $inc: { 'preferences.$.like': update } },
            (err, doc) => {
                if (!doc) {
                    User.findOneAndUpdate(query, {
                        $push: {
                            preferences: {
                                name: artist.name,
                                id: artist.id,
                                type: type,
                                likes: 0,
                                dislikes: 0,
                            },
                        },
                    });
                }
            }
        );
    });
}

UserSchema.statics.findOneAndUpdatePreferences = function(query, track, update) {
    User.findOneAndUpdate(query, {
        $addToSet: {
            preferences: {
                name: track.name,
                id: track.id,
                type: 'track',
                like : update
            },
        },
    });
    
    updatePreferences(query, track.artists, 'artist', update);
    updatePreferences(query, track.genres, 'genre', update);
};

const User = mongoose.model('user', UserSchema);

module.exports = User;
