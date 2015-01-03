window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        btnWav = document.getElementById('wav'),
        btnOgg = document.getElementById('ogg'),
        btnMp3 = document.getElementById('mp3'),
        btnStop = document.getElementById('stop'),
        divConsole = document.getElementById('console'),
        selectTrack = document.getElementById('select_track'),

        path = 'http://abumarkub.net/heartbeat/assets/';
        //path = '../../assets/';


    // disable ui until sequencer is initialized
    enableUI(false);


    sequencer.ready(function init(){
        var context = sequencer.getAudioContext(),
            src,
            timestamp,
            track = path + 'looperman';


        selectTrack.addEventListener('change', function(){
            var id = selectTrack.options[selectTrack.selectedIndex].id;
            if(id === 'short_track'){
                track = path + 'looperman';
            }else if(id === 'long_track'){
                track = path + 'glassworks';
            }
        }, false);


        btnWav.addEventListener('click', function(){
            if(src !== undefined){
                src.stop();
            }
            divConsole.innerHTML = 'loading wav...';
            console.time('loading wav took');
            sequencer.util.ajax({
                url: track + '.wav',
                responseType: 'arraybuffer',
                onError: function(e){
                    console.log(e);
                },
                onSuccess: function(buffer){
                    console.timeEnd('loading wav took');
                    divConsole.innerHTML = '';
                    setTimeout(function(){
                        console.time('decoding wav took');
                        context.decodeAudioData(buffer, function(buffer){
                            console.timeEnd('decoding wav took');
                            src = context.createBufferSource();
                            src.buffer = buffer;
                            src.connect(context.destination);
                            src.start();
                        });
                    },0);
                 }
            });
        }, false);


        btnOgg.addEventListener('click', function(){
            if(src !== undefined){
                src.stop();
            }
            divConsole.innerHTML = 'loading ogg...';
            console.time('loading ogg took');
            sequencer.util.ajax({
                url: track + '.ogg',
                responseType: 'arraybuffer',
                onError: function(e){
                    console.log(e);
                },
                onSuccess: function(buffer){
                    console.timeEnd('loading ogg took');
                    divConsole.innerHTML = '';
                    setTimeout(function(){
                        console.time('decoding ogg took');
                        context.decodeAudioData(buffer, function(buffer){
                            console.timeEnd('decoding ogg took');
                            src = context.createBufferSource();
                            src.buffer = buffer;
                            src.connect(context.destination);
                            src.start();
                        });
                    },0);
                }
            });
        }, false);


        btnMp3.addEventListener('click', function(){
            if(src !== undefined){
                src.stop();
            }
            divConsole.innerHTML = 'loading mp3...';
            console.time('loading mp3 took');
            sequencer.util.ajax({
                url: track + '.mp3',
                responseType: 'arraybuffer',
                onError: function(e){
                    console.log(e);
                },
                onSuccess: function(buffer){
                    console.timeEnd('loading mp3 took');
                    divConsole.innerHTML = '';
                    setTimeout(function(){
                        console.time('decoding mp3 took');
                        context.decodeAudioData(buffer, function(buffer){
                            console.timeEnd('decoding mp3 took');
                            src = context.createBufferSource();
                            src.buffer = buffer;
                            src.connect(context.destination);
                            src.start();
                        });
                    },0);
                }
            });
        }, false);


        btnStop.addEventListener('click', function(){
            src.stop();
        }, false);


        enableUI(true);

        btnOgg.disabled = sequencer.ogg === false;
        btnMp3.disabled = sequencer.mp3 === false;
    });


    function enableUI(flag){
        var elements = document.querySelectorAll('input'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }

    }
};