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
describe("Database tests...", async function() {	
    
    // Create tests	
    it("Adding a basic record", function(done) {	
        var user = new User({
            name : "Test User",
            profile : "Test profile"
        });

        user.save().then(function() {
            assert(user.isNew === false);
            done();
        }).catch(function() {
            mongoose.connection.close();
        });
    });	

    it("Adding a record with nested preferences", function(done) {
        var user = new User({
            name : "Patrick",
            preferences: [{name:"pop", weight:0.78, categoryid:"abcdefg"}]
        });

        user.save().then(function() {
            User.findOne({name : "Patrick"}).then(function(result) {
                assert(result.preferences[0].name === "pop")
                done();
            }).catch(done);
        });
    });

    it("Adding preference to an user", function(done) {
        var user = new User({
            name : "Patrick2",
            preferences: [{name:"pop", weight:0.78, categoryid:"abcdefg"}]
        });

        user.save().then(function() {
            User.findOne({name:"Patrick2"}).then(function(result) {
                result.preferences.push({name : "tophits", weight : 0.22});
                result.save().then(function() {
                    assert(result.preferences.length === 2)
                    done();
                });
            }).catch(done);
        });
    });
});

describe('Finding records...', function() {
    
    var user;

    this.beforeEach(function(done) {
        user = new User({
            name : "FindUser",
            profile : "findusrprof"
        });

         user.save().then(function() {
            done();
         });
    });

    it('Find one record by name', function(done) {
        User.findOne({name:'FindUser'}).then(function(result) {
            assert(result.name === 'FindUser');
            done();
        });
    });

    it('Find one record by id', function(done) {
        User.findOne({_id : user._id}).then(function(result) {
            assert(result._id.toString() === user._id.toString());
            done();
        });
    });
});

describe("Deleting records...", function() {
    var user;

    this.beforeEach(function(done) {
        user = new User({
            name : "DeleteUser",
        });

         user.save().then(function() {
            done();
         });
    });

    it('Deletes one record from database', function(done) {
        User.findOneAndDelete({name:'DeleteUser'}).then(function() {
            User.findOne({name:"DeleteUser"}).then(function(result) {
                assert(result === null);
                done();
            });
        });
    });
});

describe("Updating records...", function() {
    var user;

    this.beforeEach(function(done) {
        user = new User({
            name : "UpdateUser",
        });

         user.save().then(function() {
            done();
         });
    });

    it('Updates one record from database', function(done) {
        User.findOneAndUpdate({name:'UpdateUser'}, {name:'Updated'}).then(function() {
            User.findOne({_id:user.id}).then(function(result) {
                assert(result.name === "Updated");
                done();
            });
        });
    });
});