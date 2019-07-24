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
        i, path, parts, name, bucket;
    for (i = 0; i < paths.length; i++) {
        path = paths[i];
        parts = path.split('/');
        theme_name = parts[parts.length - 2]
        // Special case default, as it's not unique
        if (theme_name === 'default') {
          name = 'themes/' + theme_name + '/theme_' + theme_name + '_web';
        }
        else {
          bucket = parts[parts.length - 3];
          name = 'themes/' + bucket + '/' + theme_name + '/theme_' + theme_name + '_web';
        }
        entries[name] = path;
    }
    return entries;
}

module.exports = {
    // cheap-module-eval-source-map and cheap-module-source-map are giving
    // wrong line number, about 10 lines above the real line.
    // cheap-module-eval-source-map had issue with SockJS on Safari https://github.com/webpack/webpack-dev-server/issues/1090
    // eval-source-map or source-map are giving the correct line number
    devtool: '#eval-source-map', // https://webpack.js.org/configuration/devtool/
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
            test: /\.jsx?$/,
            use: {
              loader: 'babel-loader',
              options: {
                envName: 'development',
                babelrc: false,
                plugins: [
                  '@babel/plugin-proposal-object-rest-spread',
                  '@babel/plugin-proposal-class-properties',
                  ['@babel/plugin-transform-runtime', { helpers: true, corejs: 2 }],
                  'react-hot-loader/babel'
                ],
                presets: [["@babel/preset-env", { "modules": false, "targets": { "ie": 11 },
                                    // Exclude transforms that make all code slower
                                    "exclude": ["transform-typeof-symbol"],
                                    "debug": false, "useBuiltIns": "entry", "corejs": 2 }],
                          "@babel/preset-react", "@babel/preset-flow"]
              }
            },
            include: [
              path.join(__dirname, 'js'),
              path.join(__dirname, 'css'),
              path.join(__dirname, 'workspaces'),
              path.join(__dirname, 'node_modules/rc-slider')
            ]
        },
        {
            test: /\.scss$/,
            use: [
              { loader: "style-loader" },
              { loader: "css-loader", options: { sourceMap: true } },
              { loader: "sass-loader",
                options: {
                  sourceMap: true,
                  data: "$fonts-dir: '/static2/fonts';" } }
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
    mode: 'development',
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
    ]
};