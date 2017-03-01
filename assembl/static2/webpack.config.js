var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: ['babel-polyfill', './js/app/index'],
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'bundle.js',
        publicPath: '/build/'
    },
    module: {
        loaders: [
        {
            test: /\.jsx?$/,
            loaders: ['react-hot','babel'],
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
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('production')
          }
        }),
        new webpack.optimize.UglifyJsPlugin(),
    ]
};