#!/bin/bash
files="../src/heartbeat/license.js
    ../src/heartbeat/chris-wilson/WebMIDIAPI.js
    ../src/heartbeat/w3c-polyfill/saveAs.js
    ../src/heartbeat/heartbeat/open_module.js
    ../src/heartbeat/heartbeat/asset_manager.js
    ../src/heartbeat/heartbeat/assetpack.js
    ../src/heartbeat/heartbeat/audio_encoder.js
    ../src/heartbeat/heartbeat/audio_event.js
    ../src/heartbeat/heartbeat/audio_recorder.js
    ../src/heartbeat/heartbeat/audio_recorder_worker.js
    ../src/heartbeat/heartbeat/audio_track.js
    ../src/heartbeat/heartbeat/channel_effects.js
    ../src/heartbeat/heartbeat/event_statistics.js
    ../src/heartbeat/heartbeat/find_event.js
    ../src/heartbeat/heartbeat/instrument.js
    ../src/heartbeat/heartbeat/instrument2.js
    ../src/heartbeat/heartbeat/instrument_config.js
    ../src/heartbeat/heartbeat/instrument_methods.js
    ../src/heartbeat/heartbeat/key_editor.js
    ../src/heartbeat/heartbeat/key_editor_2.js
    ../src/heartbeat/heartbeat/key_editor_iterator_factory.js
    ../src/heartbeat/heartbeat/metronome.js
    ../src/heartbeat/heartbeat/midi_event.js
    ../src/heartbeat/heartbeat/midi_event_names.js
    ../src/heartbeat/heartbeat/midi_file.js
    ../src/heartbeat/heartbeat/midi_note.js
    ../src/heartbeat/heartbeat/midi_parse.js
    ../src/heartbeat/heartbeat/midi_stream.js
    ../src/heartbeat/heartbeat/midi_system.js
    ../src/heartbeat/heartbeat/midi_write.js
    ../src/heartbeat/heartbeat/musicxml_parser.js
    ../src/heartbeat/heartbeat/note.js
    ../src/heartbeat/heartbeat/parse_events.js
    ../src/heartbeat/heartbeat/parse_time_events.js
    ../src/heartbeat/heartbeat/part.js
    ../src/heartbeat/heartbeat/playhead.js
    ../src/heartbeat/heartbeat/position.js
    ../src/heartbeat/heartbeat/sample.js
    ../src/heartbeat/heartbeat/samplepack.js
    ../src/heartbeat/heartbeat/scheduler.js
    ../src/heartbeat/heartbeat/sequencer.js
    ../src/heartbeat/heartbeat/song.js
    ../src/heartbeat/heartbeat/song_event_listener.js
    ../src/heartbeat/heartbeat/song_follow_event.js
    ../src/heartbeat/heartbeat/song_grid.js
    ../src/heartbeat/heartbeat/song_update.js
    ../src/heartbeat/heartbeat/track.js
    ../src/heartbeat/heartbeat/util.js
    ../src/heartbeat/heartbeat/quantize_fixed-length.js
    ../src/heartbeat/heartbeat/close_module.js"


cat $files > ../build/heartbeat.js
uglifyjs ../build/heartbeat.js -c > ../build/heartbeat.min.js
#echo $files
