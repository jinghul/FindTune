const path = require('path');

module.exports = {
    entry: {
        bundle : "./lib/index.js",
        // play : "./lib/components/play.js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: path.resolve(__dirname, "node_modules"),
                loader: "babel-loader",
            }
        ]
    }
}
