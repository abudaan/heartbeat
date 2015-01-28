window.onload = function() {

    'use strict';

    var
        context,

        songBuffer,
        song = null,

        reverb = null,
        reverb112,
        reverb128,
        reverbWav,

        divLog = document.getElementById('log'),
        btnStop = document.getElementById('stop'),
        btnPlayWithReverb112 = document.getElementById('with-reverb-112'),
        btnPlayWithReverb128 = document.getElementById('with-reverb-128'),
        btnPlayWithReverbWav = document.getElementById('with-reverb-wav'),
        btnPlayWithoutReverb = document.getElementById('without-reverb');


    if(window.AudioContext){
        context = new window.AudioContext();
        if(context.createGainNode === undefined){
            context.createGainNode = context.createGain;
        }
    }else if(window.webkitAudioContext){
        context = new window.webkitAudioContext();
    }else if(window.oAudioContext){
        context = new window.oAudioContext();
    }else if(window.msAudioContext){
        context = new window.msAudioContext();
    }else{
        alert('The WebAudio API hasn\'t been implemented in this browser, please use any other browser');
        return;
    }

    divLog.innerHTML = 'AudioContext running at ' + context.sampleRate + 'Hz';


    // load an mp3
    function loadSong(){
        var
        request = new XMLHttpRequest();
        request.open('GET', '/heartbeat/assets/looperman.mp3', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            context.decodeAudioData(request.response, function(buffer){
                songBuffer = buffer;
                loadReverb112();
            });
        };
        request.send();
    }


    // load an impulse response file as mp3 @ 112kbps
    function loadReverb112(){
        var
        request = new XMLHttpRequest();
        request.open('GET', '/heartbeat/assets/100-Reverb.112.mp3', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            context.decodeAudioData(request.response, function(buffer){
                reverb112 = context.createConvolver();
                reverb112.buffer = buffer;
                loadReverb128();
            });
        };
        request.send();
    }


    // load an impulse response file as mp3 @ 128kbps
    function loadReverb128(){
        var
        request = new XMLHttpRequest();
        request.open('GET', '/heartbeat/assets/100-Reverb.128.mp3', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            context.decodeAudioData(request.response, function(buffer){
                reverb128 = context.createConvolver();
                reverb128.buffer = buffer;
                loadReverbWav();
            });
        };
        request.send();
    }


    // load an impulse response file in wav format
    function loadReverbWav(){
        var
        request = new XMLHttpRequest();
        request.open('GET', '/heartbeat/assets/100-Reverb.wav', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            context.decodeAudioData(request.response, function(buffer){
                reverbWav = context.createConvolver();
                reverbWav.buffer = buffer;
                initUI();
            });
        };
        request.send();
    }


    function initUI(){

        btnStop.addEventListener('click', function(){
            btnStop.disabled = true;
            divLog.innerHTML = 'AudioContext running at ' + context.sampleRate + 'Hz';
            stopSong();
        });

        btnPlayWithReverb112.addEventListener('click', function(){
            reverb = reverb112;
            divLog.innerHTML = 'playing with IR mp3 @ 112kbps';
            startSong();
        });

        btnPlayWithReverb128.addEventListener('click', function(){
            reverb = reverb128;
            divLog.innerHTML = 'playing with IR mp3 @ 128kbps';
            startSong();
        });

        btnPlayWithReverbWav.addEventListener('click', function(){
            reverb = reverbWav;
            divLog.innerHTML = 'playing with IR wav';
            startSong();
        });

        btnPlayWithoutReverb.addEventListener('click', function(){
            reverb = null;
            divLog.innerHTML = 'playing without reverb';
            startSong();
        });


        btnPlayWithReverb112.disabled = false;
        btnPlayWithReverb128.disabled = false;
        btnPlayWithReverbWav.disabled = false;
        btnPlayWithoutReverb.disabled = false;
    }


    function startSong(){

        stopSong();

        song = context.createBufferSource();
        song.buffer = songBuffer;

        if(reverb !== null){
            song.connect(reverb);
            reverb.connect(context.destination);
        }else{
            song.connect(context.destination);
        }

        btnStop.disabled = false;
        song.start(0);
    }


    function stopSong(){

        if(song !== null){
            song.disconnect();
            song.stop(0);
            song = null;
        }

        if(reverb !== null){
            reverb.disconnect();
        }
    }


    loadSong();

};
