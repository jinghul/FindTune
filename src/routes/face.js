'use strict';

var request = require('request');
const http = require('http'); //this is a croe module , you'd have to insall express
var express = require('express');
var bodyParser = require('body-parser');
var path = require("path");
var fs = require('fs');
const multer = require('multer');
var router = express.Router();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();


// Replace <Subscription Key> with your valid subscription key.
const subscriptionKey = 'KEY';

// You must use the same location in your REST call as you used to get your
// subscription keys. For example, if you got your subscription keys from
// westus, replace "westcentralus" in the URL below with "westus".
const uriBase = ' https://eastus.api.cognitive.microsoft.com/face/v1.0/detect';

//picture to upload
//var last_image = 'last_image.jpg';

//const imageUrl = last_image;
const imageUrl = 'https://www.sciencealert.com/images/articles/processed/HumanFace_web_600.jpg';

// Request parameters.
const params = {
    'returnFaceId': 'false',
    'returnRectangle': 'false',
    'returnFaceLandmarks': 'false',
    'returnFaceAttributes': '' +
        'emotion'
};

const options = {
    uri: uriBase,
    qs: params,
    body: '{"url": ' + '"' + imageUrl + '"}',
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': subscriptionKey
    }
};

//make global sting to write to
var jsonResponse = "EMPTY";

//initialize body parser
router.use(bodyParser.urlencoded({
    extended: true
}));

//set storage engine
//this doesnt work but is still necessary
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() +'.png')
    }
})

const upload = multer({ storage: storage });

router.use((req, res, next) => {
    if (!req.session.userid) {
            res.status(401).send('User not logged in.');
    } else {
        next();
    }
})

router.post('/upload', upload.single('photo'), (req, res, next) => {
    // here in the req.file you will have the uploaded avatar file


        //trying to write a picture with the same path , soes not update the picture
        latestFilePath = 'faces/strip'+ Date.now() + '.png';
        fs.writeFile(latestFilePath, req.body.strip, 'base64');

        console.log('file pic SHOULD have been updated');

        // the txt file gets updated evey cycle correctly unlike the picture
        fs.writeFile('filename.txt', latestFilePath);
})

router.get('/emotion', (req, res, next) => {
    // get image data and send to face api and then return emotion
    //get a responce from Face API and store it in body
    request.post(options, (error, response, body) => {
        if (error) {
            console.log('Error: ', error);
            return;
        }
        //parse body then store the json as a string
        jsonResponse = JSON.stringify(JSON.parse(body), null, '  ');
        //print to console
        console.log('JSON Response\n');
        //console.log(jsonResponse);

        //write as plain text in browser
        res.write(jsonResponse);

        //parse down further
        var obj = JSON.parse(jsonResponse);
        var empty = {};
        // i want the value of emotions here obj.faceAtrributes.emotion.anger
        console.log(typeof obj);
        console.log(Object.keys(obj['error']));
        console.log(obj[0]['faceAttributes']['emotion']['neutral']);

        //pick the relevant emotions values and put them in an array
        var emotion_array = new Array(
            obj[0]['faceAttributes']['emotion']['anger'],
            obj[0]['faceAttributes']['emotion']['disgust'],
            obj[0]['faceAttributes']['emotion']['happiness'],
            obj[0]['faceAttributes']['emotion']['neutral'],
            obj[0]['faceAttributes']['emotion']['sadness']
        );

        res.write(emotion_array.toString());
        // end [ 'faceRectangle', 'faceAttributes' ]
        res.end();
    });
    //write the json response to the body

});

module.exports = Router;
