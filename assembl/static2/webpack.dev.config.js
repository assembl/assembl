var path = require('path');
var webpack = require('webpack');
var _ = require('underscore');
var base_config = require('./webpack.config.js');



module.exports = _.extend(base_config, {
    devServer: {
        inline: true,
        headers: {
            "Access-Control-Allow-Origin": "http://localhost:6543",
            "Access-Control-Allow-Credentials":true
        }
    },
    entry: [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/only-dev-server',
    './js/app/index.js'
    ],
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
});