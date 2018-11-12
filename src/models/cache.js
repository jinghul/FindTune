const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SongSchema = new Schema({
    name : String, // name of the song
    songid : String, // songID from Spotify, required
    artistid : String, // artistID
    categoryid : String, // categoryID, mapped from PreferenceSchema, required
});

const PlaylistSchema = new Schema({
    playlistid : String, // id of the user playlist
    songs : [String], // songids
    queue : [String] // queue of songs to add
});

const Song = mongoose.model('song', SongSchema);
const Playlist = mongoose.model('playlist', PlaylistSchema);

module.exports.Song = Song;
module.exports.Playlist = Playlist;
