const http = require('http'); //this is a croe module , you'd have to insall express
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const router = require('./router');
const multer = require('multer');

//set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() +'.png')
    }
})

const upload = multer({ storage: storage });

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



app1.post('/upload', upload.single('photo'), (req, res, next) => {
    // here in the req.file you will have the uploaded avatar file
    const filePath = 'scratch/strip';



    function testWrite()
    {
        //trying to write a picture with the same path , soes not update the picture
        fs.writeFile('scratch/strip'+ Date.now() + '.png', req.body.strip, 'base64');
        console.log('file pic SHOULD have been updated');
        // the txt file gets updated evey cycle correctly unlike the picture
        fs.writeFile('filename.txt', 'test' + Date.now());
    }

    setInterval(testWrite,  3000);

})



app1.listen(port, () => {
    console.log("Listening on port " + port + "...");
});
