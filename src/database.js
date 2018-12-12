const mongoose = require('mongoose');
const {db : {host, port, name}} = require('./config');
const database = `mongodb://${host}:${port}/${name}`;

mongoose.connect(
  database,
  { useNewUrlParser: true, useFindAndModify: false }
);
mongoose.connection
  .once("open", function() {
    console.log("Connection made with MongoDB database.");
  })
  .on("error", function(error) {
    console.log("Connection error: ", error);
  });
