const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../src/models/user');

before(function(done) {
    // connect to mongodb
    mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true }); // test database

    mongoose.connection.once('open', function() {
        done();
    }).on('error', function(error) {
        console.log('Connection error: ', error);	
    });
});

beforeEach(function(done) {
    // Drop the collection
    mongoose.connection.dropCollection("users", function() {
        done();
    });
});

after(function() {
    mongoose.connection.close();
});

 // Tests	
describe("Database tests...", function() {	
    
    // Create tests	
    it("Adding a record...", function(done) {	
        var user = new User({
            name : "Test User",
            profile : "Test profile"
        });

        user.save().then(function() {
            assert(user.isNew === false);
            done();
        });
    });	
});