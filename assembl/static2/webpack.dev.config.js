var path = require('path');
var webpack = require('webpack');
var glob = require('glob');
var _ = require('lodash');

var webpackPort = parseInt(process.env.WEBPACK_URL.split(':')[2]);
var webpackHost = process.env.WEBPACK_URL.split('://')[1].split(':')[0];

function theme_entries() {
    var entries = {},
        paths = glob.sync('./css/themes/**/*_web.scss'),
        i, path, parts, name;
    for (i = 0; i < paths.length; i++) {
        path = paths[i];
        parts = path.split('/');
        name = 'theme_' + parts[parts.length - 2] + '_web';
        entries[name] = path;
    }
    paths = glob.sync('./css/themes/**/*_notifications.scss');
    for (i = 0; i < paths.length; i++) {
        path = paths[i];
        parts = path.split('/');
        name = 'theme_' + parts[parts.length - 2] + '_notifications';
        entries[name] = path;
    }
    return entries;
}

// For css hot reload to work, don't use ExtractTextPlugin
module.exports = {
    devServer: {
        devtool: '#cheap-module-eval-source-map',  // http://webpack.github.io/docs/configuration.html#devtool
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
    entry: _.extend(theme_entries(), {
        bundle: [
            'webpack-dev-server/client?' + process.env.WEBPACK_URL,
            'react-hot-loader/patch',
            './js/app/index',
        ],
        searchv1: [
            'webpack-dev-server/client?' + process.env.WEBPACK_URL,
            'react-hot-loader/patch',
            './js/app/searchv1'
        ]
    }),
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
            //loader: 'style!css?sourceMap=true!sass?sourceMap=true'  // fonts are not loaded when using sourceMap...
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
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('development')
          }
        }),
    ]
};