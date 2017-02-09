var path = require('path');
var webpack = require('webpack');
var baseConfig = require('./webpack.config');

var webpackPort = parseInt(process.env.WEBPACK_URL.split(':')[2]);

var config = Object.create(baseConfig);

config.devServer = {
    inline: true,
    headers: {
        "Access-Control-Allow-Origin": process.env.ASSEMBL_URL,
        "Access-Control-Allow-Credentials":true
    },
    port: webpackPort,
    host: "0.0.0.0",
};
config.entry = [
    'webpack-dev-server/client?' + process.env.WEBPACK_URL,
    'webpack/hot/only-dev-server',
    './js/app/index'
];
config.plugins = [
    new webpack.HotModuleReplacementPlugin()
];

module.exports = config;
