const path = require("path");

module.exports = {
  entry: {
    // 'song_operations/save_song/': './song_operations/save_song/main.js',
    // 'audio/add_audio_events/': './audio/add_audio_events/main.js',
    // 'audio/add_audio_events_simple/': './audio/add_audio_events_simple/main.js',
    // 'process_event/process_event_array/': './process_event/process_event_array/main.js',
    // 'process_event/process_event_per_event/': './process_event/process_event_array/main.js',
    // 'miscellaneous/musicxml/': './miscellaneous/musicxml/main.js',
    // 'midi_in_&_out/midi_out_file/': './midi_in_&_out/midi_out_file/main.js',
    "managing_assets/1._midi_files/from_local_file_2/":
      "./managing_assets/1._midi_files/from_local_file_2/main.js",
  },
  output: {
    path: path.resolve(__dirname),
    filename: "[name]build.js",
  },
  watch: true,
};
