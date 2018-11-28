const http = require('http'); //this is a croe module , you'd have to insall express
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const router = require('./router');

const hostname = '127.0.0.1'; //use loop back address
const port = 3000;
const app1 = express();

//attach router
app1.use('/router', router);

//initialize body parser
app1.use(bodyParser.urlencoded({
  extended: true
}));

//read the index.html from the same directory
app1.use(express.static(__dirname));

app1.post("/", function (req, res) {
    console.log('bodycheck', req.body)
    var thirdD = req.body.thirdData;
    var firstD = req.body.firstData;

    console.log('App1 first data', firstD);
    console.log('App1 third data', typeof thirdD);

  //  var buf = new Buffer(firstD, 'base64');
  //  fs.writeFile('firstImg.png', buf);
});

app1.listen(port, () => {
    console.log("Listening on port " + port + "...");
});
