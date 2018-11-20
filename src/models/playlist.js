const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SongSchema = new Schema({
    name : {type : String, required : true}, // name of the song
    songid : {type : String, required : true}, // songID from Spotify, required
    artistid : String, // artistID
    categoryid : String, // categoryID, mapped from PreferenceSchema, required
});

const PlaylistSchema = new Schema({
    id : {type : String, required : true}, // id of the user playlist
    songs : [SongSchema], // songids
    queue : [SongSchema] // queue of songs to add
});

const Playlist = mongoose.model('playlist', PlaylistSchema);

module.exports = Playlist;
