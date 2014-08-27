window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        createSlider = sequencer.util.createSlider,

        btnStop = document.getElementById('stop'),
        btnPlay = document.getElementById('play'),
        btnMetronome = document.getElementById('metronome'),
        divTempo = document.getElementById('tempo'),
        divSustainPedal = document.getElementById('sustain-pedal'),

        sliderPlayhead,
        userInteraction = false,
        testMethod = 1,
        path = '../../assets';



    enableUI(false);

    // load a midi file with a lot of tempo events
    sequencer.addMidiFile({url: path + '/examples/minute_waltz.mid'});
    // load an asset pack, this pack contains a piano
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var song, midiFile, instrument;

        // get the midi file from sequencer.storage
        midiFile = sequencer.getMidiFile('minute_waltz');

        switch(testMethod){

            case 1:
                // method 1: create a song directly from the midi file, this way the midi file is treated as a config object
                midiFile.useMetronome = true;
                song = sequencer.createSong(midiFile);
                break;

            case 2:
                // method 2: copy over some parts of the midi to a config object, note that you don't need to set the nominator
                // and the denominator if you supply "timeEvents"; the tempo and time signature data will be retrieved from the
                // supplied time events
                song = sequencer.createSong({
                    nominator: midiFile.nominator, // not really necessary
                    denominator: midiFile.denominator, // not really necessary
                    timeEvents: midiFile.timeEvents,
                    tracks: midiFile.tracks,
                    useMetronome: true
                });
                break;

            case 3:
                // method 3: change the tempo, if you supply a value for both "timeEvents" and "bpm", all tempo events will
                // be multiplied by a factor config.bpm/midiFile.bpm, in this case 240/141. You get the same result if you
                // call song.setTempo(240) after the song has been created.
                song = sequencer.createSong({
                    bpm: 240,
                    timeEvents: midiFile.timeEvents,
                    tracks: midiFile.tracks,
                    useMetronome: true
                });
                break;
        }

        instrument = sequencer.createInstrument('piano');
        instrument.setRelease(100);

        // set all tracks of the song to use 'piano'
        song.tracks.forEach(function(track){
            track.setInstrument(instrument);
            //track.setMidiOutput('hw:CARD=3:3', true);
        });

        btnPlay.addEventListener('click', function(){
            song.play();
        });

        btnStop.addEventListener('click', function(){
            song.stop();
        });

        btnMetronome.addEventListener('click', function(){
            song.useMetronome = !song.useMetronome;
            if(song.useMetronome === true){
                btnMetronome.value = 'metronome off';
            }else{
                btnMetronome.value = 'metronome on';
            }
        });

        song.addEventListener('sustain_pedal', function(value){
            divSustainPedal.className = value === 'down' ? 'down' : '';
            divSustainPedal.innerHTML = 'sustain pedal: ' + value;
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

        song.addEventListener('end', function(){
            btnPlay.value = 'play';
        });


        (function(){
            var position;
            sliderPlayhead = createSlider({
                slider: document.getElementById('playhead'),
                message: 'song bar: {value}',
                onMouseDown: handle,
                onMouseMove: handle,
                onMouseUp: handle
            });

            function handle(value, e){
                if(e.type === 'mousedown' || e.type === 'mousemove'){
                    position = song.getPosition('percentage', value);
                    sliderPlayhead.setLabel(position.barsAsString + ' | ticks: ' + position.ticks + ' | millis: ' + position.millis);
                    divTempo.innerHTML = 'tempo: ' + position.bpm + 'bpm';
                }

                if(e.type === 'mousedown'){
                    userInteraction = true;
                }else if(e.type === 'mouseup'){
                    userInteraction = false;
                    song.setPlayhead('millis', position.millis);
                }
            }
        }());

        function render(){
            if(userInteraction === false){
                sliderPlayhead.setValue(song.percentage);
                sliderPlayhead.setLabel(song.barsAsString + ' | ticks: ' + song.ticks + ' | millis: ' + song.millis);
                divTempo.innerHTML = 'tempo: ' + song.bpm + 'bpm';
            }
            window.requestAnimationFrame(render);
        }

        enableUI(true);
        render();
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