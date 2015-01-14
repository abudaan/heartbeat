window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        // creates handy wrapper around the range element
        createSlider = sequencer.util.createSlider,

        btnStop = document.getElementById('stop'),
        btnPlay = document.getElementById('play'),
        btnStartRecording = document.getElementById('record-start'),
        btnDeleteRecording = document.getElementById('record-delete'),
        btnQuantize = document.getElementById('quantize'),
        btnUndoQuantize = document.getElementById('undo-quantize'),
        divSongEvents = document.getElementById('song_events'),
        divRecordedEvents = document.getElementById('recorded_events'),

        path = '../../../assets',

        song,
        quantizeHistory,

        sliderPosition,
        userInteraction = false;


    enableUI(false);

    // load an asset pack, this pack contains a basic piano
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var track;

        if(sequencer.midi === false){
            document.querySelectorAll('p')[0].innerHTML = 'No MIDI I/O';
            document.querySelectorAll('p')[1].innerHTML = '';
            return;
        }

        track = sequencer.createTrack();
        // set monitor to true to route the incoming midi events to the track
        track.monitor = true;
        track.setMidiInput('all');
        // enable the track for recording
        track.recordEnabled = true;
        track.setInstrument('piano');

        song = sequencer.createSong({
            useMetronome: true,
            tracks: track,
            bars: 30,
            ppq: 480,
            quantizeValue: 4
        });

        song.addEventListener('play', function(){
            btnPlay.value = 'pause';
        });

        song.addEventListener('pause', function(){
            btnPlay.value = 'play';
        });

        song.addEventListener('stop', function(){
            btnPlay.value = 'play';
        });

        song.addEventListener('record_start', function(){
            sliderPosition.elem.className = 'recording';
        });

        song.addEventListener('record_stop', function(recording){
            // handle some ui stuff
            sliderPosition.elem.className = '';
            btnStartRecording.value = 'start recording';
            btnDeleteRecording.disabled = false;
            btnQuantize.disabled = false;

            showRecordedEvents(recording);
            showSongEvents();
        });


        btnPlay.addEventListener('click', function(){
            // if you press the play/pause button during a recording, it will act like a stop button and stop the recording
            if(song.playing){
                song.pause();
            }else{
                song.play();
            }
        });


        btnStop.addEventListener('click', function(){
            // if recording, stops the recording as well
            song.stop();
        });


        btnStartRecording.addEventListener('click', function(){
            if(song.recording === true || song.precounting === true){
                /*
                    When you stop a recording by calling song.stopRecording(), an object containing the
                    recorded events per track is returned. This object is also passed as an argument to
                    the callback of the "record_stop" event. In this example we use the latter.
                */
                song.stopRecording();
            }else{
                // start recording immediately
                song.startRecording(0);
                btnStartRecording.value = 'stop recording';
            }
        });


        btnDeleteRecording.addEventListener('click', function(){
            // delete the last recording
            song.undoRecording();
            song.update();
            btnQuantize.disabled = true;
            btnUndoQuantize.disabled = true;
            btnDeleteRecording.disabled = true;
            divSongEvents.innerHTML = '';
            divRecordedEvents.innerHTML = '';
        });


        btnQuantize.addEventListener('click', function(){
            quantizeHistory = song.quantize();
            song.update();
            btnQuantize.disabled = true;
            btnUndoQuantize.disabled = false;
            showSongEvents();
        });


        btnUndoQuantize.addEventListener('click', function(){
            song.undoQuantize(quantizeHistory);
            song.update();
            btnQuantize.disabled = false;
            btnUndoQuantize.disabled = true;
            showSongEvents();
        });


        (function(){
            sliderPosition = createSlider({
                slider: document.getElementById('playhead'),
                message: 'song position: {value}',
                onMouseDown: calculate,
                onMouseMove: calculate,
                onMouseUp: function(){
                    userInteraction = false;
                }
            });

            function calculate(value, e){
                song.setPlayhead('percentage', value);
                sliderPosition.setLabel(song.barsAsString + ' (' + song.millisRounded + ' ms)');

                if(e.type === 'mousedown'){
                    userInteraction = true;
                }
            }
        }());


        function render(){
            if(userInteraction === false){
                sliderPosition.setValue(song.percentage);
                sliderPosition.setLabel(song.barsAsString + ' (' + song.millisRounded + ' ms)');
            }
            requestAnimationFrame(render);
        }
        enableUI(true);
        // buttons will be enabled as soon as something has been recorded
        btnQuantize.disabled = true;
        btnUndoQuantize.disabled = true;
        btnDeleteRecording.disabled = true;
        render();
    }


    // prints out the recorded events
    function showRecordedEvents(recording){
        var print = '',
            trackName, i, maxi,
            events, event, numEvents;

        print += '<table>';
        print += '<tr><td>ticks</td><td>type</td><td>data1</td><td>data1</td><td>position</td></tr>';
        for(trackName in recording){
            if(recording.hasOwnProperty(trackName)){
                events = recording[trackName];
                maxi = events.length;
                numEvents = maxi;
                for(i = 0; i < maxi; i++){
                    event = events[i];
                    print += '<tr>';
                    print += '<td>' + event.ticks + '</td>';
                    print += '<td>' + event.type + '</td>';
                    print += '<td>' + event.data1 + '</td>';
                    print += '<td>' + event.data2 + '</td>';
                    print += '<td>' + event.barsAsString + '</td>';
                    print += '</tr>';
                }
            }
        }
        print += '</table>';
        divRecordedEvents.innerHTML = print;
    }


    // prints out all events in the song so you can compare the positions with the positions of the events of your initial recording
    function showSongEvents(){
        var print = '';

        print += '<table>';
        print += '<tr><td>ticks</td><td>type</td><td>data1</td><td>data1</td><td>position</td></tr>';
        song.events.forEach(function(event){
            print += '<tr>';
            print += '<td>' + event.ticks + '</td>';
            print += '<td>' + event.type + '</td>';
            print += '<td>' + event.data1 + '</td>';
            print += '<td>' + event.data2 + '</td>';
            print += '<td>' + event.barsAsString + '</td>';
            print += '</tr>';
        });
        print += '</table>';
        divSongEvents.innerHTML = print;
    }


    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }
};