function keyEditorIteratorFactory() {

  'use strict';

  var
    minWidthSixteenth = 0.042,
    minWidthBeat = 0.02,
    /*
            events,
            numEvents,
            notes,
            numNotes,
            parts,
            numParts,
    
            song,
            editor,
            position,
    */
    // import
    createPlayhead, // defined in playhead.js
    createNote; // defined in note.js

  //public
  /*
          create,
          updateSong,
          createVerticalLineIterator,
          createHorizontalLineIterator,
          createEventIterator,
          createNoteIterator,
          createPartIterator;
  */

  function Factory(song, editor) {
    this.song = song;
    this.editor = editor;
    //console.log(this.editor);
    //this.position = createPlayhead(this.song, 'barsbeats ticks millis', 'iterators');
    this.position = createPlayhead(this.song, 'all', 'iterators');
    this.updateSong();
  }

  /*
      create = function(s, e){
          song = s;
          editor = e;
          updateSong();
          position = createPlayhead(song, 'barsbeats ticks millis', 'iterators');
          return {
              updateSong: updateSong,
              createVerticalLineIterator: createVerticalLineIterator,
              createHorizontalLineIterator: createHorizontalLineIterator,
              createEventIterator: createEventIterator,
              createNoteIterator: createNoteIterator,
              createPartIterator: createPartIterator
          };
      };
  */

  Factory.prototype.updateSong = function () {
    this.events = this.song.events;
    this.numEvents = this.events.length;
    this.notes = this.song.notes;
    this.numNotes = this.notes.length;
    this.parts = this.song.parts;
    this.numParts = this.parts.length;
    this.position.updateSong();
  };


  Factory.prototype.createVerticalLineIterator = function () {
    var supportedTypes = 'bar beat sixteenth',
      lineType,
      numTicks = {},
      tickWidth,
      offset,
      type,
      ticks,
      endTicks,
      bar,
      beat,
      sixteenth,
      nominator,
      numSixteenth,
      startPosition,
      endPosition,
      editor = this.editor,
      position = this.position,
      // widthBar,
      // widthBeat,
      // widthSixteenth,
      data, next, hasNext, reset, getData, setType;
    //setStartPosition, setEndPosition;


    getData = function () {
      //console.log('ticks',ticks);
      data = position.update('ticks', ticks);
      numTicks.bar = data.ticksPerBar;
      numTicks.beat = data.ticksPerBeat;
      numTicks.sixteenth = data.ticksPerSixteenth;
      nominator = data.nominator;
      numSixteenth = data.numSixteenth;
      //console.log(numTicks,nominator,numSixteenth);
      //console.log(ticks, data);
    };

    next = function (t) {
      if (t) {
        type = t;
        // if (tickWidth < minWidthBeat) {
        //     type = 'bar';
        // } else if (tickWidth < minWidthSixteenth) {
        //     type = 'beat';
        // }
      } else {
        if (tickWidth < minWidthBeat) {
          type = 'bar';
        } else if (tickWidth < minWidthSixteenth) {
          type = 'beat';
        }
      }

      switch (type) {
        case 'sixteenth':
          lineType = 'sixteenth';
          sixteenth++;
          if (sixteenth > numSixteenth) {
            lineType = 'beat';
            sixteenth = 1;
            beat++;
            if (beat > nominator) {
              lineType = 'bar';
              beat = 1;
              bar++;
            }
          }
          break;
        case 'beat':
          lineType = 'beat';
          sixteenth = 1;
          beat++;
          if (beat > nominator) {
            lineType = 'bar';
            beat = 1;
            bar++;
          }
          break;
        case 'bar':
          lineType = 'bar';
          sixteenth = 1;
          beat = 1;
          bar++;
          break;
      }
      ticks += numTicks[type];
      getData();
      if (ticks > endTicks) {
        return false;
      }
      //console.log(bar,beat,sixteenth);
      return {
        x: (ticks * tickWidth) - offset,
        bar: bar,
        beat: beat,
        sixteenth: sixteenth,
        // widthBar: widthBar,
        // widthBeat: widthBeat,
        // widthSixteenth: widthSixteenth,
        type: lineType,
        position: data
      };
    };

    hasNext = function (t) {
      var diffTicks = endTicks - ticks,
        result = false;

      if (t) {
        type = t;
        if (tickWidth < minWidthBeat) {
          type = 'bar';
        } else if (tickWidth < minWidthSixteenth) {
          type = 'beat';
        }
      }

      switch (type) {
        case 'bar':
          result = diffTicks >= numTicks[type];
          break;
        case 'beat':
          result = diffTicks >= numTicks[type];
          break;
        case 'sixteenth':
          result = diffTicks >= numTicks[type];
          break;
      }
      //console.log(ticks,endTicks,diffTicks);
      return result;
    };

    reset = function (start, end) {
      startPosition = start || editor.startPosition;
      endPosition = end || editor.endPosition;
      ticks = startPosition.ticks;
      bar = startPosition.bar;
      beat = startPosition.beat;
      sixteenth = startPosition.sixteenth;
      //console.log(startPosition.barsAsString);
      //console.log(endPosition.barsAsString);
      //console.log(ticks,bar,beat,sixteenth);
      endTicks = endPosition.ticks;
      tickWidth = editor.tickWidth;
      offset = 0;//ticks * this.editor.tickWidth;
      position.set('ticks', ticks);
      //console.log(tickWidth,offset);
      if (tickWidth < minWidthBeat) {
        type = 'bar';
      } else if (tickWidth < minWidthSixteenth) {
        type = 'beat';
      }
      getData();
      // widthBar = numTicks.bar * this.editor.tickWidth;
      // widthBeat = numTicks.beat * this.editor.tickWidth;
      // widthSixteenth = numTicks.sixteenth * this.editor.tickWidth;
    };
    /*
            setStartPosition = function(position){
                startPosition = position;
            };
    
            setEndPosition = function(position){
                endPosition = position;
            };
    */
    setType = function (t) {
      type = t;
      if (tickWidth < minWidthBeat) {
        type = 'bar';
      } else if (tickWidth < minWidthSixteenth) {
        type = 'beat';
      }
    };

    //console.log('ver');
    return {
      next: next,
      reset: reset,
      hasNext: hasNext,
      setType: setType
      //setStartPosition: setStartPosition,
      //setEndPosition: setEndPosition,
    };
  };


  Factory.prototype.createHorizontalLineIterator = function () {
    var index,
      pitch,
      range,
      pitchHeight,
      data = {},
      editor = this.editor,
      next, hasNext, reset;

    next = function (type) {
      data = {
        note: createNote(pitch),
        y: (index * pitchHeight)
      };
      pitch--;
      index++;
      return data;
    };

    hasNext = function (type) {
      var result = false;
      switch (type) {
        case 'chromatic':
          result = index < range;
          break;
      }
      return result;
    };

    reset = function () {
      index = 0;
      pitch = editor.highestNote;
      range = editor.pitchRange;
      pitchHeight = editor.pitchHeight;
      //console.log('reset',pitch,range,pitchHeight);
    };

    //console.log('hor');
    return {
      next: next,
      reset: reset,
      hasNext: hasNext
    };
  };


  Factory.prototype.createEventIterator = function () {
    var startTicks,
      endTicks,
      hasNextCalled,
      index,
      nextEvent,
      editor = this.editor,
      position = this.position,
      events = this.events,
      numEvents = this.numEvents,
      types = '',
      next, hasNext, reset, setTypes;

    hasNext = function (t) {
      types = t || types;
      hasNextCalled = true;
      index++;
      if (index === numEvents) {
        return false;
      }

      nextEvent = events[index];
      if (types === '') {
        return nextEvent.ticks <= endTicks;
      }
      return false;
    };

    next = function (t) {
      types = t || types;
      if (!hasNextCalled) {
        hasNext(types);
      }
      hasNextCalled = false;
      return nextEvent;
    };

    reset = function () {
      var event;
      startTicks = editor.startTicks;
      endTicks = editor.endTicks;
      hasNextCalled = false;
      if (editor.paginate === true && sequencer.isPlaying() === true) {
        return;
      }
      /*
      for(index = 0; index < numEvents; index++){
          event = events[index];
          if(event.ticks >= startTicks){
              break;
          }
      }
      index--;
      */
      index = position.get().eventIndex - 2;
      //console.log(events);
      //console.log('ke',sequencer.isPlaying(),index,sequencer.eventIndex);
    };

    setTypes = function () {
      var args = Array.prototype.slice.call(arguments);
      args.forEach(function (type) {
        types += type + ' ';
      });
    };

    return {
      next: next,
      reset: reset,
      hasNext: hasNext,
      setTypes: setTypes
    };
  };


  Factory.prototype.createNoteIterator = function () {
    var startTicks,
      endTicks,
      hasNextCalled,
      index,
      newNote,
      nextNote,
      editor = this.editor,
      song = this.song,
      notes = this.notes,
      numNotes = this.numNotes,
      types = '',
      next, hasNext, reset, setTypes;

    hasNext = function (t) {
      types = t || types;
      hasNextCalled = true;
      index++;
      if (index === this.numNotes) {
        return false;
      }

      newNote = false;

      for (; index < numNotes; index++) {
        nextNote = notes[index];
        //console.log(nextNote);

        if (nextNote.ticks >= endTicks) {
          //console.log('skip',nextNote.ticks);
          break;
        }

        if (editor.paginate) {
          // show note that has started on previous page
          if (nextNote.ticks < startTicks && nextNote.noteOff.ticks > startTicks) {
            newNote = true;
          } else if (nextNote.ticks < endTicks) {
            newNote = true;
          }
          if (newNote) {
            break;
          }
        } else {
          newNote = nextNote.ticks <= endTicks;
          //console.log(newNote, nextNote.ticks, nextNote.noteOff.ticks, startTicks, endTicks);
          if (newNote) {
            break;
          }
        }

        //console.log(types.indexOf(nextEvent.type) !== -1,types,nextEvent.type,nextEvent.ticks,endTicks);
      }
      //console.log(index,nextEvent.ticks,endTicks,newEvent);
      return newNote;
    };

    next = function (t) {
      types = t || types;
      if (!hasNextCalled) {
        hasNext(types);
      }
      hasNextCalled = false;
      //return nextEvent;
      nextNote.bbox = editor.getNoteRect(nextNote);
      return nextNote;
    };

    reset = function () {
      var note;
      startTicks = editor.startTicks;
      endTicks = editor.endTicks;
      notes = song.notes;
      numNotes = song.numNotes;
      //console.log(startTicks, endTicks);
      hasNextCalled = false;
      if (editor.paginate === true && sequencer.isPlaying() === true) {
        return;
      }

      for (index = 0; index < numNotes; index++) {
        note = notes[index];
        //console.log(note, note.ticks, startTicks);
        if (note.ticks >= startTicks) {
          break;
        }
      }
      index--;
    };

    return {
      next: next,
      reset: reset,
      hasNext: hasNext
    };
  };


  Factory.prototype.createPartIterator = function () {
    var index,
      max,
      part,
      data = {},
      editor = this.editor,
      song = this.song,
      parts = this.parts,
      next, hasNext, reset;

    next = function (type) {
      part = parts[index++];
      part.bbox = editor.getPartRect(part);
      return part;
    };

    hasNext = function (type) {
      return index < max;
    };

    reset = function () {
      parts = song.parts;
      max = song.numParts;
      index = 0;
    };

    return {
      next: next,
      reset: reset,
      hasNext: hasNext
    };
  };


  sequencer.protectedScope.createKeyEditorIteratorFactory = function (song, editor) {
    return new Factory(song, editor);
  };


  sequencer.protectedScope.addInitMethod(function () {
    createNote = sequencer.createNote;
    createPlayhead = sequencer.protectedScope.createPlayhead;
  });

}