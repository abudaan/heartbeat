const path = require('path');

module.exports = {
  entry: './build/concat.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'build'),
  },
  mode: 'development'
};