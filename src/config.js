const env = process.env.NODE_ENV;
const keys = require('../keys.json');


const production = {
    app: {
        // TODO: check that the port is working in production urls.
        host: 'host',
        port : 8888 || process.env.PORT,
        index: function() {return 'http://' + this.host}
    },
    db: {
        host: 'localhost',
        port: 27017,
        name: "findtune"
    },
    keys: keys 
};

const dev = {
    app: {
        host: 'localhost',
        port: 8888 || process.env.PORT,
        index: function() {return 'http://' + this.host + ':' + this.port}
    },
    db: {
        host: 'localhost',
        port: 27017,
        name: "findtune"
    },
    keys: keys
};

const test = {
    app: {
        host: 'http://localhost:',
        port : 8888 || process.env.PORT,
        index: function() {return 'http://' + this.host + ':' + this.port}
    },
    db: {
        host: 'localhost',
        port: 27017,
        name: 'test'
    },
    keys: keys
};

const config = {
    production,
    dev,
    test
}

module.exports = config[env];