const mongoose = require('mongoose');
const database = 'mongodb://localhost/findtune';

mongoose.connect(database, { useNewUrlParser: true, useFindAndModify: false });
mongoose.connection.once('open', function() {
    console.log("Connection made with MongoDB database.");
}).on('error', function(error) {
    console.log('Connection error: ', error);	
});