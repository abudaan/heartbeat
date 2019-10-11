#!/bin/bash

files="
    ../src/license.js
    ../src/saveAs.js
    ../src/open_module.js
    ../src/asset_manager.js
    ../src/assetpack.js
    ../src/audio_event.js
    ../src/audio_recorder.js
    ../src/audio_track.js
    ../src/channel_effects.js
    ../src/event_statistics.js
    ../src/find_event.js
    ../src/instrument.js
    ../src/instrument_config.js
    ../src/key_editor.js
    ../src/key_editor_iterator_factory.js
    ../src/metronome.js
    ../src/midi_event.js
    ../src/midi_event_names.js
    ../src/midi_file.js
    ../src/midi_note.js
    ../src/midi_parse.js
    ../src/midi_stream.js
    ../src/midi_system.js
    ../src/midi_write.js
    ../src/musicxml_parser.js
    ../src/note.js
    ../src/parse_events.js
    ../src/parse_time_events.js
    ../src/part.js
    ../src/playhead.js
    ../src/position.js
    ../src/quantize_fixed-length.js
    ../src/sample.js
    ../src/samplepack.js
    ../src/scheduler.js
    ../src/sequencer.js
    ../src/song.js
    ../src/song_event_listener.js
    ../src/song_follow_event.js
    ../src/song_grid.js
    ../src/song_update.js
    ../src/track.js
    ../src/transpose.js
    ../src/util.js
    ../src/close_module.js"

cat $files >../build/index.js
# cp ../build/index.js ../build/heartbeat.js # for legacy examples
# uglifyjs ../build/heartbeat.js -c > ../build/heartbeat.min.js
#echo $files
