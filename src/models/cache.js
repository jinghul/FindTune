const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SongSchema = new Schema({
    name : String, // name of the song
    songid : String, // songID from Spotify, required
    artistid : String // artistID
});

const CategorySchema = new Schema({
    categoryid : String, // categoryID, mapped from PreferenceSchema, required
    songs : [SongSchema] // array of cached songs from the genre
});

const Category = mongoose.model('category', CategorySchema);

module.exports = Category;
