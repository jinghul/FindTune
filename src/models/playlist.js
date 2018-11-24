const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SongSchema = new Schema({
    name : {type : String, required : true}, // name of the song
    id : {type : String, required : true}, // songID from Spotify, required
    uri : {type : String, required : true}, // song uri for playback
});

const PlaylistSchema = new Schema({
    id : {type : String, required : true}, // id of the user playlist
    songs : [SongSchema], // songids
    queue : [SongSchema] // queue of songs to add
});

const Playlist = mongoose.model('playlist', PlaylistSchema);

module.exports = Playlist;
