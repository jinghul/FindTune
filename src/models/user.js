const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreferenceSchema = new Schema({
    name : {type : String, required : true}, // name of the category
    id : {type : String, required : true}, // categoryID, required – maps to the genre cache
    type : {type : String, required : true} // the type of category e.g. artist, genre, track
});

const UserSchema = new Schema({
    name: String, // user name, required
    id : {type : String, required : true}, // user id from Spotify, required
    playlist_uid : Schema.Types.ObjectId, // custom playlists for our app
    preferences : [PreferenceSchema] // preference array based on category
});

const User = mongoose.model('user', UserSchema);

module.exports = User;