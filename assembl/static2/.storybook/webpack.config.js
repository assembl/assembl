const path = require('path');

module.exports = {
  resolve: {
    extensions: ['.js', '.jsx', '.coffee'],
    alias: {
      annotator_range$: path.join(__dirname, '../node_modules/hypothesis/src/annotator/anchoring/range.coffee'),
      jquery$: path.join(__dirname, '../node_modules/jquery/dist/jquery.slim.min.js')
    }
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
        include: path.resolve(__dirname, '../')
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
  }
};
