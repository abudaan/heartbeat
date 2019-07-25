function keyEditor() {

  'use strict';

  var
    //private
    KeyEditor,

    updateDataKeys = 'newEvents newNotes newParts changedEvents changedNotes changedParts removedEvents removedNotes removedParts'.split(' '),

    // default values
    tickWidth = 0.1,
    pitchHeight = 10,
    barsPerPage = 4,
    snapValueX = 0, // means snaps is off -> ticks value do not get rounded
    //snapValueX = 1, // means snaps to all ticks
    snapValueY = 'chromatic',
    eventWidth = 2,

    ceil = Math.ceil,

    //import
    createIteratorFactory,
    getPosition,
    createPlayhead,
    getScaffoldingBars,
    typeString,
    objectToArray,
    arrayToObject,
    debug,
    round,
    floor,
    createNote,

    //public
    //getLines,
    //xToTicks,
    //yToPitch,

    //private
    setPageData,
    checkNextPage,
    checkScrollPosition,
    dispatchEvent,
    handleKeys;



  KeyEditor = function (song, config) {
    this.song = song;
    this.song.keyEditor = this;
    this.playhead = createPlayhead(this.song, 'barsbeats ticks millis', 'keyeditor');

    this.numBars = song.bars;
    this.newNumBars = this.numBars;
    this.eventListeners = {};
    this.interrupt = false;

    this.iteratorFactory = createIteratorFactory(this.song, this);
    this.verticalLine = this.iteratorFactory.createVerticalLineIterator(this);
    this.horizontalLine = this.iteratorFactory.createHorizontalLineIterator(this);
    this.eventIterator = this.iteratorFactory.createEventIterator(this);
    this.noteIterator = this.iteratorFactory.createNoteIterator(this);
    this.partIterator = this.iteratorFactory.createPartIterator(this);


    this.exactFitVertical = config.exactFitVertical || false;
    this.exactFitHorizontal = config.exactFitHorizontal || false;

    this.activeEvents = [];
    this.activeNotes = [];
    this.activeParts = [];

    this.newEvents = [];
    this.newNotes = [];
    this.newParts = [];

    this.changedEvents = [];
    this.changedNotes = [];
    this.changedParts = [];

    this.removedEvents = [];
    this.removedNotes = [];
    this.removedParts = [];

    this.recordedNotesObj = {};
    this.recordedEventsObj = {};

    this.snapshot = {
      activeEvents: this.activeEvents,
      activeNotes: this.activeNotes,
      activeParts: this.activeParts,

      newEvents: this.newEvents,
      newNotes: this.newNotes,
      newParts: this.newParts,

      changedEvents: this.changedEvents,
      changedNotes: this.changedNotes,
      changedParts: this.changedParts,

      removedEvents: this.removedEvents,
      removedNotes: this.removedNotes,
      removedParts: this.removedParts
    };


    if (config.paginate) {
      this.paginate = true;
      this.pageNo = 0;
      this.barsPerPage = config.barsPerPage;
      this.pageWidth = config.pageWidth;
      this.pageHeight = config.pageHeight;
      this.width = this.pageWidth;
      this.lowestNote = config.lowestNote || song.lowestNote;
      this.highestNote = config.highestNote || song.highestNote;
      this.pitchRange = this.highestNote - this.lowestNote;
      if (this.exactFitVertical) {
        this.pitchHeight = this.height / this.pitchRange;
        this.height = this.pageHeight;
      } else {
        this.pitchHeight = config.pitchHeight || pitchHeight;
        this.height = this.pitchHeight * this.pitchRange;
      }
      //this.startBar = 0;//make this configurable
      setPageData(this, 0);
      checkNextPage(this);

    } else {

      this.setStartPosition(config.startPosition || 1);
      this.setEndPosition(config.endPosition || song.bars + 1);
      this.numTicks = this.endTicks - this.startTicks;

      if (config.width) {
        this.width = config.width;
        this.tickWidth = this.width / this.numTicks;
      } else if (config.tickWidth) {
        this.tickWidth = config.tickWidth;
        this.width = this.numTicks * this.tickWidth;
        this.exactFitHorizontal = false;
      } else if (config.barsPerPage && config.viewportWidth) {
        //@TODO: add support for time measurement changes
        this.barsPerPage = config.barsPerPage;
        this.viewportWidth = config.viewportWidth;
        this.tickWidth = this.viewportWidth / (this.startPosition.ticksPerBar * this.barsPerPage);
        this.width = this.numTicks * this.tickWidth;
        this.scrollX = 0;
        this.scrollPosition = 0;
        this.viewportTicks = this.viewportWidth / this.tickWidth;
        this.maxScrollPosition = ceil(this.width / this.viewportWidth);
        this.scrollLimit = this.viewportWidth / this.tickWidth;
        checkScrollPosition(this);
        this.exactFitHorizontal = false;
      } else if (config.viewportWidth) {
        this.viewportWidth = this.width = config.viewportWidth;
        this.tickWidth = this.viewportWidth / this.numTicks;
        this.exactFitHorizontal = true;
      } else {
        this.tickWidth = tickWidth;
        this.width = this.numTicks * this.tickWidth;
        this.exactFitHorizontal = false;
      }


      this.lowestNote = config.lowestNote || song.lowestNote;
      this.highestNote = config.highestNote || song.highestNote;
      this.pitchRange = config.pitchRange || this.highestNote - this.lowestNote + 1;
      //console.log(this.pitchRange);

      if (config.height) {
        this.height = config.height;
        this.pitchHeight = this.height / this.pitchRange;
      } else if (config.pitchHeight) {
        this.pitchHeight = config.pitchHeight;
        this.height = this.pitchRange * this.pitchHeight;
        this.exactFitVertical = false;
      } else if (config.viewportHeight) {
        this.viewportHeight = this.height = config.viewportHeight;
        this.pitchHeight = this.viewportHeight / this.pitchRange;
        this.exactFitVertical = true;
      } else {
        this.pitchHeight = pitchHeight;
        this.height = this.pitchRange * this.pitchHeight;
        this.exactFitVertical = false;
      }

      // this.verticalLine.setStartPosition(this.startPosition);
      // this.verticalLine.setEndPosition(this.endPosition);
      //this.verticalLine.reset(this.startPosition, this.endPosition);
      //this.horizontalLine.reset();
      //this.eventIterator.reset();
      //this.noteIterator.reset();
      //this.partIterator.reset();
      //console.log(this.tickWidth,this.pitchHeight);
    }

    this.scrollX = 0;
    this.scrollY = 0;
    this.currentPage = 1;
    this.numPages = ceil(this.width / this.viewportWidth);

    this.snapValueX = config.snapX === undefined ? snapValueX : config.snapX;
    this.snapValueY = config.snapY === undefined ? snapValueY : config.snapY;
    this.setSnapX(this.snapValueX);
    this.setSnapY(this.snapValueY);

    //console.log(this.maxScrollPosition);
  };


  KeyEditor.prototype.setBarsPerPage = function (bbp) {
    this.interrupt = true;

    var tmp = round(this.scrollX / (this.viewportWidth / this.barsPerPage));
    this.barsPerPage = bbp;
    this.tickWidth = this.viewportWidth / (this.startPosition.ticksPerBar * this.barsPerPage);
    this.viewportTicks = this.viewportWidth / this.tickWidth;
    this.width = this.numTicks * this.tickWidth;
    this.verticalLine.reset();
    this.horizontalLine.reset();
    this.eventIterator.reset();
    this.partIterator.reset();
    this.scrollLimit = this.viewportWidth / this.tickWidth;
    this.maxScrollPosition = ceil(this.width / this.viewportWidth);
    this.snapWidth = this.tickWidth * this.snapTicks;

    this.numPages = ceil(this.numBars / this.barsPerPage);
    this.currentPage = floor(this.song.ticks / (this.barsPerPage * this.song.ticksPerBar)) + 1;

    dispatchEvent(this, 'scale', {});

    if (this.song.playing) {
      this.scrollPosition = floor(this.song.ticks / this.viewportTicks);
    } else {
      //console.log(tmp,this.scrollPosition);
      this.scrollPosition = ((this.viewportWidth / this.barsPerPage) * tmp) / this.viewportWidth;
      dispatchEvent(this, 'scroll', { x: (this.scrollPosition * this.viewportWidth) });
    }
    this.interrupt = false;
  };


  KeyEditor.prototype.setViewport = function (w, h) {
    var draw = false;

    if (this.barsPerPage && w !== this.viewportWidth) {
      //@TODO: add support for time measurement changes
      this.viewportWidth = w;
      this.tickWidth = this.viewportWidth / (this.startPosition.ticksPerBar * this.barsPerPage);
      this.viewportTicks = this.viewportWidth / this.tickWidth;
      this.width = this.numTicks * this.tickWidth;
      draw = true;
    } else if (this.exactFitHorizontal === true && w !== this.width) {
      this.viewportWidth = this.width = w;
      this.tickWidth = this.width / this.numTicks;
      draw = true;
    }

    if (this.exactFitVertical === true && h !== this.height) {
      this.viewportHeight = this.height = h;
      this.pitchHeight = this.height / this.pitchRange;
      draw = true;
    }

    if (draw) {
      this.verticalLine.reset();
      this.horizontalLine.reset();
      this.eventIterator.reset();
      this.noteIterator.reset();
      this.partIterator.reset();

      dispatchEvent(this, 'draw', {});
    }
  };


  KeyEditor.prototype.updateSong = function (data) {
    this.iteratorFactory.updateSong();

    var key, i = 0, j, k, arr, tmp;

    for (i = updateDataKeys.length - 1; i >= 0; i--) {
      key = updateDataKeys[i];
      switch (key) {
        case 'newNotes':
        case 'changedNotes':
          arr = data[key];
          for (j = arr.length - 1; j >= 0; j--) {
            tmp = arr[j];
            tmp.bbox = this.getNoteRect(tmp);
          }
          break;

        case 'newParts':
        case 'changedParts':
          arr = data[key];
          for (j = arr.length - 1; j >= 0; j--) {
            tmp = arr[j];
            tmp.bbox = this.getPartRect(tmp);
          }
          break;
      }
    }

    /*
            this.newNumBars = data.numBars;
            // delete numBars otherwise the for loop below doesn't work anymore
            delete data.numBars;
    
            for(key in data){
                if(data.hasOwnProperty(key)){
                    arr = data[key];
                    for(j = arr.length - 1; j >= 0; j--){
                        tmp = arr[j];
                        k = floor(i/3);
                        //console.log(i,k);
                        switch(k){
                            case 0: // event arrays
                                //console.log(k,i);
                                //tmp.bbox = getEventRect(tmp);
                                // arr[j] = {
                                //     event: tmp
                                // }
                                break;
                            case 1: // note arrays
                                //console.log(k,i);
                                if(tmp.bbox)
                                console.log(1,tmp.bbox.x)
                                tmp.bbox = this.getNoteRect(tmp);
                                console.log(2,tmp.bbox.x)
                                // arr[j] = {
                                //     note: tmp,
                                //     bbox: this.getNoteRect(tmp)
                                // }
                                break;
                            case 2: // part arrays
                                //console.log(k,i);
                                //console.log(tmp);
                                tmp.bbox = this.getPartRect(tmp);
                                // arr[j] = {
                                //     part: tmp,
                                //     bbox: this.getPartRect(tmp)
                                // }
                                break;
                        }
                    }
                    i++;
                }
            }
    */
    this.newNumBars = data.numBars;

    this.newEvents = this.newEvents.concat(data.newEvents);
    this.changedEvents = this.changedEvents.concat(data.changedEvents);
    this.removedEvents = this.removedEvents.concat(data.removedEvents);
    this.removedEventsObj = arrayToObject(this.removedEvents, 'id');

    this.newNotes = this.newNotes.concat(data.newNotes);
    this.changedNotes = this.changedNotes.concat(data.changedNotes);
    this.removedNotes = this.removedNotes.concat(data.removedNotes);
    this.removedNotesObj = arrayToObject(this.removedNotes, 'id');

    this.newParts = this.newParts.concat(data.newParts);
    this.changedParts = this.changedParts.concat(data.changedParts);
    this.removedParts = this.removedParts.concat(data.removedParts);
    this.removedPartsObj = arrayToObject(this.removedParts, 'id');
  };


  KeyEditor.prototype.setStartPosition = function (pos) {
    if (typeString(pos) !== 'array') {
      pos = ['barsandbeats', pos, 1, 1, 0];
    }

    this.startPosition = getPosition(this.song, pos);
    this.startTicks = this.startPosition.ticks;
    this.startMillis = this.startPosition.millis;
    //console.log('start',pos,this.startTicks);
  };


  KeyEditor.prototype.setEndPosition = function (pos) {
    if (typeString(pos) !== 'array') {
      pos = ['barsandbeats', pos, 1, 1, 0];
    }

    this.endPosition = getPosition(this.song, pos);
    this.endTicks = this.endPosition.ticks;
    this.endMillis = this.endPosition.millis;
    //console.log('end',pos,this.endTicks,this.endPosition);
  };


  KeyEditor.prototype.addEventListener = function (id, cb) {
    var ids = id.split(' '),
      tmp,
      editor = this,
      eventId;

    ids.forEach(function (id) {

      tmp = editor.eventListeners[id];

      if (tmp === undefined) {
        editor.eventListeners[id] = [];
        tmp = editor.eventListeners[id];
      }

      eventId = id + '-' + tmp.length;
      tmp.push(cb);
    });
  };


  KeyEditor.prototype.nextPage = function () {
    setPageData(this, this.startBar + this.barsPerPage);
    dispatchEvent(this, 'pagechange', { pageNo: this.pageNo, lastPage: this.lastPage });
  };


  KeyEditor.prototype.prevPage = function () {
    setPageData(this, this.startBar - this.barsPerPage);
    dispatchEvent(this, 'pagechange', { pageNo: this.pageNo, lastPage: this.lastPage });
  };


  KeyEditor.prototype.gotoPage = function (n) {
    console.warn('ooops, not implemented yet!');
    return;
    // n = n - 1;
    // if (n < 0 || n > this.lastPage) {
    //     return;
    // }
    // this.pageNo = n;
    // dispatchEvent(this, 'pagechange', { pageNo: this.pageNo, lastPage: this.lastPage });
    // setPageData(this, this.pageNo);
  };


  KeyEditor.prototype.scroll = function (action) {

    //this.scrollPosition = floor(this.scrollX/this.viewportWidth);
    var x,
      tmp = round(this.scrollX / (this.viewportWidth / this.barsPerPage));

    this.scrollPosition = ((this.viewportWidth / this.barsPerPage) * tmp) / this.viewportWidth;

    switch (action) {
      case '>':
        this.scrollPosition += 1;
        this.scrollPosition = this.scrollPosition > this.maxScrollPosition ? this.maxScrollPosition : this.scrollPosition;
        break;
      case '>>':
        this.scrollPosition = this.maxScrollPosition;
        break;
      case '<':
        this.scrollPosition -= 1;
        this.scrollPosition = this.scrollPosition < 0 ? 0 : this.scrollPosition;
        break;
      case '<<':
        this.scrollPosition = 0;
        break;
      default:
        if (isNaN(action)) {
          return;
        }
        this.scrollPosition = parseInt(action);
    }

    x = this.scrollPosition * this.viewportWidth;
    this.scrollLimit = (x + this.viewportWidth) / this.tickWidth;
    this.currentPage = ceil(x / this.viewportWidth) + 1;
    if (this.currentPage === 0) {
      this.currentPage = 1;
    } else if (this.currentPage > this.maxScrollPosition) {
      this.currentPage = this.maxScrollPosition;
    }
    //console.log('bar',(this.scrollPosition * this.barsPerPage),'scroll',this.scrollPosition);
    dispatchEvent(this, 'scroll', { x: x });
  };


  KeyEditor.prototype.updateScroll = function (scrollX, scrollY) {
    this.scrollX = scrollX;
    this.scrollY = scrollY;
    this.scrollLimit = (scrollX + this.viewportWidth) / this.tickWidth;
  };


  KeyEditor.prototype.getEventRect = function (event) {
    //console.log(note.number);
    var
      x = this.ticksToX(event.ticks - this.startTicks, false),
      y = this.pitchToY(event.number),
      w = eventWidth * this.tickWidth,
      h = this.pitchHeight;

    return {
      x: x,
      y: y,
      width: w,
      height: h,
      top: y,
      left: x,
      bottom: y + h,
      right: x + w
    };
  };


  KeyEditor.prototype.getNoteRect = function (note) {
    //console.log(note.number);
    var
      x = this.ticksToX(note.ticks - this.startTicks, false),//(note.ticks - this.startTicks) * this.tickWidth,
      y = this.pitchToY(note.number),
      w = note.durationTicks * this.tickWidth,
      h = this.pitchHeight,
      start, end, diff;

    if (note.endless) {
      w = (this.song.ticks - note.noteOn.ticks) * this.tickWidth;
    }

    ///*
    if (this.paginate) {

      start = note.ticks;
      end = note.noteOff.ticks;

      if (start < this.startTicks) {
        diff = this.startTicks - start;
        start = start + diff - this.startTicks;
        x = start * this.tickWidth;

        end = end > this.endTicks ? this.endTicks : end;
        w = (end - this.startTicks) * this.tickWidth;
      } else {
        return false;
      }
    }

    //*/

    return {
      x: x,
      y: y,
      width: w,
      height: h,
      top: y,
      left: x,
      bottom: y + h,
      right: x + w
    };
  };


  KeyEditor.prototype.getPartRect = function (part) {
    var stats = part.getStats('noteNumber all'),
      //firstEvent = part.events[0],
      //lastEvent = part.events[part.events.length - 1],
      bbox = {
        // left: (firstEvent.ticks - this.startTicks) * this.tickWidth,
        // right: (lastEvent.ticks - this.startTicks) * this.tickWidth,
        // top: this.height - ((stats.max - this.lowestNote + 1) * this.pitchHeight),
        // bottom: this.height - ((stats.min - this.lowestNote + 1) * this.pitchHeight) + this.pitchHeight,
        top: this.pitchToY(stats.max),// - this.pitchHeight,
        bottom: this.pitchToY(stats.min) + this.pitchHeight,
        left: this.ticksToX(part.start.ticks - this.startTicks, false),
        right: this.ticksToX(part.end.ticks - this.startTicks, false),
        //left: this.ticksToX(part.events[0].ticks, false),
        //right: this.ticksToX(part.events[part.events.length - 1].ticks, false)
      };

    //console.log(stats.min, stats.max);

    bbox.x = bbox.left;
    bbox.y = bbox.top;
    bbox.width = bbox.right - bbox.left;
    bbox.height = bbox.bottom - bbox.top;

    part.bbox = bbox;
    part.stats = stats;
    //console.log(part.id,stats,bbox);
    return bbox;
  };


  KeyEditor.prototype.getBBox = function (arg) {
    var type, data;
    if (typeString(arg) === 'string') {
      switch (arg.substring(0, 1)) {
        case 'E':
          type = 'event';
          if (event.type === 144 && event.endEvent !== undefined) {
            data = this.song.findEvent('id = ' + arg);
          } else {
            console.error('argument not supported, please check documentation');
            return;
          }
          break;
        case 'P':
          type = 'part';
          data = this.song.getPart(arg);
          break;
        case 'T':
          type = 'track';
          break;
        default:
          console.error('argument not supported, please check documentation');
          return;
      }
    } else {
      switch (arg.className) {
        case 'AudioEvent':
          type = 'audio';
          break;
        case 'MidiEvent':
          type = 'event';
          break;
        case 'Part':
          type = 'part';
          break;
        case 'Track':
          type = 'track';
          break;
        default:
          console.error('argument not supported, please check documentation');
          return;
      }
    }

    if (data === undefined) {
      console.error(arg, 'could not be found');
      return;
    }

    switch (type) {
      case 'event':
        return this.getNoteRect(data);
      //break;
      case 'part':
        return this.getPartRect(data);
      //break;
    }
  };


  KeyEditor.prototype.startMoveNote = function (note, x, y) {
    if (note.className !== 'MidiNote') {
      if (sequencer.debug >= sequencer.WARN) {
        console.warn(note, 'is not a MidiNote');
      }
      return;
    }
    //sequencer.unscheduleEvent(note);
    this.selectedNote = note;
    this.gripX = x - this.selectedNote.bbox.x;
  };


  KeyEditor.prototype.stopMoveNote = function () {
    this.selectedNote = undefined;
  };


  KeyEditor.prototype.moveNote = function (x, y) {
    if (this.selectedNote === undefined) {
      return;
    }

    var
      newPitch = this.yToPitch(y).number,
      oldPitch = this.selectedNote.pitch,
      newTicks = this.xToTicks(x - this.gripX),
      oldTicks = this.selectedNote.ticks,
      part = this.selectedNote.part,
      update = false;

    //console.log(newTicks, oldTicks, this.gripX, x);

    if (newPitch !== oldPitch) {
      part.transposeNote(this.selectedNote, newPitch - oldPitch);
      update = true;
    }

    if (newTicks !== oldTicks) {
      part.moveNote(this.selectedNote, newTicks - oldTicks);
      update = true;
    }

    if (update === true) {
      this.song.update();
    }
  };


  KeyEditor.prototype.startMovePart = function (part, x, y) {
    if (part.className !== 'Part') {
      if (sequencer.debug >= sequencer.WARN) {
        console.warn(part, 'is not a Part');
      }
      return;
    }
    this.selectedPart = part;
    this.selectedPart.pitch = this.yToPitch(y).number;
    this.gripX = x - this.selectedPart.bbox.x;
  };


  KeyEditor.prototype.stopMovePart = function () {
    this.selectedPart = undefined;
  };


  KeyEditor.prototype.movePart = function (x, y, autoUpdate) {
    // console.log(this.selectedPart);
    if (this.selectedPart === undefined) {
      return;
    }
    if (typeof autoUpdate === 'undefined') {
      autoUpdate = true;
    }
    // console.log(autoUpdate);

    var
      newPitch = this.yToPitch(y).number,
      oldPitch = this.selectedPart.pitch,
      newTicks = this.xToTicks(x - this.gripX),
      oldTicks = this.selectedPart.ticks,
      update = false;

    if (newPitch !== oldPitch) {
      this.selectedPart.track.transposePart(this.selectedPart, newPitch - oldPitch);
      this.selectedPart.pitch = newPitch;
      update = true;
    }


    if (newTicks !== oldTicks) {
      this.selectedPart.track.movePart(this.selectedPart, newTicks - oldTicks);
      update = true;
    }

    if (update === true && autoUpdate === true) {
      this.song.update();
    }
  };


  KeyEditor.prototype.getTicksAt = KeyEditor.prototype.xToTicks = function (x, snap) {
    var ticks = ((x + this.scrollX) / this.width) * this.numTicks;
    //console.log(this.scrollX,this.width,this.numTicks,ticks);
    if (snap !== false && this.snapTicks !== 0) {
      //ticks = floor(ticks/this.snapTicks) * this.snapTicks;
      ticks = round(ticks / this.snapTicks) * this.snapTicks;
    }
    //console.log(ticks, this.snapTicks);
    return ticks;
  };


  KeyEditor.prototype.getPitchAt = KeyEditor.prototype.yToPitch = function (y) {
    //var note = this.highestNote - floor(((y + this.scrollY)/this.height) * this.pitchRange);
    var note = this.highestNote - round(((y + this.scrollY) / this.height) * this.pitchRange);
    note = createNote(note);
    return note;
  };


  KeyEditor.prototype.getXAt = KeyEditor.prototype.ticksToX = function (ticks, snap) {
    // var p = ticks/this.numTicks,
    //     x = (p * this.width) - this.scrollX;
    var x = (ticks - this.startTicks) * this.tickWidth;
    if (snap !== false && this.snapWidth !== 0) {
      //x = (floor(x/this.snapWidth) * this.snapWidth);
      x = (round(x / this.snapWidth) * this.snapWidth);
    }
    return x;
  };


  KeyEditor.prototype.getYAt = KeyEditor.prototype.pitchToY = function (noteNumber) {
    var y = this.height - ((noteNumber - this.lowestNote + 1) * this.pitchHeight);
    return y;
  };


  KeyEditor.prototype.getPositionAt = function (x) {
    var ticks = this.getTicksAt(x);
    // console.time('get position')
    // var position = getPosition(this.song,['ticks',ticks]);
    // console.timeEnd('get position')
    // return position;
    //console.time('get position')
    this.playhead.set('ticks', ticks, false);
    //console.timeEnd('get position')
    return this.playhead.get();
  };


  KeyEditor.prototype.getPlayheadX = function (compensateForScroll) {
    var x = ((this.song.ticks / this.song.durationTicks) * this.width);
    //var x = ((this.song.millis/this.song.durationMillis) * this.width);
    //var x = (this.song.percentage * this.width);
    x = compensateForScroll === true ? x - this.scrollX : x;
    return x;
  };


  KeyEditor.prototype.setPlayheadToX = function (x) {
    var ticks = this.xToTicks(x, false);
    this.song.setPlayhead('ticks', ticks);
  };

  KeyEditor.prototype.getPlayheadPosition = function (compensateForScroll) {
    //return (sequencer.percentage * this.width);// - this.scrollX;
    //return ((sequencer.millis/song.durationMillis) * this.width);// - this.scrollX;
    //var x = ((this.song.millis/this.song.durationMillis) * this.width);
    // change to ticks to make tempo changes visible by a faster moving playhead
    var x = ((this.song.ticks / this.song.durationTicks) * this.width);
    x = compensateForScroll === true ? x - this.scrollX : x;
    return x;
  };


  KeyEditor.prototype.setPlayheadPosition = function (type, value) {
    //console.log(this.scrollX,value, this.scrollX + value);
    var ticks;
    switch (type) {
      case 'x':
        ticks = this.xToTicks(value, false);
        break;
      case 'ticks':
        ticks = value;
        break;
      case 'millis':
        ticks = this.playhead.set('millis', value).ticks;
        break;
      case 'barsbeats':
      case 'barsandbeats':
        ticks = getPosition(this.song, ['barsbeats', value]).ticks;
        break;
    }
    this.song.setPlayhead('ticks', ticks);
  };


  KeyEditor.prototype.getEventAt = function (x, y) {
    var position = this.getSongPosition(x),
      pitch = this.getPitchAt(y);
  };


  KeyEditor.prototype.getEventsInRect = function (x, y, w, h) {
    var startPos = this.getSongPosition(x),
      endPos = this.getSongPosition(x + w),
      startPitch = this.getPitchAt(y + h),
      endPitch = this.getPitchAt(y);

  };


  KeyEditor.prototype.getNoteAt = function (x, y) {
    var position = this.getSongPosition(x),
      pitch = this.getPitchAt(y);
  };


  KeyEditor.prototype.getNotesInRect = function (x, y, w, h) {
    var startPos = this.getSongPosition(x),
      endPos = this.getSongPosition(x + w),
      startPitch = this.getPitchAt(y + h),
      endPitch = this.getPitchAt(y);
  };


  // takes x,y and returns snapped x,y
  KeyEditor.prototype.snap = function (x, y) {
    return {
      x: this.snapX(x),
      y: this.snapY(y)
    };
  };


  // takes x returns snapped x
  KeyEditor.prototype.snapX = function (x) {
    //return floor((x + this.scrollX)/this.snapWidth) * this.snapWidth;
    return round((x + this.scrollX) / this.snapWidth) * this.snapWidth;

  };


  // takes y returns snapped y
  KeyEditor.prototype.snapY = function (y) {
    //return floor((y + this.scrollY)/this.snapHeight) * this.snapHeight;
    return round((y + this.scrollY) / this.snapHeight) * this.snapHeight;
  };


  KeyEditor.prototype.setSnapX = function (snapX) {
    if (snapX === undefined) {
      return;
    }
    //console.log('in', snapX);
    // 4 -> 1, 8 -> 0.5 16 -> 0.25
    var beatLength = 4 / this.song.denominator;

    if (snapX === 'off') {
      this.snapTicks = 0;
    } else if (snapX === 'tick') {
      this.snapTicks = 1;
    } else if (snapX === 'beat') {
      // TODO: dependent on current time signature!
      this.snapTicks = this.song.ppq * beatLength;
    } else if (snapX === 'bar') {
      // TODO: dependent on current time signature!
      this.snapTicks = (this.song.ppq * this.song.nominator) * beatLength;
    } else if (isNaN(snapX) && snapX.indexOf('ticks') !== -1) {
      this.snapTicks = snapX.replace(/ticks/, '');
      if (isNaN(this.snapTicks)) {
        this.snapTicks = this.song.ppq / 4;// sixteenth note
      } else {
        this.snapTicks = parseInt(this.snapTicks);
      }
    } else {
      if (isNaN(snapX) || snapX === 0) {
        // by default snap is off
        snapX = 0;
        this.snapTicks = 0;
      } else {
        snapX = parseInt(snapX);
        this.snapTicks = (4 / snapX) * this.song.ppq;
      }
    }

    //console.log(snapX,this.snapTicks, beatLength);
    this.snapValueX = snapX;
    this.snapWidth = this.tickWidth * this.snapTicks;
  };


  KeyEditor.prototype.setSnapY = function (snapY) {
    if (snapY === undefined) {
      return;
    }
    this.snapValueY = snapY;
    //todo: add other scales then chromatic
    this.snapHeight = this.pitchHeight;
  };


  KeyEditor.prototype.removeNote = function (note) {
    //note.part.removeNote(note);
    //console.log(note.id);
    note.part.removeEvents(note.noteOn, note.noteOff);
    this.song.update();
  };


  KeyEditor.prototype.removePart = function (part) {
    part.track.removePart(part);
    this.song.update();
  };


  KeyEditor.prototype.prepareForRecording = function () {
    this.recordedEventsObj = {};
    this.recordedNotesObj = {};
  };


  KeyEditor.prototype.getSnapshot = function () {

    var activeEventsObj,
      activeNotesObj,
      activePartsObj,

      recordedNotesSong,
      //recordingNotesSong,
      recordedEventsSong,

      nonActiveEvents = [],
      nonActiveNotes = [],
      nonActiveParts = [],

      prevActiveEvents = [].concat(this.activeEvents),
      prevActiveNotes = [].concat(this.activeNotes),
      prevActiveParts = [].concat(this.activeParts),

      recordedEvents = [],
      recordedNotes = [],
      recordingNotes = [],

      //prevRemovedNotes = [].concat(this.removedNotes),

      s, e, n, p, i, j, tmp, length,
      startBar, endBar;

    this.activeEvents = [];
    this.activeNotes = [];
    this.activeParts = [];

    this.activeStateChangedEvents = [];
    this.activeStateChangedNotes = [];
    this.activeStateChangedParts = [];

    //if(this.song.bars > this.numBars){
    if (this.newNumBars !== this.numBars) {
      startBar = this.numBars;
      endBar = this.song.lastBar + 1;
      //console.log(startBar,endBar)
      //this.verticalLine.setStartPosition(getPosition(song, ['barsbeats', startBar, 1, 1, 0]));
      //this.verticalLine.setEndPosition(getPosition(song, ['barsbeats', endBar, 1, 1, 0]));
      this.endPosition = getPosition(this.song, ['barsbeats', endBar, 1, 1, 0, true]);
      this.verticalLine.reset(getPosition(this.song, ['barsbeats', startBar, 1, 1, 0, true]), this.endPosition);
      this.numBars = this.song.bars;

      //console.log(this.song.lastBar, this.endPosition.barsAsString);

      this.endTicks = this.endPosition.ticks;
      this.numTicks = this.song.durationTicks;
      this.width = this.numTicks * this.tickWidth;
      //console.log('new width', this.width, this.numTicks, this.tickWidth);
      //console.log('song has gotten longer boy!', this.song.bars, this.newNumBars, this.numBars, this.width);
      this.maxScrollPosition = ceil(this.width / this.viewportWidth);
      //this.numPages = ceil(this.width/this.viewportWidth);
      this.numPages = ceil(this.numBars / this.barsPerPage);
    }



    activeEventsObj = this.song.activeEvents;
    for (i in activeEventsObj) {
      if (activeEventsObj.hasOwnProperty(i)) {
        tmp = activeEventsObj[i];
        this.activeEvents.push(tmp);
        if (tmp.active !== true) {
          tmp.active = true;
          this.activeStateChangedEvents.push(tmp);
        }
      }
    }

    activeNotesObj = this.song.activeNotes;
    for (i in activeNotesObj) {
      if (activeNotesObj.hasOwnProperty(i)) {
        tmp = activeNotesObj[i];
        this.activeNotes.push(tmp);
        //console.log(tmp, tmp.active);
        if (tmp.active !== true) {
          tmp.active = true;
          this.activeStateChangedNotes.push(tmp);
        }
      }
    }

    activePartsObj = this.song.activeParts;
    for (i in activePartsObj) {
      if (activePartsObj.hasOwnProperty(i)) {
        tmp = activePartsObj[i];
        this.activeParts.push(tmp);
        if (tmp.active !== true) {
          tmp.active = true;
          this.activeStateChangedParts.push(tmp);
        }
      }
    }

    // fixing issue #4
    recordedEventsSong = this.song.recordedEvents;
    if (recordedEventsSong) {
      length = recordedEventsSong.length;
      for (i = 0; i < length; i++) {
        tmp = recordedEventsSong[i];
        if (this.recordedEventsObj[tmp.id] === undefined) {
          tmp.bbox = this.getEventRect(tmp);
          recordedEvents.push(tmp);
          this.recordedEventsObj[tmp.id] = tmp;
        }
      }
    }

    // fixing issue #4
    recordedNotesSong = this.song.recordedNotes;
    if (recordedNotesSong) {
      length = recordedNotesSong.length;
      for (i = 0; i < length; i++) {
        tmp = recordedNotesSong[i];
        if (this.recordedNotesObj[tmp.id] === undefined) {
          this.recordedNotesObj[tmp.id] = tmp;
          tmp.bbox = this.getNoteRect(tmp);
          recordedNotes.push(tmp);
          //console.log('recordedNotes', tmp);
        } else if (tmp.endless === true) {
          tmp.bbox = this.getNoteRect(tmp);
          recordingNotes.push(tmp);
          //console.log('endless1', tmp);
        } else if (tmp.endless === false) {
          tmp.bbox = this.getNoteRect(tmp);
          recordingNotes.push(tmp);
          //console.log('endless2', tmp);
          tmp.endless = undefined;
        }
        //console.log(tmp.bbox.width);
      }
    }
    /*
            recordingNotesObj = this.song.recordingNotes;
            for(i in recordingNotesObj){
                if(recordingNotesObj.hasOwnProperty(i)){
                    tmp = recordingNotesObj[i];
                    tmp.bbox = this.getNoteRect(tmp);
                    recordingNotes.push(tmp);
                }
            }
    */

    for (i = prevActiveEvents.length - 1; i >= 0; i--) {
      tmp = prevActiveEvents[i];
      if (tmp === undefined) {
        console.warn('event is undefined');
        continue;
      }
      if (activeEventsObj[tmp.id] === undefined) {
        nonActiveEvents.push(tmp);
        if (tmp.active !== false) {
          tmp.active = false;
          this.activeStateChangedEvents.push(tmp);
        }
      }
    }

    for (i = prevActiveNotes.length - 1; i >= 0; i--) {
      tmp = prevActiveNotes[i];
      if (tmp === undefined) {
        console.warn('note is undefined');
        continue;
      }
      if (activeNotesObj[tmp.id] === undefined) {
        nonActiveNotes.push(tmp);
        if (tmp.active !== false) {
          tmp.active = false;
          this.activeStateChangedNotes.push(tmp);
        }
      }
    }

    for (i = prevActiveParts.length - 1; i >= 0; i--) {
      tmp = prevActiveParts[i];
      if (tmp === undefined) {
        console.warn('part is undefined');
        continue;
      }
      if (activePartsObj[tmp.id] === undefined) {
        nonActiveParts.push(tmp);
        if (tmp.active !== false) {
          tmp.active = false;
          this.activeStateChangedParts.push(tmp);
        }
      }
    }

    if (this.song.playing) {
      //            this.currentPage = floor(sequencer.ticks / this.viewportTicks) + 1;
      this.currentPage = floor(this.song.ticks / (this.barsPerPage * this.song.ticksPerBar)) + 1;
    }

    /*
    
            tmp = this.song.parts;
            n = false;
            // check for empty parts and remove them -> @TODO: this should be done in track and/or part!
            for(i = tmp.length - 1; i >= 0; i--){
                p = tmp[i];
                console.log(p.keepWhenEmpty);
                if(p.keepWhenEmpty === true){
                    continue;
                }
                if(p.events.length === 0){
                    //console.log('empty part!');
                    p.track.removePart(p);
                    n = true;
                }
            }
            if(n){
                this.song.update();
            }
    */

    s = {

      events: {
        active: this.activeEvents,
        inActive: this.nonActiveEvents,
        recorded: recordedEvents,
        new: this.newEvents,
        changed: this.changedEvents,
        removed: this.removedEvents,
        stateChanged: this.activeStateChangedEvents
      },

      notes: {
        active: this.activeNotes,
        inActive: nonActiveNotes,
        recorded: recordedNotes,
        recording: recordingNotes,
        new: this.newNotes,
        changed: this.changedNotes,
        removed: this.removedNotes,
        stateChanged: this.activeStateChangedNotes
      },

      parts: {
        active: this.activeParts,
        inActive: nonActiveParts,
        new: this.newParts,
        changed: this.changedParts,
        removed: this.removedParts,
        stateChanged: this.activeStateChangedParts

      },


      hasNewBars: startBar !== endBar,
      newWidth: this.width,

      pageNo: this.currentPage,
      lastPage: this.numPages
      //newWidth: song.durationTicks * this.tickWidth

      // hasNewBars: function(){
      //     if(startBar === endBar){
      //         return false;
      //     }
      // }
    };

    this.newEvents = [];
    this.changedEvents = [];
    this.removedEvents = [];

    this.newNotes = [];
    this.changedNotes = [];
    this.removedNotes = [];

    this.newParts = [];
    this.changedParts = [];
    this.removedParts = [];

    /*
            tmp = this.song.parts;
            n = false;
    
            // check for empty parts and remove them -> @TODO: this should be done in track and/or part!
            for(i = tmp.length - 1; i >= 0; i--){
                p = tmp[i];
                if(p.keepWhenEmpty === true){
                    continue;
                }
                if(p.events.length === 0){
                    //console.log('empty part!');
                    p.track.removePart(p);
                    n = true;
                }
            }
            if(n){
                this.song.update();
            }
    */

    return s;
  };


  // flipping pages

  setPageData = function (editor, startBar) {
    //editor.pageNo = no;
    editor.numTicks = 0;

    editor.startBar = startBar > 0 ? startBar : 0;
    editor.startBar = editor.startBar > editor.numBars - editor.barsPerPage ? editor.numBars - editor.barsPerPage : editor.startBar;
    editor.endBar = startBar + editor.barsPerPage;
    editor.endBar = editor.endBar > editor.numBars ? editor.numBars : editor.endBar;
    editor.endBar = editor.endBar < editor.barsPerPage ? editor.barsPerPage : editor.endBar;

    console.log(startBar, editor.startBar, editor.endBar, editor.numBars, editor.numBars - editor.barsPerPage);
    var i;

    for (i = editor.startBar; i < editor.endBar; i++) {
      editor.numTicks += editor.bars[i].ticksPerBar;
    }
    editor.tickWidth = editor.pageWidth / editor.numTicks;

    editor.startPosition = editor.bars[editor.startBar];
    editor.endPosition = editor.bars[editor.endBar];
    editor.startTicks = editor.startPosition.ticks;
    editor.endTicks = editor.endPosition.ticks;

    editor.verticalLine.reset();
    editor.horizontalLine.reset();
    editor.eventIterator.reset();
    //console.log('nextPage',editor.startPosition,editor.endPosition);
  };


  checkNextPage = function (editor) {
    if (editor.song.playing() && editor.song.ticks >= editor.endTicks) {
      //console.log('nextpage');
      editor.nextPage();
      //dispatchEvent(this, 'pagechange', {pageNo: this.pageNo, lastPage: this.lastPage});
    }
    requestAnimationFrame(function () {
      checkNextPage(editor);
    });
  };


  checkScrollPosition = function (editor) {
    //console.log(editor.song.ticks,editor.scrollLimit,interrupt);
    if (editor.song.playing && editor.interrupt === false) {
      if (editor.song.ticks >= editor.scrollLimit) {
        dispatchEvent(editor, 'scroll', { x: editor.scrollX + editor.viewportWidth });
        editor.scrollLimit += (editor.viewportWidth / editor.tickWidth);
        //editor.currentPage++;
      } else {
        var x = (floor(editor.song.ticks / editor.viewportTicks) * editor.viewportTicks) * editor.tickWidth;
        if (editor.scrollX !== x) {
          dispatchEvent(editor, 'scroll', { x: x });
        }
      }
    }
    requestAnimationFrame(function () {
      checkScrollPosition(editor);
    });
  };


  dispatchEvent = function (editor, id, data) {
    //console.log(id,eventListeners);
    var listeners = editor.eventListeners[id];
    if (listeners) {
      listeners.forEach(function (cb) {
        cb(data);
      });
    }
  };


  handleKeys = function (editor) {
    var p = editor.selectedPart,
      n = editor.selectedNote;

    if (p !== undefined) {
      p.track.removePart(p);
      this.song.update();
    } else if (n !== undefined) {
      n.part.removeNote(n);
      this.song.update();
    }
  };


  sequencer.createKeyEditor = function (song, config) {
    return new KeyEditor(song, config);
  };


  sequencer.protectedScope.addInitMethod(function () {
    getPosition = sequencer.protectedScope.getPosition;
    createPlayhead = sequencer.protectedScope.createPlayhead;
    createNote = sequencer.createNote;
    debug = sequencer.debug;
    floor = sequencer.protectedScope.floor;
    round = sequencer.protectedScope.round;
    typeString = sequencer.protectedScope.typeString;
    objectToArray = sequencer.protectedScope.objectToArray;
    arrayToObject = sequencer.protectedScope.arrayToObject;
    getScaffoldingBars = sequencer.protectedScope.getScaffoldingBars;
    createIteratorFactory = sequencer.protectedScope.createKeyEditorIteratorFactory;
  });

}
