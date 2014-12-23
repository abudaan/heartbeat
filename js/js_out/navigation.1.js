window.onload = function() {

    'use strict';

    var nav = document.querySelectorAll('nav')[0],
        itemsApi = {
            'Sequencer': '/api/sequencer',
            'Song': '/api/song',
            'Track': '/api/track',
            'Part': '/api/part',
            'Midi Event': '/api/midi_event',
            'Midi Note': '/api/midi_note'
        },
        itemsDocs = {
            'About Heartbeat': '/docs/about_heartbeat',
            'Loading Assets': '/docs/loading_assets',
            'Instruments': '/docs/instruments',
            'Find Event': '/docs/find_event',
            'Find Note': '/docs/find_note',
            'Event Statistics': '/docs/event_statistics',
            'Quantize & Fixed length': '/docs/quantize'
        },
        songMenu = {
            "properties": ["<a href=\"#autoQuantize\">autoQuantize</a>", "<a href=\"#bar\">bar</a>", "<a href=\"#bars\">bars</a>", "<a href=\"#barsAsString\">barsAsString</a>", "<a href=\"#beat\">beat</a>", "<a href=\"#bpm\">bpm</a>", "<a href=\"#className\">className</a>", "<a href=\"#defaultInstrument\">defaultInstrument</a>", "<a href=\"#denominator\">denominator</a>", "<a href=\"#doLoop\">doLoop</a>", "<a href=\"#durationMillis\">durationMillis</a>", "<a href=\"#durationTicks\">durationTicks</a>", "<a href=\"#eventIndex\">eventIndex</a>", "<a href=\"#factor\">factor</a>", "<a href=\"#fixedLengthValue\">fixedLengthValue</a>", "<a href=\"#highestNote\">highestNote</a>", "<a href=\"#hour\">hour</a>", "<a href=\"#id\">id</a>", "<a href=\"#illegalLoop\">illegalLoop</a>", "<a href=\"#lastBar\">lastBar</a>", "<a href=\"#loop\">loop</a>", "<a href=\"#loopedTime\">loopedTime</a>", "<a href=\"#loopEnd\">loopEnd</a>", "<a href=\"#loopStart\">loopStart</a>", "<a href=\"#lowestNote\">lowestNote</a>", "<a href=\"#millis\">millis</a>", "<a href=\"#millisecond\">millisecond</a>", "<a href=\"#millisPerTick\">millisPerTick</a>", "<a href=\"#minute\">minute</a>", "<a href=\"#name\">name</a>", "<a href=\"#nominator\">nominator</a>", "<a href=\"#numEvents\">numEvents</a>", "<a href=\"#numNotes\">numNotes</a>", "<a href=\"#numParts\">numParts</a>", "<a href=\"#numSixteenth\">numSixteenth</a>", "<a href=\"#numTracks\">numTracks</a>", "<a href=\"#paused\">paused</a>", "<a href=\"#percentage\">percentage</a>", "<a href=\"#pitchRange\">pitchRange</a>", "<a href=\"#playbackSpeed\">playbackSpeed</a>", "<a href=\"#playing\">playing</a>", "<a href=\"#positionType\">positionType</a>", "<a href=\"#ppq\">ppq</a>", "<a href=\"#quantizeValue\">quantizeValue</a>", "<a href=\"#recordId\">recordId</a>", "<a href=\"#second\">second</a>", "<a href=\"#sixteenth\">sixteenth</a>", "<a href=\"#stopped\">stopped</a>", "<a href=\"#tick\">tick</a>", "<a href=\"#ticks\">ticks</a>", "<a href=\"#ticksPerBar\">ticksPerBar</a>", "<a href=\"#ticksPerBeat\">ticksPerBeat</a>", "<a href=\"#ticksPerSixteenth\">ticksPerSixteenth</a>", "<a href=\"#timeAsString\">timeAsString</a>", "<a href=\"#useMetronome\">useMetronome</a>", "<a href=\"#volume\">volume</a>"],
            "methods": ["<a href=\"#addEffect\">addEffect()</a>", "<a href=\"#addEvent\">addEvent()</a>", "<a href=\"#addEventListener\">addEventListener()</a>", "<a href=\"#addEvents\">addEvents()</a>", "<a href=\"#addMidiEventListener\">addMidiEventListener()</a>", "<a href=\"#addPart\">addPart()</a>", "<a href=\"#addParts\">addParts()</a>", "<a href=\"#addSong\">addSong()</a>", "<a href=\"#addSongs\">addSongs()</a>", "<a href=\"#addTimeEvent\">addTimeEvent()</a>", "<a href=\"#addTimeEvents\">addTimeEvents()</a>", "<a href=\"#addTrack\">addTrack()</a>", "<a href=\"#addTracks\">addTracks()</a>", "<a href=\"#allNotesOff\">allNotesOff()</a>", "<a href=\"#barsToMillis\">barsToMillis()</a>", "<a href=\"#barsToTicks\">barsToTicks()</a>", "<a href=\"#cleanUp\">cleanUp()</a>", "<a href=\"#connect\">connect()</a>", "<a href=\"#createGrid\">createGrid()</a>", "<a href=\"#disconnect\">disconnect()</a>", "<a href=\"#eventToGrid\">eventToGrid()</a>", "<a href=\"#findEvent\">findEvent()</a>", "<a href=\"#findEvents\">findEvents()</a>", "<a href=\"#findNote\">findNote()</a>", "<a href=\"#findNotes\">findNotes()</a>", "<a href=\"#getMidiInputs\">getMidiInputs()</a>", "<a href=\"#getMidiInputsAsDropdown\">getMidiInputsAsDropdown()</a>", "<a href=\"#getMidiOutputs\">getMidiOutputs()</a>", "<a href=\"#getMidiOutputsAsDropdown\">getMidiOutputsAsDropdown()</a>", "<a href=\"#getPart\">getPart()</a>", "<a href=\"#getParts\">getParts()</a>", "<a href=\"#getPosition\">getPosition()</a>", "<a href=\"#getStats\">getStats()</a>", "<a href=\"#getTempoEvents\">getTempoEvents()</a>", "<a href=\"#getTimeSignatureEvents\">getTimeSignatureEvents()</a>", "<a href=\"#getTrack\">getTrack()</a>", "<a href=\"#getTracks\">getTracks()</a>", "<a href=\"#getVolume\">getVolume()</a>", "<a href=\"#gridToSong\">gridToSong()</a>", "<a href=\"#millisToBars\">millisToBars()</a>", "<a href=\"#millisToTicks\">millisToTicks()</a>", "<a href=\"#muteAllTracks\">muteAllTracks()</a>", "<a href=\"#noteToGrid\">noteToGrid()</a>", "<a href=\"#pause\">pause()</a>", "<a href=\"#play\">play()</a>", "<a href=\"#positionToGrid\">positionToGrid()</a>", "<a href=\"#quantize\">quantize()</a>", "<a href=\"#quantizeRecording\">quantizeRecording()</a>", "<a href=\"#record\">record()</a>", "<a href=\"#remove\">remove()</a>", "<a href=\"#removeEffect\">removeEffect()</a>", "<a href=\"#removeEventListener\">removeEventListener()</a>", "<a href=\"#removeMidiEventListener\">removeMidiEventListener()</a>", "<a href=\"#removeMidiEventListeners\">removeMidiEventListeners()</a>", "<a href=\"#removeTrack\">removeTrack()</a>", "<a href=\"#removeTracks\">removeTracks()</a>", "<a href=\"#resetTempo\">resetTempo()</a>", "<a href=\"#setDurationInBars\">setDurationInBars()</a>", "<a href=\"#setLeftLocator\">setLeftLocator()</a>", "<a href=\"#setMetronomeVolume\">setMetronomeVolume()</a>", "<a href=\"#setMidiInput\">setMidiInput()</a>", "<a href=\"#setMidiOutput\">setMidiOutput()</a>", "<a href=\"#setPitchRange\">setPitchRange()</a>", "<a href=\"#setPlaybackSpeed\">setPlaybackSpeed()</a>", "<a href=\"#setPlayhead\">setPlayhead()</a>", "<a href=\"#setPrecount\">setPrecount()</a>", "<a href=\"#setRightLocator\">setRightLocator()</a>", "<a href=\"#setTempo\">setTempo()</a>", "<a href=\"#setTrackSolo\">setTrackSolo()</a>", "<a href=\"#setVolume\">setVolume()</a>", "<a href=\"#startRecording\">startRecording()</a>", "<a href=\"#stop\">stop()</a>", "<a href=\"#stopRecording\">stopRecording()</a>", "<a href=\"#ticksToBars\">ticksToBars()</a>", "<a href=\"#ticksToMillis\">ticksToMillis()</a>", "<a href=\"#trim\">trim()</a>", "<a href=\"#undoQuantize\">undoQuantize()</a>", "<a href=\"#undoRecording\">undoRecording()</a>", "<a href=\"#update\">update()</a>", "<a href=\"#updateGrid\">updateGrid()</a>", "<a href=\"#updateTempoEvent\">updateTempoEvent()</a>", "<a href=\"#updateTimeSignatureEvent\">updateTimeSignatureEvent()</a>"],
            "objects": ["<a href=\"#activeEvents\">activeEvents</a>", "<a href=\"#activeNotes\">activeNotes</a>", "<a href=\"#activeParts\">activeParts</a>", "<a href=\"#allEvents\">allEvents</a>", "<a href=\"#events\">events</a>", "<a href=\"#eventsById\">eventsById</a>", "<a href=\"#followEvent\">followEvent</a>", "<a href=\"#gainNode\">gainNode</a>", "<a href=\"#instruments\">instruments</a>", "<a href=\"#lastEvent\">lastEvent</a>", "<a href=\"#lastEventTmp\">lastEventTmp</a>", "<a href=\"#listeners\">listeners</a>", "<a href=\"#metronome\">metronome</a>", "<a href=\"#midiEventListeners\">midiEventListeners</a>", "<a href=\"#midiInputs\">midiInputs</a>", "<a href=\"#midiOutputs\">midiOutputs</a>", "<a href=\"#notes\">notes</a>", "<a href=\"#notesById\">notesById</a>", "<a href=\"#parts\">parts</a>", "<a href=\"#partsById\">partsById</a>", "<a href=\"#playhead\">playhead</a>", "<a href=\"#recordedEvents\">recordedEvents</a>", "<a href=\"#recordedNotes\">recordedNotes</a>", "<a href=\"#recordingNotes\">recordingNotes</a>", "<a href=\"#scheduler\">scheduler</a>", "<a href=\"#timeEvents\">timeEvents</a>", "<a href=\"#tracks\">tracks</a>", "<a href=\"#tracksById\">tracksById</a>"]
        },
        i, item, html,
        url = window.location.href.toString(),
        type = url.indexOf('/api/') !== -1 ? 'api' : 'docs',
        items = type === 'api' ? itemsApi : itemsDocs;


    html = '<ul class="main">'

    if (type === 'api') {
        html += '<li><a href="/">HOME</a></li>';
        html += '<li><a href="/docs">DOCS</a></li>';
        html += '<li class="selected">API</li>';
    } else {
        html += '<li><a href="/">HOME</a></li>';
        html += '<li><a href="/api">API</a></li>';
        html += '<li class="selected">DOCS</li>';
    }
    html += '</ul>';
    html += '<ul class="sub">';

    for (i in items) {
        if (items.hasOwnProperty(i)) {
            item = items[i];
            html += '<li><a href="' + item + '">' + i + '</a></li>';
        }
    }
    html += '</ul>';
    nav.innerHTML = html;


    /*
    if(type === 'api'){
        html = '<span class="selected">API</span>';
    }else{
        html = '<span>API</span>';
    }
    html += '<ul>';
    for(i in itemsApi){
        if(itemsApi.hasOwnProperty(i)){
            item = itemsApi[i];
            html += '<li><a href="' + item + '">' + i + '</a></li>';
        }
    }
    html += '</ul>';

    if(type === 'docs'){
        html += '<span class="selected">DOCS</span>';
    }else{
        html += '<span>DOCS</span>';
    }
    html += '<ul>';
    for(i in itemsDocs){
        if(itemsDocs.hasOwnProperty(i)){
            item = itemsDocs[i];
            html += '<li><a href="' + item + '">' + i + '</a></li>';
        }
    }
    html += '</ul>';

    nav.innerHTML = html;
*/
};
