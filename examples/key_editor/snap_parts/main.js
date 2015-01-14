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
        btnAddPart = document.getElementById('add_part'),

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
        divParts = document.getElementById('parts'),
        divPlayhead = document.getElementById('playhead'),

        allNotes = {}, // stores references to all midi notes
        allParts = {}, // stores references to all midi parts
        allNoteDivs = {}, // stores references to all divs that represent a midi note
        allPartDivs = {}, // stores references to all divs that represent a midi part

        selectSnap = document.getElementById('snap'),
        keyEditor,
        song,
        track;


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
            allNoteDivs[note.id].removeEventListener('mousedown', noteMouseDown);
            divNotes.removeChild(document.getElementById(note.id));
        });

        snapshot.notes.new.forEach(function(note){
            drawNote(note);
        });

        snapshot.notes.recorded.forEach(function(note){
            drawNote(note);
        });

        snapshot.notes.recording.forEach(function(note){
            updateElement(allNoteDivs[note.id], note.bbox);
        });

        // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
        snapshot.notes.changed.forEach(function(note){
            updateElement(allNoteDivs[note.id], note.bbox, 0);
        });


        // stateChanged arrays contain elements that have become active or inactive
        snapshot.notes.stateChanged.forEach(function(note){
            divNote = document.getElementById(note.id);
            if(note.part.mute === false){
                if(note.mute !== true){
                    if(note.active){
                        divNote.className = 'note note-active';
                    }else if(note.active === false){
                        divNote.className = 'note';
                    }
                }
            }
        });

        snapshot.parts.removed.forEach(function(part){
            allPartDivs[part.id].removeEventListener('mousedown', partMouseDown);
            divParts.removeChild(document.getElementById(part.id));
        });

        snapshot.parts.new.forEach(function(part){
            drawPart(part);
        });

        // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
        snapshot.parts.changed.forEach(function(part){
            updateElement(allPartDivs[part.id], part.bbox, 0);
        });


        // stateChanged arrays contain elements that have become active or inactive
        snapshot.parts.stateChanged.forEach(function(part){
            divPart = document.getElementById(part.id);
            if(part.mute !== true){
                if(part.active){
                    divPart.className = 'part part-active';
                }else if(part.active === false){
                    divPart.className = 'part';
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

        allNotes = {};
        allParts = {};
        allNoteDivs = {};
        allPartDivs = {};

        divParts.innerHTML = '';
        divNotes.innerHTML = '';
        divPitchLines.innerHTML = '';
        divBarLines.innerHTML = '';
        divBeatLines.innerHTML = '';
        divSixteenthLines.innerHTML = '';

        keyEditor.horizontalLine.reset();
        keyEditor.verticalLine.reset();
        keyEditor.noteIterator.reset();
        keyEditor.partIterator.reset();


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

        while(keyEditor.partIterator.hasNext()){
            drawPart(keyEditor.partIterator.next());
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

        // store note and div
        allNotes[note.id] = note;
        allNoteDivs[note.id] = divNote;
        divNote.addEventListener('mousedown', noteMouseDown, false);
        divNotes.appendChild(divNote);
    }


    function drawPart(part){
        var bbox = part.bbox,
            divPart = document.createElement('div');

        divPart.id = part.id;
        divPart.className = 'part';
        divPart.style.left = bbox.left  + 'px';
        divPart.style.top = bbox.top + 'px';
        divPart.style.width = bbox.width - 1 + 'px';
        divPart.style.height = bbox.height - 1 + 'px';

        // store part and div
        allParts[part.id] = part;
        allPartDivs[part.id] = divPart;
        divPart.addEventListener('mousedown', partMouseDown, false);
        divParts.appendChild(divPart);
    }


    function updateElement(element, bbox){
        element.style.left = bbox.x + 'px';
        element.style.top = bbox.y + 'px';
        element.style.width = bbox.width + 'px';
        element.style.height = bbox.height + 'px';
    }


    function partMouseDown(e){
        var part = allParts[e.target.id];
        if(e.ctrlKey){
            keyEditor.removePart(part);
        }else{
            keyEditor.startMovePart(part, e.pageX, e.pageY);
            document.addEventListener('mouseup', partMouseUp, false);
        }
    }


    function partMouseUp(){
        keyEditor.stopMovePart();
        document.removeEventListener('mouseup', partMouseUp);
    }


    function noteMouseDown(e){
        var note = allNotes[e.target.id];
        if(e.ctrlKey){
            keyEditor.removeNote(note);
        }else{
            keyEditor.startMoveNote(note, e.pageX, e.pageY);
            document.addEventListener('mouseup', noteMouseUp, false);
        }
    }


    function noteMouseUp(){
        keyEditor.stopMoveNote();
        document.removeEventListener('mouseup', noteMouseUp);
    }


    function getRandom(min, max, round){
        var r = Math.random() * (max - min) + min;
        if(round === true){
            return Math.round(r);
        }else{
            return r;
        }
    }


    function addPart(){
        var i,
            startPositions = [0, 60, 90, 120, 180],
            ticks = 0, //startPositions[getRandom(0, 4, true)],
            numNotes = getRandom(4, 8, true),
            spread = 5,
            basePitch = getRandom(keyEditor.lowestNote + spread, keyEditor.highestNote - spread, true),
            part = sequencer.createPart(),
            events = [],
            noteLength = song.ppq/2,
            pitch, velocity;

        for(i = 0; i < numNotes; i++){
            pitch = basePitch + getRandom(-spread, spread, true);
            velocity = getRandom(50, 127, true);
            events.push(sequencer.createMidiEvent(ticks, sequencer.NOTE_ON, pitch, velocity));
            ticks += noteLength;
            events.push(sequencer.createMidiEvent(ticks, sequencer.NOTE_OFF, pitch, 0));
            ticks += noteLength;
        }

        ticks = getRandom(0, song.durationTicks/2, true);
        part.addEvents(events);
        track.addPartAt(part, ['ticks', ticks]);
        song.update();
    }


    function init(){
        var c = divControls.getBoundingClientRect().height,
            w = window.innerWidth,
            h = window.innerHeight - c,
            timeEvents = [],
            event;

        divEditor.style.width = w + 'px';
        divEditor.style.height = h + 'px';

        track = sequencer.createTrack();

        timeEvents.push(sequencer.createMidiEvent(0, sequencer.TIME_SIGNATURE, 6, 8));
        timeEvents.push(sequencer.createMidiEvent(960 * 3, sequencer.TIME_SIGNATURE, 4, 4));

        song = sequencer.createSong({
            bars: 4,
            tracks: track,
            timeEvents: timeEvents,
            useMetronome: true
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
            lowestNote: 58,
            highestNote: 102,
            barsPerPage: 4
        });


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

        selectSnap.addEventListener('change', function(){
            keyEditor.setSnapX(selectSnap.options[selectSnap.selectedIndex].value);
        }, false);

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

        btnAddPart.addEventListener('click',function(){
            addPart();
        });

        window.addEventListener('resize', resize, false);
        enableGUI(true);

        selectSnap.selectedIndex = 3;
        event = document.createEvent('HTMLEvents');
        event.initEvent('change', false, false);
        selectSnap.dispatchEvent(event);

        draw();
        addPart();
        render();
    }

    enableGUI(false);
    sequencer.ready(init);
};