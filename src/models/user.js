const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create schema and model

const UserSchema = new Schema({
    name: String, // user name, required
    profile : String, // user id from Spotify, required
    // preferences : [PreferenceSchema] // preference array based on category
});

const PreferenceSchema = new Schema({
    name : String, // name of the category
    weight : Number, // weight of the genre for the user, required: -1 <= x <= 1, -1 bad, 1 good
    categoryid : String // categoryID, required – maps to the genre cache
});


const User = mongoose.model('user', UserSchema);

module.exports = User;

// var user = new User({name: xx, preference: xx});