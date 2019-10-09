const path = require('path');

module.exports = {
  entry: {
    'process_event/process_event_array/': './process_event/process_event_array/main.js',
    'process_event/process_event_per_event/': './process_event/process_event_array/main.js',
  },
  output: {
    path: path.resolve(__dirname),
    filename: '[name]build.js'
  },
  watch: true
};