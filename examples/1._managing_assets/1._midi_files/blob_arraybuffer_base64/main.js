window.onload = function() {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnStop = document.getElementById('stop'),
        btnStart = document.getElementById('start'),
        btnLoadBlob = document.getElementById('load-blob'),
        btnLoadArrayBuffer = document.getElementById('load-arraybuffer'),
        btnLoadBase64 = document.getElementById('load-base64'),
        divMessage = document.getElementById('message'),

        song;



    sequencer.ready(function init(){

        btnStart.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        // load a binary MIDI file as blob -> responseType is set to blob
        btnLoadBlob.addEventListener('click', function(){

            var request = new XMLHttpRequest();
            request.open('GET', '/heartbeat/assets/midi/minute_waltz.mid', true);
            request.responseType = 'blob';

            request.onload = function() {
                // createMidiFile returns a Promise
                sequencer.createMidiFile({blob: request.response}).then(
                    function onFulfilled(midifile){
                        createSong(midifile, 'blob');
                    },
                    function onRejected(e){
                        divMessage.textContent = 'error: ' + e;
                    }
                );
            };

            divMessage.textContent = '';
            btnStart.disabled = true;
            btnStop.disabled = true;
            request.send();
        });


        // load a binary MIDI file as arraybuffer -> responseType is set to arraybuffer
        btnLoadArrayBuffer.addEventListener('click', function(){

            var request = new XMLHttpRequest();
            request.open('GET', '/heartbeat/assets/midi/minute_waltz.mid', true);
            request.responseType = 'arraybuffer';

            request.onload = function() {
                // createMidiFile returns a Promise
                sequencer.createMidiFile({arraybuffer: request.response}).then(
                    function onFulfilled(midifile){
                        createSong(midifile, 'arraybuffer');
                    },
                    function onRejected(e){
                        divMessage.textContent = 'error: ' + e;
                    }
                );
            };

            divMessage.textContent = '';
            btnStart.disabled = true;
            btnStop.disabled = true;
            request.send();
        });


        // load a base64 encoded MIDI file as text -> responseType is set to text
        btnLoadBase64.addEventListener('click', function(){

            var request = new XMLHttpRequest();
            request.open('GET', '/heartbeat/assets/midi/minute_waltz.b64', true);
            request.responseType = 'text';

            request.onload = function() {
                // createMidiFile returns a Promise
                sequencer.createMidiFile({base64: request.response}).then(
                    function onFulfilled(midifile){
                        createSong(midifile, 'base64');
                    },
                    function onRejected(e){
                        divMessage.textContent = 'error: ' + e;
                    }
                );
            };

            divMessage.textContent = '';
            btnStart.disabled = true;
            btnStop.disabled = true;
            request.send();
        });
    });


    function createSong(midifile, type){
        if(song !== undefined){
            sequencer.deleteSong(song);
        }
        song = sequencer.createSong(midifile);
        btnStart.disabled = false;
        btnStop.disabled = false;
        divMessage.textContent = 'minute_waltz.mid loaded (' + type + ')';
    }
};
