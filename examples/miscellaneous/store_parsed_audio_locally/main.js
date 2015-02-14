window.onload = function(){

    'use strict';

    if(!window.indexedDB){
        if(!window.webkitIndexedDB){
            alert('no support for indexedDB');
            return;
        }
        window.indexedDB = window.webkitIndexedDB;
    }
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    var
    db,
    timestamp,
    contextMuted = true,
    version = 0,
    context = new window.AudioContext(),
    btnLoad = document.getElementById('load'),
    request = new XMLHttpRequest();
    request.open('GET', '/heartbeat/assets/looperman.mp3', true);
    request.responseType = 'arraybuffer';
    request.onload = function(){
        if(request.status !== 200){
            return;
        }
        context.decodeAudioData(request.response, function(buffer){
            console.log('loading mp3 from server and parsing took:', new Date().getTime() - timestamp);
            store(buffer);
        });
    };


    initDB(function(){
        if(context.createGain === undefined){
            context.createGain = context.createGainNode;
        }
        if(context.start === undefined){
            context.start = context.noteOn;
            context.stop = context.noteOff;
        }
        timestamp = new Date().getTime();
        request.send();
    });


    function initDB(callback){
        var request = window.indexedDB.open('audio-1'),
            objectStore;

        request.onerror = function(event){
            console.error(event);
        };
        request.onupgradeneeded = function(event){
            // create new database
            db = event.target.result;
            objectStore = db.createObjectStore('samples', {keyPath: 'id'});
            objectStore.createIndex('id', 'id', {unique: false});
            version = db.version;
            callback();
        };
        request.onsuccess = function(event){
            // database already exists
            db = event.target.result;
            version = db.version;
            objectStore = db.transaction(['samples'], 'readwrite').objectStore('samples');
            // remove sample so we can test multiple times
            request = objectStore.delete('looperman');
            request.onsuccess = function(){
                callback();
            };
        };
    }


    function store(buffer){
        var transaction = db.transaction(['samples'], 'readwrite'),
            objectStore = transaction.objectStore('samples'),
            request = objectStore.get('looperman');

        transaction.oncomplete = function(event){
            //console.log(event);
            btnLoad.disabled = false;
        };

        transaction.onerror = function(event){
            console.error(event);
        };

        transaction.onabort = function(event){
            console.error(event);
        };

        request.onsuccess = function(event){
            if(event.target.result !== undefined){
                btnLoad.disabled = false;
            }else{
                var request = objectStore.add({
                    id: 'looperman',
                    left_channel: buffer.getChannelData(0),
                    right_channel: buffer.getChannelData(1)
                });
                request.onerror = function(event){
                    console.error(event);
                };
                request.onsuccess = function(event){
                    //console.log(event);
                    btnLoad.disabled = false;
                };
            }
        };

        request.onerror = function(event){
            console.error(event);
        };
    }


    btnLoad.addEventListener('click', function(){
        if(contextMuted === true){
            unmuteContext();
        }

        timestamp = new Date().getTime();

        var objectStore = db.transaction(['samples']).objectStore('samples'),
            request = objectStore.get('looperman');

        request.onsuccess = function(event) {
            var samplesLeftChannel = event.target.result.left_channel;
            var samplesRightChannel = event.target.result.right_channel;
            var numFrames = samplesLeftChannel.length;
            var buffer = context.createBuffer(2, numFrames, context.sampleRate);

            if(buffer.copyToChannel !== undefined){
                // Firefox -> about 50% faster than decoding
                buffer.copyToChannel(samplesLeftChannel, 0, 0);
                buffer.copyToChannel(samplesRightChannel, 1, 0);
            }else{
                // Other browsers -> about 20 - 70% slower than decoding
                var leftChannel = buffer.getChannelData(0);
                var rightChannel = buffer.getChannelData(1);
                var i;
                for(i = 0; i < numFrames; i++){
                    leftChannel[i] = samplesLeftChannel[i];
                    rightChannel[i] = samplesRightChannel[i];
                }
            }
            console.log('loading wav from DB and parsing took:', new Date().getTime() - timestamp);
            var source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);
        };

        request.onerror = function(event) {
            console.error(event);
        };
    });


    function unmuteContext(){
        var src = context.createOscillator(),
            gainNode = context.createGain();
        gainNode.gain.value = 0;
        src.connect(gainNode);
        gainNode.connect(context.destination);
        if(src.noteOn !== undefined){
            src.start = src.noteOn;
            src.stop = src.noteOff;
        }
        src.start(0);
        src.stop(0.001);
        contextMuted = false;
    }
};