var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        bundle: ['babel-polyfill', './js/app/index'],
        searchv1: ['babel-polyfill', './js/app/searchv1']
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].js',
        publicPath: '/build/'
    },
    module: {
        loaders: [
        {
            test: /\.jsx?(\?v=\d)?$/,
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
