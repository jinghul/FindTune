var express = require('express');
var auth = require('./auth');
var play = require('./play');

var app = express();
app.use(express.static(__dirname + '/public'))
    .use('/login', auth)
    .use('/play', play);
    //.use(face)

/* Redirect user to login page on start */
app.post('/start', (req, res) => {
    // load processing screen
});

const port = process.env.PORT || 8888;
app.listen(port, () => {
    console.log('Listening on port ' + port + '...');
});