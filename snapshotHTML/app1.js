const http = require('http'); //this is a croe module , you'd have to insall express
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const router = require('./router');

const hostname = '127.0.0.1'; //use loop back address
const port = 3000;
const app1 = express();

app1.use('/router', router);

app1.use(express.static(__dirname));

app1.listen(port, () => {
    console.log("Listening on port " + port + "...");
});

/*
fs.readFile('index.html', (err, html) =>
{
    
    if (err)
    {
        throw err;
    }

    
    
    const server = http.createServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'text/html');
        res.write(html);
        app1.use('/router', router);
        res.end('-res.end- Nice Page');
    });
    app1.use('/router' , router);
    server.listen(port, hostname, () =>
    {
        console.log('Server started on port ' + port);
        
    }
    );

});
*/
