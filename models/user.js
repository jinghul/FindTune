const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create schema and model

const UserSchema = new Schema({
    name: String,
    preference : String
    // ...
});

const User = mongoose.model('user', UserSchema);

module.exports = User;

// var user = new User({name: xx, preference: xx});