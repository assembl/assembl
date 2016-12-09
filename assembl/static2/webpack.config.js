var path = require('path');
var webpack = require('webpack');

module.exports = {
    devServer: {
        headers: { 
            "Access-Control-Allow-Origin": "http://localhost:6543",
            "Access-Control-Allow-Credentials":true
        }
    },
    entry: [
    'webpack-dev-server/client',
    'webpack/hot/only-dev-server',
    './js/app/index.js'
    ],
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'bundle.js',
        publicPath: '/build/'
    },
    module: {
        loaders: [
        {
            test: /\.js$/,
            loaders: ['react-hot', 'babel'],
            include: path.join(__dirname, 'js')
        },
        {
            test: /\.scss$/,
            loaders: ['style', 'css', 'sass']
        },
        { 
            test: /\.css$/, 
            loader: "style-loader!css-loader" 
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
            test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, 
            loader: 'url?limit=10000&mimetype=application/font-woff'
        },
        {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, 
            loader: 'url?limit=10000&mimetype=application/octet-stream'
        },
        {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, 
            loader: 'file'
        },
        {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, 
            loader: 'url?limit=10000&mimetype=image/svg+xml'
        }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
};