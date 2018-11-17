'use strict';

const request = require('request');
var express = require('express');
var router = express.Router();

// Replace <Subscription Key> with your valid subscription key.
const subscriptionKey = 'fb9d8e70bc9d4254ab821bfa7b090b82';

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

/*
request.post(options, (error, response, body) => {
    if (error) {
        console.log('Error: ', error);
        return;
    }
    // I took a 'let' out here
    jsonResponse = JSON.stringify(JSON.parse(body), null, '  ');
    console.log('JSON Response\n');
    console.log(jsonResponse);
});
*/

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now())
    next()
})
// define the home page route
router.get('/', function (req, res) {
    res.send('Birds home page')
    console.log('bird Time: ', Date.now())
})
// define the about route
router.get('/about', function (req, res) {
    res.send('About birds')
    var photo;

    photo = document.getElementById('photo');

    main_image;
    photo.setAttribute('src', data);
})

router.get('/face', function (req, res) {

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
        console.log(Object.keys(obj[0]['faceAttributes']['emotion']['neutral']));
        console.log(obj[0]['faceAttributes']['emotion']['neutral']);

        //pick the relevant emotions values and put them in an array
        var emotion_array = new Array (
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
})

module.exports = router;