'use strict';

//var request = require('request');
var express = require('express');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
var path = require("path");
var LocalStorage = require('node-localstorage').LocalStorage;
var localStorage = new LocalStorage('./scratch');
var fs = require('fs');
var store = require('store');
var router = express.Router();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();

// Replace <Subscription Key> with your valid subscription key.
const subscriptionKey = 'KEY GOES HERE';

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

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now())
    next()
})

//cookie reader initialize on router
router.use(cookieParser());
//initialize body parser
router.use(bodyParser.urlencoded({
  extended: true
}));


// define the home page route
router.get('/', function (req, res) {
    console.log('main route Time: ', Date.now())
    res.sendFile(path.join(__dirname + '/helper.html'));
  res.end();
})
//route to print all cookies
router.get('/cook', function(req, res) {
  res.write('cookies page');
  //need buffer ? res.write(req.cookies);
  console.log('Cookies: ', req.cookies);
  res.end();
})
//testroute
router.get('/test', function (req, res) {
  //res.sendFile(path.join(__dirname + '/index.html'));
//  res.sendFile(__dirname + '/index.html');
  /*var form = req.form;

    form.encoding = 'binary';
    form.uploadDir = __dirname + '/scratch';
    form.maxFieldsSize = 50 * 1024 * 1024;
    form.keepExtensions = true;

    form.parse(req, function(err, fields, files) {

        if (err) return console.log(err);

    }); */
    console.log('router bodycheck', req.body);
    var thirdD = req.body.thirdData;
    var firstD = req.body.firstData;

    //more testing
    console.log('route first data', firstD);
    console.log('route third data', thirdD);
    //try savinf the image
    //var buf = new Buffer.from(firstD, 'base64');
  //  fs.writeFile('firstImg.png', buf);

})
router.post("/test", function (req, res) {

//  xhr.open('POST', 'http://127.0.0.1:3000/router/test', true);

//  xhr.responseType = 'text';
  //var body = xhr.getAllResponseHeaders();
  var text = (req.get('text'));

    console.log('express router bodycheck ', req.body);
    console.log('AJAX router bodycheck', body);
    console.log('AJAX router responseText', text);
});
// define the about route
router.get('/about', function (req, res) {
    res.send('About birds send response')

    // Attempts to get image from local storage
    //myStorage = window.localStorage;
    // var A = localStorage.getItem('facepicdata');
    // console.log('aval ',A);
    //
    // var B = store.get('jj');
    // console.log('bval ',B);
    //
    // var C = req.get('jj');
    // console.log('cval ',C);


    //get cookie by key
    console.log('D ', req.cookies.jj);

    fs.writeFile('fsTest.txt', 'about writing files', function (err) {
    if (err) throw err;
    console.log('about console!');
     res.end();
  });
    res.end();
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
