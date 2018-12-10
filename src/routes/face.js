const express = require('express');
const router = express.Router();
const preference = require('./preference');

const request = require('request');

/* Handle Image Files */
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
    face: { key1 },
} = require('../config').keys;

const endpoint = 'https://eastus.api.cognitive.microsoft.com/face/v1.0/detect';
const EMOTION_THRESHOLD = 0.5;

router.use((req, res, next) => {
    if (!req.session.userid) {
        res.status(401).send('User not logged in.');
    } else {
        next();
    }
});

router.get('/emotion', upload.single('image'), (req, res) => {
    // get image data and send to face api and then return emotion

    const params = {
        returnFaceId: 'false',
        returnRectangle: 'false',
        returnFaceLandmarks: 'false',
        returnFaceAttributes: '' + 'emotion',
    };

    const emotionOptions = {
        uri: endpoint,
        qs: params,
        body: req.file.buffer,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': key1,
        },
    };

    request.post(emotionOptions, (error, response, body) => {
        if (!error && response === 200) {
            var jsonResponse = JSON.parse(body);
            var {
                anger,
                contempt,
                disgust,
                fear,
                happiness,
                sadness,
            } = jsonResponse[0].faceAttributes.emotion;

            console.log(jsonResponse);
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
                return res.send('Not conclusive result.').end();
            } else {

                console.log(req.body);

                var track = {}
                track.name = req.body.name;
                track.id = req.body.id;
                track.uri = req.body.uri;
                track.href = req.body.href;
                track.artists = JSON.parse(req.body.artists);
                track.genres = req.body.genres.split(',');

                if (result === 'like') {
                    preference.like(track);
                } else if (result === 'dislike') {
                    preference.dislike(track);
                }

                res.send(result).end();
            }
        } else {
            res.status(response.statusCode).send(response.statusMessage);
        }
    });
});

module.exports = router;
