const express = require('express');
const path = require('path');
const router = express.Router();

const endpoint = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0';

router.use((req, res, next) => {
    if (!req.session.userid) {
            res.status(401).send('User not logged in.');
    } else {
        next();
    }
})

router.get('/emotion', (req, res, next) => {
    // get image data and send to face api and then return emotion

});

module.exports = Router;