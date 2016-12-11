var path = require('path');
var webpack = require('webpack');
var _ = require('underscore');
var base_config = require('./webpack.config.js');

var webpack_port = parseInt(process.env.WEBPACK_URL.split(':')[2]);

module.exports = _.extend(base_config, {
    devServer: {
        inline: true,
        headers: {
            "Access-Control-Allow-Origin": process.env.ASSEMBL_URL,
            "Access-Control-Allow-Credentials":true
        },
        port: webpack_port,
        host: "0.0.0.0",
    },
    entry: [
    'webpack-dev-server/client?' + process.env.WEBPACK_URL,
    'webpack/hot/only-dev-server',
    './js/app/index.js'
    ],
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
});