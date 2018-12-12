const express = require('express');
const router = express.Router();
const preference = require('./preference');

const querystring = require('querystring');
const request = require('request');

/* Handle Image Files */
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
    face: { key1 },
} = require('../config').keys;

const endpoint = 'https://eastus.api.cognitive.microsoft.com/face/v1.0/detect?';
const EMOTION_THRESHOLD = 0.4;

router.use((req, res, next) => {
    if (!req.session.userid) {
        res.status(401).send('User not logged in.');
    } else {
        next();
    }
});

router.post('/emotion', upload.single('face'), (req, res, next) => {
    // get image data and send to face api and then return emotion

    const emotionOptions = {
        uri: endpoint + querystring.stringify({
            returnFaceId: false,
            returnFaceLandmarks: false,
            returnFaceAttributes: 'emotion',
        }),
        body: req.file.buffer,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': key1,
        },
    };

    request.post(emotionOptions, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var jsonResponse = JSON.parse(body);
            if (body == '[]' || !jsonResponse) {
                return res.status(200).send({ action: 'none'}).end();
            }

            console.log(jsonResponse[0].faceAttributes.emotion);

            var {
                anger,
                contempt,
                disgust,
                fear,
                happiness,
                sadness,
            } = jsonResponse[0].faceAttributes.emotion;

            var result;
            if (happiness >= EMOTION_THRESHOLD) {
                // ONLY POSITIVE
                result = 'like';
            } else if (
                anger >= EMOTION_THRESHOLD ||
                disgust >= EMOTION_THRESHOLD ||
                contempt >= EMOTION_THRESHOLD ||
                fear >= EMOTION_THRESHOLD ||
                sadness >= EMOTION_THRESHOLD
            ) {
                // NEGATIVE, let user configure after
                result = 'dislike';
            }

            if (result === undefined) {
                return res.json({ action: 'none' }).end();
            } else if (req.body === undefined || req.body.track === undefined) {
                return res.status(500).send('No body with request').end();
            } else {
                if (result === 'like') {
                    preference.like(req,res,next);
                } else if (result === 'dislike') {
                    preference.dislike(req,res,next);
                }
            }
        } else {
            res.status(response.statusCode).send(response.statusMessage);
        }
    });
});

module.exports = router;
