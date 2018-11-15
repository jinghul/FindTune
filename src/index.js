/* Import express modules and routes */
const express = require('express');
const auth = require('./routes/auth');
const play = require('./routes/play');

/* Utility Modules*/
const path = require('path');
const utils = require('./utils');
const session = require('express-session');
const secret_key = require('../keys.json').session_secret;

/* Database Initialization */
const mongoose = require('mongoose');
const database = 'mongodb://localhost/findtune';

mongoose.connect(database, { useNewUrlParser: true });
mongoose.connection.once('open', function() {
    console.log("Connection made with MongoDB database.");
}).on('error', function(error) {
    console.log('Connection error: ', error);	
});

/* Node Server and Routes Initialization */
var app = express();
app.use(express.static(path.join(__dirname, '/public')));

// Sessions
app.use(session({
    genid: (req) => {
        console.log(req.sessionID);
        return utils.generateRandomString(20);
    },
    secret : secret_key,
    resave: false,
    saveUninitialized: true
}));

// Routes
app.use('/login', auth)
   .use('/play', play);
    //.use(face)

const port = process.env.PORT || 8888;
app.listen(port, () => {
    console.log('Listening on port ' + port + '...');
});