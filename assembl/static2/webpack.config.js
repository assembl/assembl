/*
Once you have made changes to this file, you have to run `supervisorctl restart dev:webpack` to see the effect.
*/

var path = require('path');
var webpack = require('webpack');
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var glob = require('glob');
var _ = require('lodash');

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

var general_entries = {
    bundle: ['./js/app/index']
};

module.exports = {
    devtool: '#source-map', // https://webpack.js.org/configuration/devtool/
    entry: _.extend(theme_entries(), general_entries),
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].[contenthash].js',
        publicPath: '/build/'
    },
    module: {
        rules: [
        {
            test: /\.jsx?$/,
            use: {
              loader: 'babel-loader',
              options: {
                envName: 'production',  // babel default to development otherwise, this is to remove the __REACT_HOT_LOADER__ conditions in the code
                // We specify plugins and presets here to be able to transpile
                // dependencies that may have a .babelrc but doesn't do
                // an actual transpilation to ES5. The .babelrc
                // in this project is actually not used to transpile
                // dependencies if the dependency already has a .babelrc file,
                // we need plugins and presets here for that.
                // A dependency is transpiled only if it's in the include below.
                babelrc: false,
                plugins: [
                  '@babel/plugin-proposal-object-rest-spread',
                  '@babel/plugin-proposal-class-properties',
                  ['@babel/plugin-transform-runtime', { helpers: true, corejs: 2 }]
                ],
                presets: [["@babel/preset-env", { "modules": false, "targets": { "browsers": ["last 2 versions", "ie >= 11"] },
                                    // Exclude transforms that make all code slower
                                    "exclude": ["transform-typeof-symbol"],
                                    "useBuiltIns": true,
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
              MiniCssExtractPlugin.loader,
              'css-loader',
              'sass-loader'
            ]
        },
        {
            test: /\.css$/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader',
            ]
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
    mode: 'production',
    plugins: [
        new MiniCssExtractPlugin({ filename: "[name].[contenthash].css" }),
        new HtmlWebpackPlugin({ title: 'Caching', filename: 'resources.html'}),
    ]
};
