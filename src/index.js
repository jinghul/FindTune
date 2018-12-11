/* Import express modules and routes */
const express = require('express');
const auth = require('./routes/auth');
const play = require('./routes/play');
const face = require('./routes/face');
const profile = require('./routes/profile');

/* Utility Modules*/
const path = require('path');
const utils = require('./utils');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config');
const secret_key = config.keys.session_secret;

/* Database Initialization */
const mongoose = require('mongoose');
require('./database'); // connect to database

/* Node Server and Routes Initialization */
var app = express();
app.use(helmet());
app.use(express.static(path.join(__dirname, '../dist/')));

// Sessions
app.use(
    session({
        genid: req => {
            // Generates new sessionID if it is not matched.
            return utils.generateRandomString(16);
        },
        store: new MongoStore({ mongooseConnection: mongoose.connection }), // or use a new connection
        secret: secret_key,
        resave: false,
        saveUninitialized: true,
    })
);

// Index, loads user cookie info ex. name, when visiting play/profile refresh token,
// if error, invoke login again, and save redirect url to take back to it.

// Routes
app.use('/login', auth).use('/play', play).use('/face', face).use('/profile', profile);

// Status 404 (Error) middleware
app.use('*', function(req,res){
    res.status(404);
    res.send(req.protocol + '://' + req.get('host') + req.originalUrl + '\n - resource not found').end();
})

app.listen(config.app.port, () => {
    console.log('Listening on port ' + config.app.port + '...');
});
