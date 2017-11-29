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
    // devtool: '#cheap-module-eval-source-map',  // http://webpack.github.io/docs/configuration.html#devtool
    devtool: '#cheap-module-source-map', // https://github.com/webpack/webpack-dev-server/issues/1090
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
            'babel-polyfill', // this is already in index.jsx but we need it to be first, otherwise it doesn't work on IE 11
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
                presets: [["env", { "modules": false, "targets": { "ie": 11 },
                                    "debug": true, "useBuiltIns": true,
                                    "exclude": ["web.timers", "web.immediate", "web.dom.iterable"] }],
                          "react", "flow"]
              }
            },
            include: [
              path.join(__dirname, 'js'),
            ]
        },
        {
            test: /\.scss$/,
            use: [
              { loader: "style-loader" },
              { loader: "css-loader", options: { sourceMap: true } },
              { loader: "sass-loader", options: { sourceMap: true } }
            ]
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