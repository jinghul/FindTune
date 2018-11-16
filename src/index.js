/* Import express modules and routes */
const express = require('express');
const auth = require('./routes/auth').Router;
const play = require('./routes/play');

/* Utility Modules*/
const path = require('path');
const utils = require('./utils');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
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
        // Generates new sessionID if it is not matched.
        console.log(req.sessionID);
        return utils.generateRandomString(16);
    },
    store : new MongoStore({mongooseConnection : mongoose.connection}), // or use a new connection
    secret : secret_key,
    resave: false,
    saveUninitialized: true
}));

// Index, loads user cookie info ex. name, when visiting play/profile refresh token,
// if error, invoke login again, and save redirect url to take back to it.

// Routes
app.use('/login', auth)
   .use('/play', play);
    //.use(face)

const port = process.env.PORT || 8888;
app.listen(port, () => {
    console.log('Listening on port ' + port + '...');
});