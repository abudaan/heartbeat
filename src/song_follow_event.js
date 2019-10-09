function songFollowEvent() {

  'use strict';

  var
    //import
    findEvent, // → defined in find_position.js
    typeString, // → defined in util.js
    getPosition, // → defined in get_position.js
    midiEventNameByNumber, // → defined in midi_event_names.js
    midiEventNumberByName, // → defined in midi_event_names.js

    listenerIndex = 0, // global id that increases per created eventlistener

    supportedTimeEvents = {

      //bars and beats
      bar: 1,
      beat: 1,
      sixteenth: 1,
      tick: 0, // the granularity of requestAnimationFrame is too coarse for tick values
      ticks: 1, // from start of song
      barsbeats: 1, // as number (will be interpreted as bar) or as array of numbers: [bar,beat,sixteenth,tick]
      barsandbeats: 1, // same as above

      //time
      hour: 1,
      minute: 1,
      second: 1,
      millisecond: 0, // the granularity of requestAnimationFrame is too coarse for millisecond values
      millis: 1, // from start of song
      time: 1 // as number (will be interpreted as second) or as array of numbers: [hour,minute,second,millisecond]
    },

    supportedOperators = '= == === > >= < <= != !== %=', //'= == === > >= < <= != !== *= ^= ~= $=',
    //supportedOperatorsRegex = new RegExp(' ' + supportedOperators.replace(/\s+/g,' | ').replace(/\*/,'\\*') + ' '),
    supportedOperatorsRegex = new RegExp(' ' + supportedOperators.replace(/\s+/g, ' | ') + ' '),


    //private
    getEvents,
    checkOperatorConflict,

    //private class, only accessible in Song
    FollowEvent;


  FollowEvent = function (song) {
    this.song = song;

    this.allListenersById = {};
    this.allListenersByType = {};
    this.searchPatterns = [];

    this.eventListenersBySearchstring = {};
    this.positionListenersBySearchstring = {};

    this.allListenersByType = {
      'event': {
        // all events that are registered as event, keys are the event ids, values are array with listener ids
        'instance': {},
        // all events that are registered after a search action, for instance: addEventListener('event', 'velocity > 50', callback)
        'searchstring': {}
      },
      'position': {
        // millis, ticks, time, barsbeats
        'ticks': [],
        // every bar, beat, sixteenth, hour, minute, second
        'repetitive': {},
        // on single conditional values of bar, beat, sixteenth, hour, minute, second, e.g. bar > 3, bar %= 2, bar === 3
        'conditional_simple': {},
        // on conditional values of bar, beat, sixteenth, hour, minute, second, e.g. bar > 3 < 10
        'conditional_complex': {}
      }
    };
  };


  FollowEvent.prototype.updateSong = function () {

    //adjust all event listeners based on registered events and events found by a searchstring

    var i, j, e, eventId, events, tmp, data,
      listenerIds = [], listeners,
      listener, listenerId;

    listeners = this.allListenersByType.event.instance;
    // loop over event ids
    for (eventId in listeners) {
      if (listeners.hasOwnProperty(eventId)) {
        // check if event has been removed
        if (this.song.eventsById[eventId] === undefined) {
          // get all listeners that are registered to this event and delete them
          listenerIds = listeners[eventId];
          for (i = listenerIds.length - 1; i >= 0; i--) {
            listenerId = listenerIds[i];
            delete this.allListenersById[listenerId];
          }
          //delete listeners[eventId];
          delete this.allListenersByType.event.instance[eventId];
        }
      }
    }

    //console.log(listeners);

    // remove all listeners that are currently bound to found events
    listeners = this.allListenersByType.event.searchstring;
    listenerIds = [];
    for (eventId in listeners) {
      // step 1: collect all ids of listeners
      if (listeners.hasOwnProperty(eventId)) {
        listenerIds = listenerIds.concat(listeners[eventId]);
      }
    }
    // step 2: delete the listeners
    for (i = listenerIds.length - 1; i >= 0; i--) {
      delete this.allListenersById[listenerIds[i]];
    }

    // all event listeners have been removed, now create a new object and run search string on updated song
    this.allListenersByType.event.searchstring = {};
    tmp = this.allListenersByType.event.searchstring;

    //@TODO: this can't possibly work!! -> but it actually does..

    for (i = this.searchPatterns.length - 1; i >= 0; i--) {
      data = this.searchPatterns[i];
      events = findEvent(this.song, data.searchstring);
      //console.log(data, events);

      //add listeners for both note on and note off and ignore the other event types
      if (tmp.type === 'note') {
        events = findEvent(events, 'type = NOTE_ON OR type = NOTE_OFF');
      }

      for (j = events.length - 1; j >= 0; j--) {
        e = events[j];

        listenerId = 'event_' + listenerIndex++;
        listener = {
          id: listenerId,
          event: e,
          type: data.type,
          subtype: data.subtype,
          callback: data.callback
        };

        this.allListenersById[listenerId] = listener;

        if (tmp[e.id] === undefined) {
          tmp[e.id] = [];
        }
        tmp[e.id].push(listenerId);
        //listenerIds.push(listenerId);
      }
    }

    //console.log(allListenersByType.event.searchstring);
    //console.log(allListenersByType.event.instance);
    //console.log(allListenersById);
  };


  FollowEvent.prototype.update = function () {
    var
      i,
      position = this.song,
      ticks = position.ticks,
      events = [],
      numEvents,
      event;

    //events = this.song.playhead.activeEvents;
    events = this.song.playhead.collectedEvents;
    //      events = this.song.playhead.changedEvents; -> do something with a snapshot here
    numEvents = events.length;
    /*
            if(numEvents !== undefined && numEvents > 0){
                console.log(numEvents, position.barsAsString, this.bar, this.beat);
            }
    */
    //call event listeners registered to specific midi events
    for (i = 0; i < numEvents; i++) {
      event = events[i];
      //console.log(event, event.ticks);
      this.callEventListeners(event.id, event);
    }

    this.callListenersPositionTicks(ticks);

    if (position.bar !== this.bar) {
      this.bar = position.bar;
      this.callListenersPositionRepetitive('bar');
      this.callListenersPositionConditionalSimple('bar', this.bar);
      this.callListenersPositionConditionalComplex('bar', this.bar);
    }

    if (position.beat !== this.beat) {
      this.beat = position.beat;
      this.callListenersPositionRepetitive('beat');
      this.callListenersPositionConditionalSimple('beat', this.beat);
      this.callListenersPositionConditionalComplex('beat', this.beat);
    }

    if (position.sixteenth !== this.sixteenth) {
      this.sixteenth = position.sixteenth;
      this.callListenersPositionRepetitive('sixteenth');
      this.callListenersPositionConditionalSimple('sixteenth', this.sixteenth);
      this.callListenersPositionConditionalComplex('sixteenth', this.sixteenth);
    }

    if (position.hour !== this.hour) {
      this.hour = position.hour;
      this.callListenersPositionRepetitive('hour');
      this.callListenersPositionConditionalSimple('hour', this.hour);
      this.callListenersPositionConditionalComplex('hour', this.hour);
    }

    if (position.minute !== this.minute) {
      this.minute = position.minute;
      this.callListenersPositionRepetitive('minute');
      this.callListenersPositionConditionalSimple('minute', this.minute);
      this.callListenersPositionConditionalComplex('minute', this.minute);
    }

    if (position.second !== this.second) {
      this.second = position.second;
      this.callListenersPositionRepetitive('second');
      this.callListenersPositionConditionalSimple('second', this.second);
      this.callListenersPositionConditionalComplex('second', this.second);
    }
  };


  // call callbacks that are bound to a specific event
  FollowEvent.prototype.callEventListeners = function (eventId, event) {
    var i, id, tmp,
      listener,
      listenerIds = [];

    tmp = this.allListenersByType.event.instance;
    if (tmp[eventId]) {
      listenerIds = listenerIds.concat(tmp[eventId]);
    }

    tmp = this.allListenersByType.event.searchstring;
    if (tmp[eventId]) {
      listenerIds = listenerIds.concat(tmp[eventId]);
    }

    if (listenerIds.length > 0) {
      //console.log(listenerIds, event.id, event.ticks);
    }

    for (i = listenerIds.length - 1; i >= 0; i--) {
      id = listenerIds[i];
      listener = this.allListenersById[id];
      if (listener.called !== true) {
        listener.called = true;
        listener.callback(event);
        //console.log('called', event.id)
      }
    }
  };


  // for instance: addEventListener('position', 'bar') -> call callback every bar
  FollowEvent.prototype.callListenersPositionRepetitive = function (positionType) {
    var listener,
      listenerIds = this.allListenersByType.position.repetitive[positionType],
      me = this;

    if (listenerIds) {
      listenerIds.forEach(function (id) {
        listener = me.allListenersById[id];
        listener.callback(listener.searchstring);
      });
    }
  };


  // can be repetitive or fire once:
  // addEventListener('position', 'beat === 2') -> call callback every second beat
  // addEventListener('position', 'bar === 2') -> call callback at start of bar 2
  FollowEvent.prototype.callListenersPositionConditionalSimple = function (positionType, value) {
    var listener,
      data,
      operator,
      call = false,
      listenerIds = this.allListenersByType.position.conditional_simple[positionType],
      me = this;

    //console.log(positionType, listenerIds);

    if (listenerIds) {
      listenerIds.forEach(function (id) {
        // -> check condition
        listener = me.allListenersById[id];
        data = listener.data;
        operator = listener.operator;

        switch (operator) {
          case '>':
            call = value > data;
            break;
          case '<':
            call = value < data;
            break;
          case '%=':
            //call = (value + 1) % (data + 1) === 0;
            call = value % data === 0;
            break;
          case '!=':
          case '!==':
            call = value !== data;
            break;
          case '===':
            call = value === data;
            break;
        }

        if (call === true) {
          listener.callback(listener.searchstring);
        }
      });
    }
  };


  // for instance: addEventListener('position', 'bar > 2 < 7') -> call callback every bar from bar 3 to 6
  FollowEvent.prototype.callListenersPositionConditionalComplex = function (positionType, value) {
    var listener,
      value1,
      value2,
      operator1,
      operator2,
      listenerIds = this.allListenersByType.position.conditional_complex[positionType],
      me = this;

    if (listenerIds) {
      listenerIds.forEach(function (id) {
        // -> check condition(s)
        listener = me.allListenersById[id];
        value1 = listener.value1;
        value2 = listener.value2;
        operator1 = listener.operator1;
        operator2 = listener.operator2;
        if (operator1 === '<') {
          if (value < value1 || value > value2) {
            listener.callback(listener.searchstring);
          }
        } else if (operator1 === '>') {
          //console.log(value1,value2,value,operator1,operator2);
          if (value > value1 && value < value2) {
            listener.callback(listener.searchstring);
          }
        }
      });
    }
  };


  FollowEvent.prototype.callListenersPositionTicks = function (ticks) {
    var tmp = this.allListenersByType.position.ticks,
      i, maxi = tmp.length,
      listener;

    for (i = 0; i < maxi; i++) {
      listener = this.allListenersById[tmp[i]];
      //console.log(listener,ticks);
      if (ticks >= listener.ticks && !listener.called) {
        listener.callback(listener.searchstring);
        listener.called = true;
      }
    }
  };


  /*
      event types: event, note or position

      event → when the playhead passes the event

      note → both on the note on and the note off event, the events array may be an array of notes or an array of events

      position
          'bar' -> every bar
          'bar = 3' -> start of bar 3
          'bar > 3 < 7' -> every bar after bar 3 and before bar 7

          'beat' -> every beat
          'beat = 3' -> start of beat 3
          'beat > 3' -> every beat after beat 3

          etc.


      addEventListener('event',eventsArray,callback)
      addEventListener('event',findEvent(eventsArray,'type = NOTE_ON'),callback)

      addEventListener('note',eventsArray,callback)
      addEventListener('note',findEvent(eventsArray,'velocity = 90'),callback)

      addEventListener('event','bar > 5', callback)
      addEventListener('note','id = 45654544345',callback)

      addEventListener('position','bar',callback)
      addEventListener('position','bar > 5 < 17',callback)
      addEventListener('position','beat',callback)

      addEventListener('position','second',callback)
      addEventListener('position','second > 5',callback)

      addEventListener('position','barsbeats = 1,2,0,0',callback)


  */

  FollowEvent.prototype.addEventListener = function (type, data, callback) {
    var i, events, event, storeArray, tmp, subtype,
      listener, listenerId, listenerIds = [],
      dataType = typeString(data);

    //console.log(type,data,callback);
    //console.log(dataType, data);

    if (typeString(callback) !== 'function') {
      console.error(callback, 'is not a function; please provide a function for callback');
      return -1;
    }


    if (type === 'position') {
      listenerId = this.addPositionEventListener(data, callback);
      //console.log(allListenersByType, allListenersById);
      return listenerId;
    }


    if (dataType === 'string') {
      events = findEvent(this.song, data);
      // store the search string so we can run it again after the song has changed
      this.searchPatterns.push({
        searchstring: data,
        callback: callback,
        type: 'event',
        subtype: 'searchstring'
      });
      //console.log(data, events);

      if (events.length === 0) {
        return -1;
      }
      subtype = 'searchstring';
      storeArray = this.allListenersByType.event.searchstring;
      this.eventListenersBySearchstring[data] = tmp = [];
    } else {
      events = getEvents(type, data);
      if (events === -1) {
        return -1;
      }
      subtype = 'instance';
      storeArray = this.allListenersByType.event.instance;
    }


    //add listeners for both note on and note off and ignore the other event types
    if (type === 'note') {
      events = findEvent(events, 'type = NOTE_ON OR type = NOTE_OFF');
    }

    for (i = events.length - 1; i >= 0; i--) {
      event = events[i];
      listenerId = 'event_' + listenerIndex++;
      listener = {
        id: listenerId,
        event: event,
        type: type,
        subtype: subtype,
        callback: callback
      };

      //allListeners.push(listener);
      this.allListenersById[listenerId] = listener;

      if (storeArray[event.id] === undefined) {
        storeArray[event.id] = [];
      }
      storeArray[event.id].push(listenerId);
      listenerIds.push(listenerId);

      if (subtype === 'searchstring') {
        tmp.push(listenerId);
      }
    }
    //console.log(this.allListenersById, this.allListenersByType);

    if (subtype === 'searchstring' || dataType === 'array' || type === 'note') {
      return listenerIds;
    } else {
      //console.log('num listeners:', listenerIds.length);
      return listenerIds[0];
    }
  };


  /*

      'bar'; -> repetitive
      'bar == 3'; -> fire once
      'bar < 3 > 5'; -> conditionally repetitive
      'bar = 3 AND beat > 1' -> not supported here! (doesn't make sense, use events or position instead)

      - check if has valid operators
      - some types need an operator -> filter
      - check values that the operator has to act upon
      - split into repetitive and one-shot listeners

  */
  FollowEvent.prototype.addPositionEventListener = function (data, callback) {
    var tmp,
      listenerId, listener,
      millis,
      searchString = data.split(/[\s+]/g),
      len = searchString.length,
      type = searchString[0],
      operator1 = searchString[1],
      value1 = searchString[2],
      operator2 = searchString[3],
      value2 = searchString[4],
      value1Type = typeString(value1);
    //hasOperator = supportedOperatorsRegex.test(data);

    //console.log(data, searchString, len);
    //console.log(type, value1, operator1, value2, operator2);

    if (len !== 1 && len !== 3 && len !== 5) {
      console.error('invalid search string, please consult documentation');
      return false;
    }
    /*
            //split position data into an array -> is now done in find_event.js -> not anymore ;)
            if(value1 && value1.indexOf(',') !== -1){
                value1 = value1.split(',');
            }
    
            if(value2 && value2.indexOf(',') !== -1){
                value2 = value2.split(',');
            }
    */

    if (supportedTimeEvents[type] !== 1) {
      console.error(type, 'is not a supported event id, please consult documentation');
      return -1;
    }

    if (operator1 === '=' || operator1 === '==') {
      operator1 = '===';
    }


    // check values per type

    switch (type) {
      // these type can only fire once
      case 'barsbeats':
      case 'barsandbeats':
      case 'time':
      //case 'musical_time':
      //case 'linear_time':
      case 'ticks':
      case 'millis':
        if (operator1 === undefined || operator1 !== '===') {
          console.error(type, 'can only be used conditionally with the operators \'===\', \'==\' or \'=\'');
          return -1;
        }
        // if(isNaN(value1) && typeString(value1) !== 'array'){
        //  console.error('please provide a number or an array of numbers');
        //  return -1;
        // }
        if (operator2) {
          console.warn('this position event type can only be used with a single condition, ignoring second condition');
        }
        break;

      // these type fire repeatedly or once
      case 'bar': // -> fired once if used with === operator
      case 'beat':
      case 'sixteenth':
      //case 'tick':
      case 'hour': // -> fired once if used with === operator
      case 'minute':
      case 'second':
        //case 'millisecond':

        if (value1 && isNaN(value1)) {
          console.error('please provide a number');
          return -1;
        }
        if (value2 && isNaN(value2)) {
          console.error('please provide a number');
          return -1;
        }
        break;
    }


    // check operators

    if (operator1 && supportedOperators.indexOf(operator1) === -1) {
      console.error(operator1, 'is not a supported operator, please use any of', supportedOperators);
      return -1;
    }

    if (operator1 && value1 === undefined) {
      console.error('operator without value');
      return;
    }

    if (operator2 && supportedOperators.indexOf(operator1) === -1) {
      console.error(operator2, 'is not a supported operator, please use any of', supportedOperators);
      return -1;
    }

    if (operator2 && value2 === undefined) {
      console.error('operator without value');
      return;
    }

    if (operator1 && operator2 && checkOperatorConflict(operator1, operator2) === false) {
      console.error('you can\'t use ' + operator1 + ' together with ' + operator2);
      return -1;
    }


    // check callback

    if (typeString(callback) !== 'function') {
      console.error(callback, 'is not a function; please provide a function for callback');
      return -1;
    }


    // simplify searchstring and adjust values

    switch (type) {

      // event types that fire repeatedly or once

      case 'bar':
      case 'beat':
      case 'sixteenth':
        // make zero based
        value1 = value1 - 0;
        value2 = value2 - 0;
      //case 'tick':
      case 'hour':
      case 'minute':
      case 'second':
        //case 'millisecond':
        // make zero based
        value1 = value1 - 0;
        value2 = value2 - 0;

        // convert <= to < and >= to > to make it easier
        if (operator1) {
          if (operator1 === '<=') {
            value1++;
            operator1 = '<';
          } else if (operator1 === '>=') {
            value1--;
            operator1 = '>';
          }
        }

        if (operator2) {
          if (operator2 === '<=') {
            value2++;
            operator2 = '<';
          } else if (operator2 === '>=') {
            value2--;
            operator2 = '>';
          }
        }

        break;


      // event types that fire only once, these get all converted to type 'ticks'

      case 'ticks':
        // we already have the position value in ticks
        value1 = value1 - 0;
        break;


      case 'barsbeats':
      case 'barsandbeats':
        //case 'musical_time':

        // convert position value to ticks
        if (!isNaN(value1)) {
          // only a single number is provided, we consider it to be the bar number
          value1 = getPosition(this.song, ['barsbeats', value1, 1, 1, 0]).ticks;
        } else if (value1Type === 'string') {
          // a full barsandbeats array is provided: bar, beat, sixteenth, ticks
          value1 = value1.replace(/[\[\]\s]/g, '');
          value1 = value1.split(',');
          value1 = getPosition(this.song, ['barsbeats', value1[0], value1[1] || 1, value1[2] || 1, value1[3] || 0]).ticks;
          /*
                          }else if(value1Type === 'array'){
                              // a full barsandbeats array is provided: bar, beat, sixteenth, ticks
                              value1 = getPosition(this.song, ['barsbeats', value1[0], value1[1], value1[2], value1[3]]).ticks;
          */
        } else {
          console.error('please provide a number or an array of numbers');
        }
        type = 'ticks';
        break;


      case 'millis':
        // convert position value to ticks
        value1 = getPosition(this.song, ['millis', value1]).ticks;
        type = 'ticks';
        break;


      case 'time':
        //case 'linear_time':
        // convert position value to ticks
        if (!isNaN(value1)) {
          // a single number is provided, we treat this as the value for minutes
          millis = value1 * 60 * 1000; //seconds
          value1 = getPosition(this.song, ['millis', millis]).ticks;
        } else if (value1Type === 'string') {
          // a full barsandbeats array is provided: bar, beat, sixteenth, ticks
          value1 = value1.replace(/[\[\]\s]/g, '');
          console.log(value1);
          value1 = value1.split(',');
          if (value1.length === 1) {
            millis = value1[0] * 60 * 1000;
            value1 = getPosition(this.song, ['millis', millis]).ticks;
          } else {
            value1 = getPosition(this.song, ['time', value1[0], value1[1], value1[2], value1[3]]).ticks;
          }
          /*
                          }else if(value1Type === 'array'){
                              // a full time array is provided: hours, minutes, seconds, millis
                              value1 = getPosition(this.song, ['time', value1[0], value1[1], value1[2], value1[3]]).ticks;
          */
        } else {
          console.error('please provide a number or an array of numbers');
        }
        console.log(value1);
        type = 'ticks';
        break;
    }


    listenerId = 'position_' + listenerIndex++;

    //console.log(value1,value2);

    if (type === 'ticks') {
      //console.log(value1,listenerId)

      listener = {
        id: listenerId,
        callback: callback,
        type: 'position',
        subtype: 'ticks',
        ticks: value1,
        searchstring: data
      };

      this.allListenersByType.position.ticks.push(listenerId);

    } else if (!operator1 && !operator2) {
      // every bar, beat, sixteenth, hour, minute, second
      listener = {
        id: listenerId,
        callback: callback,
        type: 'position',
        subtype: 'repetitive',
        position_type: type,
        searchstring: data
      };

      tmp = this.allListenersByType.position.repetitive;
      if (tmp[type] === undefined) {
        tmp[type] = [];
      }
      tmp[type].push(listenerId);

    } else if (operator1 && !operator2) {
      // every time a bar, beat, sixteenth, hour, minute, second meets a certain simple condition, can be both repetitive and fire once
      listener = {
        id: listenerId,
        callback: callback,
        type: 'position',
        subtype: 'conditional_simple',
        position_type: type,
        data: value1,
        operator: operator1,
        searchstring: data
      };

      tmp = this.allListenersByType.position.conditional_simple;
      if (tmp[type] === undefined) {
        tmp[type] = [];
      }
      tmp[type].push(listenerId);

    } else if (operator1 && operator2) {
      // every time a bar, beat, sixteenth, hour, minute, second meets a certain complex condition
      listener = {
        id: listenerId,
        callback: callback,
        type: 'position',
        subtype: 'conditional_complex',
        position_type: type,
        value1: value1,
        value2: value2,
        operator1: operator1,
        operator2: operator2,
        searchstring: data
      };

      tmp = this.allListenersByType.position.conditional_complex;
      if (tmp[type] === undefined) {
        tmp[type] = [];
      }
      tmp[type].push(listenerId);

    }

    this.allListenersById[listenerId] = listener;
    this.positionListenersBySearchstring[data] = listenerId;
    return listenerId;
  };

  // @param type, data, callback
  // @param id
  FollowEvent.prototype.removeEventListener = function (args) {
    var
      //args = Array.prototype.slice.call(arguments),
      arg0,
      numArgs,
      type, subtype, data, callback, id, ids, tmp,
      listener, listenerId,
      event, eventId, eventIds,
      i, j, k, removeMe,
      listenerIds,
      filteredListenerIds = [],
      removedListenerIds = [],
      dataType;

    //console.log(args);
    //args = Array.prototype.slice.call(args[0]);
    arg0 = args[0];
    numArgs = args.length;

    if (numArgs === 1) {
      if (typeString(arg0) === 'array') {
        ids = arg0;
      } else {
        ids = [arg0];
      }
      //console.log(ids);

      for (i = ids.length - 1; i >= 0; i--) {
        id = ids[i];
        //console.log(id);
        if (this.allListenersById[id] !== undefined) {
          listener = this.allListenersById[id];
          type = listener.type;
          subtype = listener.subtype;

          if (type === 'position') {
            // reference to an array of all the listeners bound to this event type
            listenerIds = this.allListenersByType[type][subtype][listener.position_type];
            // loop over listeners and filter the one that has to be removed
            for (j = listenerIds.length - 1; j >= 0; j--) {
              listenerId = listenerIds[j];
              if (listenerId !== id) {
                filteredListenerIds.push(listenerId);
              }
            }
            // add the filtered array back
            this.allListenersByType[listener.type][listener.subtype][listener.position_type] = [].concat(filteredListenerIds);
            delete this.allListenersById[id];

          } else if (type === 'event' || type === 'note') {
            event = listener.event;
            eventId = event.id;
            listenerIds = this.allListenersByType.event[subtype][eventId];
            for (j = listenerIds.length - 1; j >= 0; j--) {
              listenerId = listenerIds[j];
              listener = this.allListenersById[listenerId];
              if (listenerId !== id) {
                filteredListenerIds.push(listenerId);
                break;
              }
            }
            // add the filtered array back per event
            this.allListenersByType.event[subtype][eventId] = [].concat(filteredListenerIds);
            delete this.allListenersById[id];

            //@TODO: we have to add allListenersByType.notes
            /*
                                    if(type === 'note'){
                                        console.log(event);
                                        if(event.type === sequencer.NOTE_ON){
                                            eventId = event.midiNote.noteOff.id;
                                            tmp = allListenersByType.event[subtype][eventId];
                                            listenerIds = listenerIds.concat(tmp);
                                        }else if(event.type === sequencer.NOTE_OFF){
                                            eventId = event.midiNote.noteOn.id;
                                            tmp = allListenersByType.event[subtype][eventId];
                                            listenerIds = listenerIds.concat(tmp);
                                        }
            
                                        for(j = listenerIds.length - 1; j >= 0; j--){
                                            listenerId = listenerIds[j];
                                            listener = allListenersById[listenerId];
                                            if(listenerId !== id){
                                                filteredListenerIds.push(listenerId);
                                                break;
                                            }
                                        }
                                        // add the filtered array back per event
                                        allListenersByType.event[subtype][eventId] = [].concat(filteredListenerIds);
                                        delete allListenersById[id];
                                    }
            */
          }

          //console.log(this.allListenersById,this.allListenersByType);

        } else {
          console.warn('no event listener found with id', id);
        }
      }

    } else if (numArgs === 2 || numArgs === 3) {

      type = args[0];
      data = args[1];
      callback = args[2];
      dataType = typeString(data);

      //console.log(type, data, callback, dataType);

      switch (type) {
        case 'position':
          if (dataType === 'string') {
            // get the id of the listener by the searchstring
            id = this.positionListenersBySearchstring[data];
            // get the listener by id
            listener = this.allListenersById[id];
            // reference to an array of all the listeners bound to this event type
            listenerIds = this.allListenersByType[listener.type][listener.subtype][listener.position_type];
            // loop over listeners and filter the one that has to be removed
            for (i = listenerIds.length - 1; i >= 0; i--) {
              listenerId = listenerIds[i];
              if (listenerId !== id) {
                filteredListenerIds.push(listenerId);
              }
            }
            // add the filtered array back
            this.allListenersByType[listener.type][listener.subtype][listener.position_type] = [].concat(filteredListenerIds);
            delete this.allListenersById[id];
            delete this.positionListenersBySearchstring[data];
            //console.log(allListenersById, allListenersByType, positionListenersBySearchstring);
          }
          break;

        case 'event':
        case 'note':

          if (dataType === 'string') {
            // get all listener ids that are connected to this searchstring
            listenerIds = this.eventListenersBySearchstring[data];
            for (i = listenerIds.length - 1; i >= 0; i--) {
              // collect all ids of listeners that need to be removed
              removedListenerIds.push(listenerIds[i]);
            }

            // loop over all searchstring listeners and filter the ones that have to be removed
            eventIds = this.allListenersByType.event.searchstring;
            for (eventId in eventIds) {
              if (eventIds.hasOwnProperty(eventId)) {
                listenerIds = eventIds[eventId];
                filteredListenerIds = [];
                for (i = listenerIds.length - 1; i >= 0; i--) {
                  listenerId = listenerIds[i];
                  removeMe = false;
                  for (j = removedListenerIds.length - 1; j >= 0; j--) {
                    //console.log(listenerId, removedListenerIds[j], callback);
                    if (listenerId === removedListenerIds[j]) {
                      removeMe = true;
                      /*
                      if(callback === undefined){
                          removeMe = true;
                      }else{
                          removeMe = allListenersById[listenerId].callback === callback
                      }
                      */
                      break;
                    }
                  }
                  if (removeMe === false) {
                    filteredListenerIds.push(listenerId);
                  } else {
                    // remove the listeners from the id library
                    delete this.allListenersById[listenerIds[i]];
                  }
                }
                // add the filtered array back
                this.allListenersByType.event.searchstring[eventId] = [].concat(filteredListenerIds);
              }
            }
            // delete the searchstring listeners array
            delete this.eventListenersBySearchstring[data];
            //console.log(allListenersById,eventListenersBySearchstring,allListenersByType);

          } else if (dataType === 'object') {
            if (data.className !== 'MidiEvent' && data.className !== 'MidiNote') {
              console.error('please provide a midi event or a midi note');
              return;
            }
            if (data.className === 'MidiNote') {
              id = data.noteOn.id;
            } else if (data.className === 'MidiEvent') {
              id = data.id;
            }
            if (this.allListenersByType.event.instance[id] !== undefined) {
              type = 'instance';
              listenerIds = this.allListenersByType.event.instance[id];
            } else if (this.allListenersByType.event.searchstring[id] !== undefined) {
              type = 'searchstring';
              listenerIds = this.allListenersByType.event.searchstring[id];
            }
            if (listenerIds === undefined) {
              console.warn('no event listener bound to event with id', id);
              return;
            }
            if (data.className === 'MidiNote') {
              ids = this.allListenersByType.event[type][data.noteOff.id];
              listenerIds = listenerIds.concat(ids);
            }
            //console.log(listenerIds);
            for (i = listenerIds.length - 1; i >= 0; i--) {
              listenerId = listenerIds[i];
              listener = this.allListenersById[listenerId];
              if (callback && listener.callback !== callback) {
                filteredListenerIds.push(listener.id);
              } else {
                delete this.allListenersById[listener.id];
              }
              this.allListenersByType.event[type][listener.event.id] = [].concat(filteredListenerIds);
            }
            //console.log(allListenersById,allListenersByType);
          }
          break;
      }
    }
  };


  // set the 'called' key of every listener to false, this is necessary if the playhead is moved (by a loop of by the user)
  FollowEvent.prototype.resetAllListeners = function () {
    var listeners = this.allListenersById, key, listener;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key)) {
        listener = listeners[key];
        listener.called = false;
        //console.log(listener);
      }
    }
  };


  getEvents = function (type, data) {

    var dataType = typeString(data),
      events = [], i, e;

    if (dataType !== 'array' && data !== undefined && data.className !== 'MidiEvent' && data.className !== 'MidiNote') {
      console.error(data, ' is not valid data for event type \'event\', please consult documentation');
      return -1;
    }

    if (dataType === 'array') {
      for (i = data.length - 1; i >= 0; i--) {
        e = data[i];
        if (type === 'event' && e.className !== 'MidiEvent' && e.className !== 'AudioEvent') {
          console.warn('skipping', e, 'because it is not a MidiEvent nor an AudioEvent');
          continue;
        } else if (type === 'note' && e.className !== 'MidiNote') {
          console.warn('skipping', e, 'because it is not a MidiNote');
          continue;
        }
        events.push(e);
      }
    } else {
      if (type === 'event') {
        if (data.className !== 'MidiEvent' && data.className !== 'AudioEvent') {
          console.error(data, ' is not a MidiEvent nor an AudioEvent');
          return -1;
        } else {
          events = [data];
        }
      } else if (type === 'note') {
        if (data.className !== 'MidiNote') {
          console.error(data, ' is not a MidiNote');
          return -1;
        } else {
          events = [data.noteOn, data.noteOff];
        }
      }
    }

    return events;
  };


  checkOperatorConflict = function (operator1, operator2) {

    switch (operator1) {
      case '=':
      case '==':
      case '===':
        return false;
    }

    switch (operator2) {
      case '=':
      case '==':
      case '===':
        return false;
    }

    return true;
  };


  sequencer.protectedScope.createFollowEvent = function (song) {
    return new FollowEvent(song);
  };


  sequencer.protectedScope.addInitMethod(function () {
    typeString = sequencer.protectedScope.typeString;
    getPosition = sequencer.protectedScope.getPosition;
    midiEventNumberByName = sequencer.midiEventNumberByName;
    midiEventNameByNumber = sequencer.midiEventNameByNumber;
    findEvent = sequencer.findEvent;
  });
}