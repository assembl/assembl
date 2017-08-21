/*
Once you have made changes to this file, you have to run `supervisorctl restart dev:webpack` to see the effect.
*/

var path = require('path');
var webpack = require('webpack');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var glob = require('glob');
var _ = require('lodash');


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

var general_entries = {
    bundle: ['babel-polyfill', './js/app/index'],
    searchv1: ['babel-polyfill', './js/app/searchv1']
};

module.exports = {
    devtool: '#cheap-module-source-map',  // http://webpack.github.io/docs/configuration.html#devtool
    entry: _.extend(theme_entries(), general_entries),
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].js',
        publicPath: '/build/'
    },
    module: {
        rules: [
        {
            test: /\.jsx?(\?v=\d)?$/,
            use: {
              loader: 'babel-loader',
              options: {
                forceEnv: 'production',  // babel default to development otherwise, this is to remove the __REACT_HOT_LOADER__ conditions in the code
                // We specify plugins and presets here to be able to transpile
                // dependencies that may have a .babelrc but doesn't do
                // an actual transpilation to ES5. The .babelrc
                // in this project is actually not used to transpile
                // dependencies if the dependency already has a .babelrc file,
                // we need plugins and presets here for that.
                // A dependency is transpiled only if it's in the include below.
                plugins: [
                  'transform-object-rest-spread', 'transform-class-properties',
                  ['transform-runtime', { helpers: true, polyfill: false }]
                ],
                presets: ['es2015', 'react']
              }
            },
            include: [
              path.join(__dirname, 'js'),
              path.join(__dirname, 'node_modules/react-tweet-embed')
            ]
        },
        {
            test: /\.scss$/,
            use: ExtractTextPlugin.extract({
              fallback:'style-loader',
              use: ['css-loader', 'sass-loader']})
        },
        {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
              fallback:'style-loader',
              use: ['css-loader', 'sass-loader']})
        },
        {
            test: /\.png$/,
            use: 'url-loader?limit=100000'
        },
        {
            test: /\.jpg$/,
            use: 'file-loader'
        },
        {
            test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/,
            use: 'url-loader?limit=100000&name=[name].[ext]'
        },
        {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            use: 'file-loader'
        },
        {
          test: /\.(graphql|gql)$/,
          exclude: /node_modules/,
          use: 'graphql-tag/loader'
        },
        {
          test: /\.json$/,
          use: 'json-loader'
        },
        ]
    },
    resolve:{
        extensions:['.js', '.jsx']
    },
    plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('production')
          }
        }),
        new UglifyJSPlugin({ sourceMap: true }),
        new ExtractTextPlugin("[name].css"),
    ]
};