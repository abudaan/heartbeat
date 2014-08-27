window.onload = function(){

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,

        song,
        userInteraction = false,

        btnStop = document.getElementById('stop'),
        btnPlay = document.getElementById('play'),
        btnLoop = document.getElementById('loop'),
        sliderPlayhead = document.getElementById('playhead'),
        sliderLeftLocator = document.getElementById('left_locator'),
        sliderRightLocator = document.getElementById('right_locator'),
        sliderLabelPlayhead = sliderPlayhead.parentNode.firstChild,
        sliderLabelLeftLocator = sliderLeftLocator.parentNode.firstChild,
        sliderLabelRightLocator = sliderRightLocator.parentNode.firstChild,

        path = '../../assets';


    enableUI(false);

    /*
        load asset pack, this asset pack contains:
        - sample pack with name 'piano' -> will be stored in sequencer/storage/audio/instruments/piano
        - sample pack with name 'VS8F' -> will be stored in sequencer/storage/audio/ir/VS8F
        - instrument with name 'piano' -> will be stored in sequencer/instruments/piano
        - midifile with name 'Sonata Facile' -> will be stored in sequencer/midi/classical/Sonata Facile

        after the loading has completed, the init method is called
    */
    sequencer.addAssetPack({url: path + '/examples/asset_pack_basic.json'}, init);


    function init(){
        var midiFile;

        // get the midi file from sequencer.storage
        midiFile = sequencer.getMidiFile('Sonata Facile');

        midiFile.useMetronome = true;
        song = sequencer.createSong(midiFile);


        // set all tracks of the song to use 'piano'
        song.tracks.forEach(function(track){
            track.setInstrument('piano');
        });


        // set all sliders to the number of bars of the song
        sliderPlayhead.setAttribute('max', song.bars);
        sliderLeftLocator.setAttribute('max', song.bars);
        sliderRightLocator.setAttribute('max', song.bars);


        // set a loop
        sliderLeftLocator.value = 2;
        sliderRightLocator.value = 6;

        sliderLabelLeftLocator.innerHTML = 'left locator: ' + sliderLeftLocator.value;
        sliderLabelRightLocator.innerHTML = 'left locator: ' + sliderRightLocator.value;

        song.setLeftLocator('barsbeats', sliderLeftLocator.valueAsNumber,1,1,0);
        song.setRightLocator('barsbeats', sliderRightLocator.valueAsNumber,1,1,0);


        btnPlay.addEventListener('click', function(){
            song.pause();
            if(song.paused){
                this.value = 'play';
            }else if(song.playing){
                this.value = 'pause';
            }
        }, false);


        btnStop.addEventListener('click', function(){
            song.stop();
        }, false);


        btnLoop.addEventListener('click', function(){
            // if you don't pass a value to setLoop() it will toggle the loop state of the song
            song.setLoop();
            this.value = song.loop ? 'turn loop off' : 'turn loop on';
        }, false);


        sliderPlayhead.addEventListener('mousedown', function(){
            userInteraction = true;
        }, false);


        sliderPlayhead.addEventListener('mousemove', function(){
            var value = this.valueAsNumber;
            sliderLabelPlayhead.innerHTML = 'song position: ' + value;
        }, false);


        sliderPlayhead.addEventListener('mouseup', function(){
            var value = this.valueAsNumber;
            sliderLabelPlayhead.innerHTML = 'song position: ' + value;
            song.setPlayhead('barsbeats', value,1,0,0);
            userInteraction = false;
        }, false);


        sliderLeftLocator.addEventListener('mousemove', function(){
            var value = this.valueAsNumber;
            sliderLabelLeftLocator.innerHTML = 'left locator: ' + value;
            song.setLeftLocator('barsbeats', value,1,0,0);
            sliderLeftLocator.className = song.illegalLoop ? 'illegal' : 'legal';
            sliderRightLocator.className = song.illegalLoop ? 'illegal' : 'legal';
        }, false);


        sliderRightLocator.addEventListener('mousemove', function(){
            var value = this.valueAsNumber;
            sliderLabelRightLocator.innerHTML = 'right locator: ' + value;
            song.setRightLocator('barsbeats', value,1,0,0);
            sliderLeftLocator.className = song.illegalLoop ? 'illegal' : 'legal';
            sliderRightLocator.className = song.illegalLoop ? 'illegal' : 'legal';
        }, false);


        render();
        enableUI(true);
    }

    function enableUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }


    function render(){
        if(userInteraction === false){
            sliderPlayhead.value = song.bar;
            sliderLabelPlayhead.innerHTML = 'song position: ' + song.bar;
        }
        requestAnimationFrame(render);
    }
};