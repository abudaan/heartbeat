(function(){

    'use strict';

    scope.list = {
        'objects':[
            {
                'name': 'KeyEditor',
                'page': 'key_editor.html',
                'methods': [
                    ['create', 'createKeyEditor'],
                    ['setBarsPerPage', '#'],
                    ['setViewport', '#'],
                    ['updateSong', '#'],
                    ['setStartPosition', '#'],
                    ['setEndPosition', '#'],
                    ['addEventListener', '#'],
                    ['nextPage', '#'],
                    ['prevPage', '#'],
                    ['gotoPage', '#'],
                    ['scroll', '#'],
                    ['updateScroll', '#'],
                    ['getNoteRect', '#'],
                    ['getPartRect', '#'],
                    ['getBBox', '#'],
                    ['getTicksAt', '#'],
                    ['xToTicks', '#'],
                    ['getPitchAt', '#'],
                    ['yToPitch', '#'],
                    ['getXAt', '#'],
                    ['ticksToX', '#'],
                    ['getYAt', '#'],
                    ['pitchToY', '#'],
                    ['getPositionAt', '#'],
                    ['getPlayheadPosition', '#'],
                    ['setPlayheadPosition', '#'],
                    ['getEventAt', '#'],
                    ['getNoteAt', '#'],
                    ['getEventsInRect', '#'],
                    ['getNotesInRect', '#'],
                    ['snap', '#'],
                    ['snapX', '#'],
                    ['snapY', '#'],
                    ['setX', '#'],
                    ['setY', '#'],
                    ['setSnapX', '#'],
                    ['setSnapY', '#'],
                    ['addEventAt', '#'],
                    ['moveEvent', '#'],
                    ['addNoteAt', '#'],
                    ['moveNote', '#'],
                    ['resizeNote', '#'],
                    ['eventIterator', '#']
                ]
            },{
                'name': 'Song',
                'page': 'song.html',
                'methods': [
                    ['sequencer.createSong', '#'],
                    ['addTrack', '#'],
                    ['removeTrack', '#'],
                    ['addTempoTrack', '#'],
                    ['addTempoEvent', '#'],
                    ['addTimeEvents', '#'],
                    ['addTimeEvent', '#'],
                    ['getTrack', '#'],
                    ['getTracks', '#'],
                    ['deleteTracks', '#'],
                    ['update', '#'],
                    ['findPosition', '#'],
                    ['getPositionAtTicks', '#'],
                    ['findEvent', '#'],
                    ['findNote', '#'],
                    ['getStats', '#']
                ]
            },{
                'name': 'Track',
                'page': 'track.html',
                'methods': [
                    ['sequencer.createTrack', '#'],
                    ['addPart', '#'],
                    ['addPartAt', '#'],
                    ['movePart', '#'],
                    ['movePartTo', '#'],
                    ['moveAllPartsTo', '#'],
                    ['moveAllParts', '#'],
                    ['copyPart', '#'],
                    ['copyPartTo', '#'],
                    ['deletePart', '#'],
                    ['deletePartAt', '#'],
                    ['deletePartFromTo', '#'],
                    ['deletePartsFromTo', '#'],
                    ['getPart', '#'],
                    ['getPartAt', '#'],
                    ['getPartsAt', '#'],
                    ['getPartFromTo', '#'],
                    ['getPartsFromTo', '#'],
                    ['getPartBetween', '#'],
                    ['getPartsBetween', '#'],
                    ['getAllParts', '#'],
                    ['findEvent', '#'],
                    ['findNote', '#'],
                    ['getStats', '#'],
                    ['update', '#'],
                    ['transpose', '#'],
                    ['copy', '#']
                ]
            },{
                'name': 'Part',
                'page': 'part.html',
                'methods': [
                    ['sequencer.createPart', 'create']
                ]
            },{
                'name': 'Note',
                'page': 'note.html',
                'methods': [
                    ['sequencer.createNote', 'create']
                ]
            },{
                'name': 'MidiEvent',
                'page': 'midi_event.html',
                'methods': [
                    ['sequencer.createMidiEvent', 'create']
                ]
            },{
                'name': 'AudioEvent',
                'page': 'audio_event.html',
                'methods': [
                    ['sequencer.createAudioEvent', 'create']
                ]
            },{
                'name': 'Sequencer',
                'page': 'sequencer.html',
                'methods': [
                    ['sequencer', '#']
                ]
            }
        ],
        
        'functions':[
            {
                'name': 'instruments',
                'page': 'instruments.html'
            },{
                'name': 'find event',
                'page': 'find_event.html'
            },{
                'name': 'find note',
                'page': 'find_note.html'
            },{
                'name': 'follow event',
                'page': 'follow_event.html'
            } ,{
                'name': 'event statistics',
                'page': 'event_statistics.html'
            }
        ],

        'introduction': [
            {
                'name': 'What is heartbeat?',
                'page': 'what_is_heartbeat.html'
            },{
                'name': 'Songs, parts, tracks and events',
                'page': 'songs_tracks_parts.html'
            },{
                'name': 'Examples',
                'page': 'examples.html'
            }
        ]
    };
}());