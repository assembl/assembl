var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    './js/app/index.js'
  ],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/build/'
  }
};