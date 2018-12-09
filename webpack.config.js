const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { localhost } = require('./keys.json');

module.exports = {
    entry: {
        index: './lib/index.js',
        play: './lib/play.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.jsx$/,
                exclude: [
                    path.resolve(__dirname, 'node_modules'),
                    path.resolve(__dirname, 'src'),
                ],
                loader: 'eslint-loader',
                options: {
                    fix: true,
                },
            },
            {
                test: /\.jsx?$/,
                exclude: path.resolve(__dirname, 'node_modules'),
                loader: 'babel-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000',
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: 'file-loader',
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.INDEX_URL': JSON.stringify('http://localhost:8888'),
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'lib/static/index.html',
            mode: 'production',
            chunks: ['index'],
            minify: true,
        }),
        new HtmlWebpackPlugin({
            filename: 'play.html',
            template: 'lib/static/play.html',
            mode: 'production',
            chunks: ['play'],
            minify: true,
        }),
        new webpack.HotModuleReplacementPlugin(),
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        hot: true,
        port: 9000,
    },
};
