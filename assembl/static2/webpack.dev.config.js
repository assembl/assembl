var path = require('path');
var webpack = require('webpack');
var _ = require('underscore');
var base_config = require('./webpack.config.js');



module.exports = _.extend(base_config, {
    devServer: {
        inline: true,
        headers: {
            "Access-Control-Allow-Origin": process.env.ASSEMBL_URL,
            "Access-Control-Allow-Credentials":true
        },
        port: process.env.WEBPACK_PORT,
        host: "0.0.0.0",
    },
    entry: [
    'webpack-dev-server/client?http://localhost:'+process.env.WEBPACK_PORT,
    'webpack/hot/only-dev-server',
    './js/app/index.js'
    ],
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
});