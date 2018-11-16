const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create schema and model
const PreferenceSchema = new Schema({
    name : String, // name of the category
    weight : Number, // weight of the genre for the user, required: -1 <= x <= 1, -1 bad, 1 good
    categoryid : String // categoryID, required – maps to the genre cache
});

const UserSchema = new Schema({
    name: String, // user name, required
    userid : String, // user id from Spotify, required
    playlistid : String, // custom playlists for our app
    preferences : [PreferenceSchema] // preference array based on category
});

const User = mongoose.model('user', UserSchema);

module.exports = User;