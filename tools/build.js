/*
    depends on uglifyjs, see: https://github.com/mishoo/UglifyJS

    DEPRECATED: use build.sh instead!
*/

'use strict';

var
    fs = require('fs'),
    path = require('path'),
    jsp,// = require('uglify-js').parser,
    pro, // = require('uglify-js').uglify,
    args = process.argv,

    files = [
        'w3c-polyfill/saveAs.js',
        'heartbeat/open_module.js',
        'heartbeat/asset_manager.js',
        'heartbeat/assetpack.js',
        'heartbeat/audio_encoder.js',
        'heartbeat/audio_event.js',
        'heartbeat/audio_recorder.js',
        'heartbeat/audio_recording_worker.js',
        'heartbeat/audio_track.js',
        'heartbeat/channel_effects.js',
        'heartbeat/event_statistics.js',
        'heartbeat/find_event.js',
        'heartbeat/instrument.js',
        'heartbeat/instrument_config.js',
        'heartbeat/key_editor.js',
        'heartbeat/key_editor_iterator_factory.js',
        'heartbeat/metronome.js',
        'heartbeat/midi_event.js',
        'heartbeat/midi_event_names.js',
        'heartbeat/midi_file.js',
        'heartbeat/midi_note.js',
        'heartbeat/midi_parse.js',
        'heartbeat/midi_stream.js',
        'heartbeat/midi_system.js',
        'heartbeat/midi_write.js',
        'heartbeat/musicxml_parser.js',
        'heartbeat/note.js',
        'heartbeat/parse_events.js',
        'heartbeat/parse_time_events.js',
        'heartbeat/part.js',
        'heartbeat/playhead.js',
        'heartbeat/position.js',
        'heartbeat/quantize_fixed-length.js',
        'heartbeat/sample.js',
        'heartbeat/samplepack.js',
        'heartbeat/scheduler.js',
        'heartbeat/sequencer.js',
        'heartbeat/song.js',
        'heartbeat/song_event_listener.js',
        'heartbeat/song_follow_event.js',
        'heartbeat/song_grid.js',
        'heartbeat/song_update.js',
        'heartbeat/track.js',
        'heartbeat/transpose.js',
        'heartbeat/util.js',
        'heartbeat/close_module.js'
    ],
    numFiles = files.length,
    i, p, c, a,
    maxi, license, ast,
    quickBuild = false,
    concatenated = '';


for(i = 2, maxi = args.length; i < maxi; i++){
    a = args[i];
    if(a === '-q' || a === '-quick'){
        quickBuild = true;
    }
}

p = path.resolve('../src/license.js');
license = fs.readFileSync(p);

for(i = 0; i < numFiles; i++){
    p = path.resolve('../src', files[i]);
    c = fs.readFileSync(p);
    concatenated += c;
}

p = path.resolve('../build/heartbeat.js');
fs.writeFileSync(p, license + '\n\n\n' + concatenated);

if(quickBuild === false){
    jsp = require('uglify-js').parser,
    pro = require('uglify-js').uglify,

    ast = jsp.parse(concatenated); // parse code and get the initial AST
    ast = pro.ast_mangle(ast); // get a new AST with mangled names
    ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
    ast = pro.gen_code(ast); // compressed code here
    p = path.resolve('../build/heartbeat.min.js');
    fs.writeFileSync(p, license + '\n' + ast);
}