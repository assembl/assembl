var path = require('path');
var webpack = require('webpack');
var glob = require('glob');
var _ = require('lodash');

var webpackPort = parseInt(process.env.WEBPACK_URL.split(':')[2]);
var webpackHost = process.env.WEBPACK_URL.split('://')[1].split(':')[0];
var disableHostCheck = false;
if (true) {
  // allow access from outside
  webpackHost = "0.0.0.0";
  disableHostCheck = true;
}

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
//    paths = glob.sync('./css/themes/**/*_notifications.scss');
//    for (i = 0; i < paths.length; i++) {
//        path = paths[i];
//        parts = path.split('/');
//        name = 'theme_' + parts[parts.length - 2] + '_notifications';
//        entries[name] = path;
//    }
    return entries;
}

// Keep css-loader 0.14.5 for performance, see
// https://github.com/webpack-contrib/css-loader/issues/124
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
        disableHostCheck: disableHostCheck,
        proxy: {
          '/static2': {
            target: process.env.ASSEMBL_URL
          }
        }
    },
    entry: _.extend(theme_entries(), {
        bundle: [
            './js/app/index',
        ],
        searchv1: [
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
                babelrc: false,
                plugins: [
                  'transform-object-rest-spread', 'transform-class-properties',
                  ['transform-runtime', { helpers: true, polyfill: false }],
                  'react-hot-loader/babel'
                ],
                presets: [["env", { "modules": false, "targets": { "ie": 11 },
                                    "debug": true, "useBuiltIns": true,
                                    "exclude": ["web.timers", "web.immediate", "web.dom.iterable"] }],
                          "react", "flow"]
              }
            },
            include: [
              path.join(__dirname, 'js'),
              path.join(__dirname, 'node_modules/rc-slider')
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
            use: ['style-loader', 'css-loader']
        },
        {
            test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/,
            use: 'url-loader?limit=100000&name=[name].[ext]'
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
        {
          test: /\.coffee$/,
          use: [
            {
              loader: 'coffee-loader',
              options: {
                transpile: true
              }
            }
          ]
        }
        ]
    },
    resolve:{
        extensions:['.js', '.jsx', '.coffee'],
        alias: {
          annotator_range$: path.join(__dirname, 'node_modules/hypothesis/src/annotator/anchoring/range.coffee'),
          jquery$: path.join(__dirname, 'node_modules/jquery/dist/jquery.slim.min.js'),
        },
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