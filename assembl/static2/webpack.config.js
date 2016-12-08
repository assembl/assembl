var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    'webpack/hot/only-dev-server',
    './js/app/index.js'
  ],
  output: {
    filename: 'build/bundle.js'
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
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
};