// create a global scope that allows us to share methods in different files
window.scope = {};

window.onload = function () {

    'use strict';

    var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        alert = window.alert,
        requestAnimationFrame = window.requestAnimationFrame,

        btnPlay = document.getElementById('play'),
        btnStop = document.getElementById('stop'),
        btnPrev = document.getElementById('prev'),
        btnNext = document.getElementById('next'),
        btnLast = document.getElementById('last'),
        btnFirst = document.getElementById('first'),

        sliderScale = document.getElementById('scale-slider'),
        labelSliderScale = document.getElementById('scale-label'),

        divControls = document.getElementById('controls'),
        divBarsBeats = document.getElementById('time-bars-beats'),
        divSeconds = document.getElementById('time-seconds'),
        divMouseX = document.getElementById('mouse-x'),
        divMouseY = document.getElementById('mouse-y'),
        divPageNumbers = document.getElementById('page-numbers'),

        divEditor = document.getElementById('editor'),
        divScore = document.getElementById('score'),
        divBarLines = document.getElementById('bar-lines'),
        divBeatLines = document.getElementById('beat-lines'),
        divSixteenthLines = document.getElementById('sixteenth-lines'),
        divPitchLines = document.getElementById('pitch-lines'),
        divNotes = document.getElementById('notes'),
        divPlayhead = document.getElementById('playhead'),

        keyEditor,
        song;


    function enableGUI(flag){
        var elements = document.querySelectorAll('input, select'),
            i, element, maxi = elements.length;

        for(i = 0; i < maxi; i++){
            element = elements[i];
            element.disabled = !flag;
        }
    }


    function render(){
        var snapshot = keyEditor.getSnapshot('key-editor'),
            divNote, divPart;

        divPlayhead.style.left = keyEditor.getPlayheadX() - 10 + 'px';
        divPageNumbers.innerHTML = 'page ' + keyEditor.currentPage + ' of ' + keyEditor.numPages;

        divBarsBeats.innerHTML = song.barsAsString;
        divSeconds.innerHTML = song.timeAsString;

        snapshot.notes.removed.forEach(function(note){
            note.div.removeEventListener('mousedown', noteMouseDown);
            divNotes.removeChild(document.getElementById(note.id));
        });

        snapshot.notes.new.forEach(function(note){
            drawNote(note);
        });

        snapshot.notes.recorded.forEach(function(note){
            drawNote(note);
        });

        snapshot.notes.recording.forEach(function(note){
            updateElement(note.div, note.bbox);
        });

        // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
        snapshot.notes.changed.forEach(function(note){
            updateElement(note.div, note.bbox, 0);
        });


        // stateChanged arrays contain elements that have become active or inactive
        snapshot.notes.stateChanged.forEach(function(note){
            divNote = document.getElementById(note.id);
            if(note.part.mute === false){
                if(note.active){
                    divNote.className = 'note note-active';
                }else if(note.active === false){
                    divNote.className = 'note';
                }
            }
        });


        if(snapshot.hasNewBars){
            // set the new width of the score
            divScore.style.width = snapshot.newWidth + 'px';

            // clear the horizontal lines because the lines have to be drawn longer
            divPitchLines.innerHTML = '';

            // reset the index of the iterator because we're starting from 0 again
            keyEditor.horizontalLine.reset();
            while(keyEditor.horizontalLine.hasNext('chromatic')){
                drawHorizontalLine(keyEditor.horizontalLine.next('chromatic'));
            }

            // the index of the vertical line iterator has already been set to the right index by the key editor
            // so only the extra barlines will be drawn
            while(keyEditor.verticalLine.hasNext('sixteenth')){
                drawVerticalLine(keyEditor.verticalLine.next('sixteenth'));
            }
        }

        requestAnimationFrame(render);
    }


    function resize(){
        var c = divControls.getBoundingClientRect().height,
            w = window.innerWidth,
            h = window.innerHeight - c;

        // tell the key editor that the viewport has canged, necessary for auto scroll during playback
        keyEditor.setViewport(w, h);
        divEditor.style.width = w + 'px';
        divEditor.style.height = h + 'px';
    }


    function draw(){

        divNotes.innerHTML = '';
        divPitchLines.innerHTML = '';
        divBarLines.innerHTML = '';
        divBeatLines.innerHTML = '';
        divSixteenthLines.innerHTML = '';

        keyEditor.horizontalLine.reset();
        keyEditor.verticalLine.reset();
        keyEditor.noteIterator.reset();

        divScore.style.width = keyEditor.width + 'px';

        while(keyEditor.horizontalLine.hasNext('chromatic')){
            drawHorizontalLine(keyEditor.horizontalLine.next('chromatic'));
        }

        while(keyEditor.verticalLine.hasNext('sixteenth')){
            drawVerticalLine(keyEditor.verticalLine.next('sixteenth'));
        }

        while(keyEditor.noteIterator.hasNext()){
            drawNote(keyEditor.noteIterator.next());
        }
    }


    function drawHorizontalLine(data){
        var divLine = document.createElement('div'),
            pitchHeight = keyEditor.pitchHeight;

        if(data.note.blackKey === true){
            divLine.className = 'pitch-line black-key';
        }else{
            divLine.className = 'pitch-line';
        }
        divLine.id = data.note.fullName;
        divLine.style.height = pitchHeight + 'px';
        divLine.style.top = data.y + 'px';
        divLine.y = data.y;
        divPitchLines.appendChild(divLine);
    }


    function drawVerticalLine(data){
        var type = data.type,
            divLine = document.createElement('div');

        divLine.id = data.position.barsAsString;
        divLine.className = data.type + '-line';
        divLine.style.left = data.x + 'px';
        divLine.style.width = '5px'; // if you make the with too small, the background image of sometimes disappears
        divLine.x = data.x;

        switch(type){
            case 'bar':
                divBarLines.appendChild(divLine);
                break;
            case 'beat':
                divBeatLines.appendChild(divLine);
                break;
            case 'sixteenth':
                divSixteenthLines.appendChild(divLine);
                break;
        }
    }


    function drawNote(note){
        var bbox = note.bbox,
            divNote = document.createElement('div');

        divNote.id = note.id;
        divNote.className = 'note';
        //divNote.style.backgroundColor = 'rgb(' + 0 + ',' + 127 + ',' + (note.velocity * 2) + ')';
        updateElement(divNote, bbox, 0);

        // link event to div and vice versa
        divNote.note = note;
        note.div = divNote;
        divNote.addEventListener('mousedown', noteMouseDown, false);
        divNotes.appendChild(divNote);
    }


    function updateElement(element, bbox){
        element.style.left = bbox.x + 'px';
        element.style.top = bbox.y + 'px';
        element.style.width = bbox.width + 'px';
        element.style.height = bbox.height + 'px';
    }


    function noteMouseDown(e){
        if(e.ctrlKey){
            keyEditor.removeNote(e.target.note);
        }else{
            keyEditor.startMoveNote(e.target, e.pageX, e.pageY);
            document.addEventListener('mouseup', noteMouseUp, false);
        }
    }


    function noteMouseUp(){
        keyEditor.stopMoveNote();
        document.removeEventListener('mouseup', noteMouseUp);
    }


    function init(){
        var c = divControls.getBoundingClientRect().height,
            w = window.innerWidth,
            h = window.innerHeight - c;

        divEditor.style.width = w + 'px';
        divEditor.style.height = h + 'px';

        song = sequencer.createSong(sequencer.getMidiFile('minute_waltz'));

        song.tracks.forEach(function(track){
            track.setInstrument('piano');
            track.monitor = true;
            track.setMidiInput('all');
        });

        song.addEventListener('play',function(){
            btnPlay.value = 'pause';
        });

        song.addEventListener('pause',function(){
            btnPlay.value = 'play';
        });

        song.addEventListener('stop',function(){
            btnPlay.value = 'play';
        });

        keyEditor = sequencer.createKeyEditor(song, {
            keyListener: true,
            viewportHeight: h,
            viewportWidth: w,
            lowestNote: 21,
            highestNote: 108,
            barsPerPage: 16
        });


        sliderScale.min = 1;// minimal 1 bar per page
        sliderScale.max = 64;// maximal 64 bars per page
        sliderScale.value = 16;// currently set to 16 bars per page
        sliderScale.step = 1;


        // listen for scale and draw events, a scale event is fired when you change the number of bars per page
        // a draw event is fired when you change the size of the viewport by resizing the browser window
        keyEditor.addEventListener('scale draw', function(){
            draw();
        });


        // listen for scroll events, the score automatically follows the song positon during playback: as soon as
        // the playhead moves off the right side of the screen, a scroll event is fired
        keyEditor.addEventListener('scroll', function(data){
            divEditor.scrollLeft = data.x;
        });


        // you can set the playhead at any position by clicking on the score
        divScore.addEventListener('mousedown', function(e){
            var className = e.target.className;
            if(className.indexOf('part') !== -1 || className.indexOf('note') !== -1){
                return;
            }
            keyEditor.setPlayheadToX(e.pageX);
            // you could also use:
            //song.setPlayhead('ticks', keyEditor.xToTicks(e.pageX));
        });


        // if you scroll the score by hand you must inform the key editor. necessary for calculating
        // the song position by x coordinate and the pitch by y coordinate
        divEditor.addEventListener('scroll',function(){
            keyEditor.updateScroll(divEditor.scrollLeft,divEditor.scrollTop);
        },false);


        divScore.addEventListener('mousemove',function(e){
            e.preventDefault();
            var x = e.pageX,
                y = e.pageY,
                pos = keyEditor.getPositionAt(x),
                part = keyEditor.selectedPart,
                note = keyEditor.selectedNote;

            // show the song position and pitch of the current mouse position; handy for debugging
            divMouseX.innerHTML = 'x ' + pos.barsAsString;
            divMouseY.innerHTML = 'y ' + keyEditor.getPitchAt(y).number;

            // move part or note if selected
            if(part !== undefined){
                keyEditor.movePart(x, y);
            }
            if(note !== undefined){
                keyEditor.moveNote(x, y);
            }
        },false);

        btnPlay.addEventListener('click',function(){
            song.pause();
        });

        btnStop.addEventListener('click',function(){
            song.stop();
        });

        btnNext.addEventListener('click',function(){
            keyEditor.scroll('>');
        });

        btnPrev.addEventListener('click',function(){
            keyEditor.scroll('<');
        });

        btnFirst.addEventListener('click',function(){
            keyEditor.scroll('<<');
        });

        btnLast.addEventListener('click',function(){
            keyEditor.scroll('>>');
        });

        sliderScale.addEventListener('change',function(e){
            var bpp =  parseFloat(e.target.value);
            labelSliderScale.innerHTML = '#bars ' + bpp;
            keyEditor.setBarsPerPage(bpp);
        },false);

        window.addEventListener('resize', resize, false);
        enableGUI(true);

        draw();
        render();
    }

    enableGUI(false);
    sequencer.addMidiFile({url: '../../../assets/midi/minute_waltz.mid'});
    sequencer.addAssetPack({url: '../../../assets/examples/asset_pack_basic.json'}, init);
};