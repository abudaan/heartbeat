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
        btnMetronome = document.getElementById('metronome'),
        selectRecordings = document.getElementById('recordings'),
        divRecorded = document.getElementById('recorded_events'),
        sliderLatency,

        song,
        track,

        recordingIndex = 1,
        recordingHistory = {},
        selectedRecordingId,
        lastRecordingId,
        lastRecording,

        sliderPosition,
        sliderNumPrecountBars,

        userInteraction = false,
        numPrecountBars = 0;


    enableUI(false);

    sequencer.ready(function init(){

        track = sequencer.createTrack();
        // enable the track for recording audio
        track.recordEnabled = 'audio';

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


        song.addEventListener('record_preroll', function(){
            sliderPosition.elem.className = 'recording';
        });

        song.addEventListener('record_start', function(){
            sliderPosition.elem.className = 'recording';
        });

        song.addEventListener('record_stop', function(){
            // handle some ui stuff
            sliderPosition.elem.className = '';
            btnStartRecording.value = 'start recording';
            btnUndoRecording.disabled = false;
        });


        song.addEventListener('recorded_events', function(recording){
            /*
                Add the recording to the history. The recording object contains per track all events recorded in the last
                recording session. Usually the object contains only the recorded events of a single track, but you can
                record multiple inputs to multiple tracks at the same time.
            */
            lastRecordingId = 'recording #' + recordingIndex++;
            recordingHistory[lastRecordingId] = recording;
            handleRecordedEvents();
            //console.log(song.getLastAudioRecording());
        });


        song.addEventListener('latency_adjusted', function(){
            console.log('latency_adjusted');
            //handleRecordedEvents();
        });


        btnPlay.addEventListener('click', function(){
            // if you press the play/pause button during a recording, it will act like a stop button and stop the recording
            if(song.playing){
                song.pause();
            }else{
                song.play();
            }
            //console.log(song.events.length);
        });

        btnStop.addEventListener('click', function(){
            // if recording, stops the recording as well
            song.stop();
        });


        btnStartRecording.addEventListener('click', function(){
            if(song.recording === true || song.precounting === true){
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


        btnMetronome.addEventListener('click', function(){
            song.useMetronome = !song.useMetronome;
            if(song.useMetronome === true){
                btnMetronome.value = 'metronome off';
            }else{
                btnMetronome.value = 'metronome on';
            }
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


        (function(){
            var slider = document.getElementById('latency'),
                currentValue;

            sliderLatency = createSlider({
                slider: slider,
                label: slider.previousSibling,
                message: 'latency compensation: <em>{value} millis</em>',
                onMouseMove: handle,
                onMouseDown: handle,
                onMouseUp: process
            });


            function handle(value){
                currentValue = value;
                sliderLatency.setLabel(value);
            }

            function process(){
                if(lastRecording !== undefined){
                    track.setAudioRecordingLatency(lastRecording.id, currentValue, function(){
                        handleRecordedEvents();
                    });
                }
            }

            sliderLatency.set = function(value){
                currentValue = value;
                this.setLabel(value);
                this.setValue(value);
                process(value);
            };
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
    });


    function handleRecordedEvents(){
        // prints out the recorded events per session and populutes the dropdown menu
        var print = '',
            options = '<option>select a recording</option>',
            recId, track, trackName, i, maxi,
            recording, events, event, numEvents,
            downloadLinks, link;

        for(recId in recordingHistory){
            if(recordingHistory.hasOwnProperty(recId)){
                recording = recordingHistory[recId];
                print += '<em>' + recId + '</em></br>';
                print += '<table>';
                print += '<tr><td>ticks</td><td>position</td><td>waveform</td></tr>';
                for(trackName in recording){
                    if(recording.hasOwnProperty(trackName)){
                        events = recording[trackName];
                        maxi = events.length;
                        numEvents = maxi;
                        for(i = 0; i < maxi; i++){
                            event = events[i];
                            track = event.track;
                            recording = track.getAudioRecordingData(event.sampleId);
                            print += '<tr>';
                            print += '<td>' + event.ticks + '</td>';
                            print += '<td>' + event.barsAsString + '</td>';
                            print += '<td><img src="' + recording.waveform.dataUrls[0] + '" width="800" height="200"></td>';
                            print += '<td><span class="download_link" data:type="wav" data:recording_id="' + recording.id + '">save wav file</span></td>';
                            print += '<td><span class="download_link" data:type="mp3" data:recording_id="' + recording.id + '">save mp3 file</span></td>';
                            print += '<td><span class="download_link" data:type="samplepack" data:recording_id="' + recording.id + '">save samplepack</span></td>';
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

        downloadLinks = document.querySelectorAll('.download_link');

        for(i = downloadLinks.length - 1; i >= 0; i--){
            link = downloadLinks[i];
            link.addEventListener('click', function(){

                var id = this.getAttribute('data:recording_id'),
                    type = this.getAttribute('data:type');

                recording = song.getAudioRecordingData(id);
                /*
                    recording is an object that contains the keys:
                    - id
                    - arraybuffer (raw wav data)
                    - audiobuffer (raw wav data converted to AudioBuffer instance)
                    - wav
                        - blob
                        - base64
                        - dataUrl
                    // after you've called encodeAudioRecording() and passed 'mp3' for encoding type
                    - mp3
                        - blob
                        - base64
                        - dataUrl

                */

                if(type === 'mp3'){
                    if(recording.mp3 === undefined){
                        track.encodeAudioRecording(id, 'mp3', 128, function(recording){
                            saveAs(recording.mp3.blob, id + '.mp3');
                        });
                    }else{
                        saveAs(recording.mp3.blob, id + '.mp3');
                    }
                }else if(type === 'wav'){
                    saveAs(recording.wav.blob, id + '.wav');
                }else if(type === 'samplepack'){
                    if(recording.mp3 === undefined){
                        track.encodeAudioRecording(id, 'mp3', 128, function(recording){
                            saveAsSamplePack(recording);
                        });
                    }else{
                        saveAsSamplePack(recording);
                    }
                }

            }, false);
        }

        lastRecording = recording;
        selectedRecordingId = undefined;
        btnDeleteRecording.disabled = true;
    }


    function saveAsSamplePack(recording){
        var sp = {
            name: 'my recordings',
            folder: 'my folder',
            type: 'samplepack',
            mapping: {
            }
        };
        sp.mapping[recording.id] = recording.mp3.base64;
        sp = JSON.stringify(sp);
        sp = sp.replace(/\\r\\n/g, '');
        saveAs(new Blob([sp], {type: 'application/json'}), 'test.json');
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