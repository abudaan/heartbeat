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
        btnUndoRecording = document.getElementById('record-undo'),
        btnPreRoll = document.getElementById('preroll'),
        btnSave = document.getElementById('save'),
        selectRecordings = document.getElementById('recordings'),
        divEvents = document.getElementById('song_events'),
        divRecorded = document.getElementById('recorded_events'),

        recordingIndex = 1,
        recordingHistory = {},
        selectedRecordingId,
        lastRecordingId,

        sliderPosition,
        sliderNumPrecountBars,

        userInteraction = false,
        numPrecountBars = 0,

        path = '../../../assets';


    enableUI(false);

    // load an asset pack, this pack contains a basic piano
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var track, song;

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
            divEvents.innerHTML = 'play<br/>' + divEvents.innerHTML;
        });

        song.addEventListener('pause', function(){
            btnPlay.value = 'play';
            divEvents.innerHTML = 'pause<br/>' + divEvents.innerHTML;
        });

        song.addEventListener('stop', function(){
            btnPlay.value = 'play';
            divEvents.innerHTML = 'stop<br/>' + divEvents.innerHTML;
        });

        song.addEventListener('record_precount', function(){
            divEvents.innerHTML = 'record_precount<br/>' + divEvents.innerHTML;
        });

        song.addEventListener('record_preroll', function(){
            sliderPosition.elem.className = 'recording';
            divEvents.innerHTML = 'record_preroll<br/>' + divEvents.innerHTML;
        });

        song.addEventListener('record_start', function(){
            sliderPosition.elem.className = 'recording';
            divEvents.innerHTML = 'record_start<br/>' + divEvents.innerHTML;
        });

        song.addEventListener('record_stop', function(recording){
            // handle some ui stuff
            sliderPosition.elem.className = '';
            btnStartRecording.value = 'start recording';
            btnUndoRecording.disabled = false;
            divEvents.innerHTML = 'record_stop<br/>' + divEvents.innerHTML;

            /*
                Add the recording to the history. The recording object contains per track all events recorded in the last
                recording session. Usually the object contains only the recorded events of a single track, but you can
                record multiple inputs to multiple tracks at the same time.
            */
            lastRecordingId = 'recording #' + recordingIndex++;
            recordingHistory[lastRecordingId] = recording;
            handleRecordedEvents();
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

        btnPreRoll.addEventListener('click', function(){
            song.preroll = !song.preroll;
            if(song.preroll){
                btnPreRoll.value = 'preroll off';
            }else{
                btnPreRoll.value = 'preroll on';
            }
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
                // start recording after the number of precount bars that is set by the slider
                song.startRecording(numPrecountBars);
                btnStartRecording.value = 'stop recording';
            }
        });

        btnUndoRecording.addEventListener('click', function(){
            // undo the last recording
            song.undoRecording();
            song.update();
            delete recordingHistory[lastRecordingId];
            handleRecordedEvents();
            // once the last recording is undone, disable the button untill a new recording is done
            btnUndoRecording.disabled = true;
        });


        btnDeleteRecording.addEventListener('click', function(){
            // deletes the recording that the user has selected in the recordings dropdown menu
            song.undoRecording(recordingHistory[selectedRecordingId]);
            song.update();
            delete recordingHistory[selectedRecordingId];
            handleRecordedEvents();
        });


        btnSave.addEventListener('click', function(){
            sequencer.saveSongAsMidiFile(song);
        });


        selectRecordings.addEventListener('change', function(){
            // every time you make a recording, an extra option will be adde to the dropdown menu, see handleRecordedEvents() below
            selectedRecordingId = selectRecordings.options[selectRecordings.selectedIndex].value;
            btnDeleteRecording.disabled = false;
        });


        (function(){
            sliderNumPrecountBars = createSlider({
                slider: document.getElementById('precount'),
                message: 'precount bars: {value}',
                onMouseDown: calculate,
                onMouseMove: calculate
            });

            function calculate(value){
               numPrecountBars = value;
               sliderNumPrecountBars.setLabel(numPrecountBars);
            }
        }());


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
        btnUndoRecording.disabled = true;
        btnDeleteRecording.disabled = true;
        render();
    }


    function handleRecordedEvents(){
        // prints out the recorded events per session and populutes the dropdown menu
        var print = '',
            options = '<option>select a recording</option>',
            recId, trackName, i, maxi,
            recording, events, event, numEvents;

        for(recId in recordingHistory){
            if(recordingHistory.hasOwnProperty(recId)){
                recording = recordingHistory[recId];
                print += '<em>' + recId + '</em></br>';
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
                options += '<option value="' + recId + '">' + recId + ': ' + numEvents + ' events</option>';
            }
        }

        divRecorded.innerHTML = print;
        selectRecordings.innerHTML = options;

        selectedRecordingId = undefined;
        btnDeleteRecording.disabled = true;
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