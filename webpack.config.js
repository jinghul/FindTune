const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: {
        index: "./lib/index.js",
        play: "./lib/play.js"
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: path.resolve(__dirname, "node_modules"),
                loader: "babel-loader"
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ["file-loader"]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "lib/static/index.html",
            mode: "production",
            chunks: ['index'],
            minify: true
        }),
        new HtmlWebpackPlugin({
            filename: "play.html",
            template: "lib/static/play.html",
            mode: "production",
            chunks: ['play'],
            minify: true
        })
    ]
};
