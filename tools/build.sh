#!/bin/bash
files="../src/license.js
    ../src/w3c-polyfill/saveAs.js
    ../src/heartbeat/open_module.js
    ../src/heartbeat/asset_manager.js
    ../src/heartbeat/assetpack.js
    ../src/heartbeat/audio_event.js
    ../src/heartbeat/channel_effects.js
    ../src/heartbeat/event_statistics.js
    ../src/heartbeat/find_event.js
    ../src/heartbeat/instrument.js
    ../src/heartbeat/instrument_config.js
    ../src/heartbeat/key_editor.js
    ../src/heartbeat/key_editor_iterator_factory.js
    ../src/heartbeat/metronome.js
    ../src/heartbeat/midi_event.js
    ../src/heartbeat/midi_event_names.js
    ../src/heartbeat/midi_file.js
    ../src/heartbeat/midi_note.js
    ../src/heartbeat/midi_parse.js
    ../src/heartbeat/midi_stream.js
    ../src/heartbeat/midi_system.js
    ../src/heartbeat/midi_write.js
    ../src/heartbeat/note.js
    ../src/heartbeat/parse_midi_events.js
    ../src/heartbeat/parse_time_events.js
    ../src/heartbeat/part.js
    ../src/heartbeat/playhead.js
    ../src/heartbeat/position.js
    ../src/heartbeat/quantize_fixed-length.js
    ../src/heartbeat/sample.js
    ../src/heartbeat/samplepack.js
    ../src/heartbeat/scheduler.js
    ../src/heartbeat/sequencer.js
    ../src/heartbeat/song.js
    ../src/heartbeat/song_event_listener.js
    ../src/heartbeat/song_follow_event.js
    ../src/heartbeat/song_grid.js
    ../src/heartbeat/song_update.js
    ../src/heartbeat/track.js
    ../src/heartbeat/transpose.js
    ../src/heartbeat/util.js
    ../src/heartbeat/close_module.js"


cat $files > ../build/heartbeat.js
uglifyjs ../build/heartbeat.js -c > ../build/heartbeat.min.js
#echo $files
