const mongoose = require('mongoose');

// connect to mongodb
mongoose.connect('mongodb://localhost/test'); // test database

mongoose.connection.once('open', function() {
    console.log('Connection has been made...');
}).on('error', function(error) {
    console.log('Connection error: ', error);
});