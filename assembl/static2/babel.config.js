module.exports = {
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: true
      }
    ],
    'babel-plugin-styled-components'
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 10
        }
      }
    ],
    '@babel/preset-react',
    '@babel/preset-flow'
  ]
};