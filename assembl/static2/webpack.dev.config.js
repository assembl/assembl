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
    devtool: '#cheap-module-eval-source-map',  // http://webpack.github.io/docs/configuration.html#devtool
    devServer: {
        inline: true,
        hot: true,
        headers: {
            "Access-Control-Allow-Origin": process.env.ASSEMBL_URL,
            "Access-Control-Allow-Credentials": 'true'
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
            'babel-polyfill',
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
        rules: [
        {
            test: /\.jsx?(\?v=\d)?$/,
            use: {
              loader: 'babel-loader',
              options: {
                forceEnv: 'development',
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
            use: ['style-loader', 'css-loader', 'sass-loader']
        },
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader', 'sass-loader']
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
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('development')
          }
        }),
    ]
};