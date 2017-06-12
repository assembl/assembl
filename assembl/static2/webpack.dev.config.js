var path = require('path');
var webpack = require('webpack');
var _ = require('lodash');

var webpackPort = parseInt(process.env.WEBPACK_URL.split(':')[2]);
var webpackHost = process.env.WEBPACK_URL.split('://')[1].split(':')[0];

// if you want to work on another theme, change this variable
var THEME = "default";

// For css hot reload to work, don't use ExtractTextPlugin
module.exports = {
    devServer: {
        devtool: 'eval',
        inline: true,
        hot: true,
        headers: {
            "Access-Control-Allow-Origin": process.env.ASSEMBL_URL,
            "Access-Control-Allow-Credentials":true
        },
        port: webpackPort,
        host: webpackHost,
        proxy: {
          '/static2': {
            target: process.env.ASSEMBL_URL
          }
        }
    },
    entry: {
        bundle: [
            'webpack-dev-server/client?' + process.env.WEBPACK_URL,
            'react-hot-loader/patch',
            './js/app/index',
            './css/themes/' + THEME + '/assembl_web.scss'
        ],
        searchv1: [
            'webpack-dev-server/client?' + process.env.WEBPACK_URL,
            'react-hot-loader/patch',
            './js/app/searchv1'
        ]
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].js',
        publicPath: process.env.WEBPACK_URL + '/build/'
    },
    module: {
        loaders: [
        {
            test: /\.jsx?(\?v=\d)?$/,
            loaders: ['babel'],
            include: path.join(__dirname, 'js')
        },
        {
            test: /\.scss$/,
            loaders: ['style', 'css', 'sass']
        },
        {
            test: /\.css$/,
            loaders: ['style', 'css', 'sass']
        },
        {
            test: /\.png$/,
            loader: "url-loader?limit=100000"
        },
        {
            test: /\.jpg$/,
            loader: "file-loader"
        },
        {
            test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/,
            loader: 'url?limit=100000&name=[name].[ext]'
        },
        {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'file'
        },
        ]
    },
    resolve:{
        extensions:['','.js','.jsx']
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
    ]
};
