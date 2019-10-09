function songEventListener() {

  'use strict';

  var
    slice = Array.prototype.slice,

    // import
    typeString, // defined in util.js
    listenerIndex = 0,

    addEventListener,
    removeEventListener,
    dispatchEvent;


  dispatchEvent = function () {
    var i, tmp, listener,
      args = slice.call(arguments),
      numArgs = args.length,
      song = args[0],
      type = args[1],
      params = [];

    //console.log(arguments, args);

    // if there are arguments specified, put them before the argument song
    if (numArgs > 2) {
      i = 2;
      while (i < numArgs) {
        params.push(args[i]);
        i++;
      }
    }
    params.push(song);

    tmp = song.listeners[type];
    if (tmp === undefined || tmp.length === undefined) {
      return;
    }

    for (i = tmp.length - 1; i >= 0; i--) {
      listener = tmp[i];
      if (listener.callback) {
        listener.callback.apply(null, params);
      }
    }
  };


  //@param: type, callback
  //@param: type, data, callback
  addEventListener = function () {
    var args = slice.call(arguments),
      listenerId,
      type = args[0];

    switch (type) {
      case 'play':
      case 'stop':
      case 'pause':
      case 'end':
      case 'record_start':
      case 'record_stop':
      case 'record_precount':
      case 'record_preroll':
      case 'recorded_events':
      case 'latency_adjusted':
      case 'loop_off':
      case 'loop_on':
      case 'loop': // the playhead jumps from the loop end position to the loop start position
      case 'sustain_pedal':
        if (this.listeners[type] === undefined) {
          this.listeners[type] = [];
        }
        listenerId = type + '_' + listenerIndex++;
        this.listeners[type].push({
          id: listenerId,
          callback: args[1]
        });
        //console.log(type, listenerId);
        return listenerId;
      case 'note':
      case 'event':
      case 'position':
        //console.log(type, args[1], args[2]);
        return this.followEvent.addEventListener(type, args[1], args[2]);
      default:
        console.log(type, 'is not a supported event');
    }
  };


  removeEventListener = function () {
    var args = slice.call(arguments),
      tmp,
      arg0 = args[0],
      callback = args[1],
      type, id,
      filteredListeners = [],
      i, listener;

    if (arg0.indexOf('_') !== -1) {
      tmp = arg0.split('_');
      type = tmp[0];
      id = arg0;
    } else {
      type = arg0;
    }

    // an array of listener ids is provided so this is not a transport event -> send to FollowEvent
    if (typeString(type) === 'array') {
      return this.followEvent.removeEventListener(args);
    }


    switch (type) {
      case 'play':
      case 'stop':
      case 'pause':
      case 'end':
      case 'record_start':
      case 'record_stop':
      case 'record_precount':
      case 'record_preroll':
      case 'recorded_events':
      case 'latency_adjusted':
      case 'loop_off':
      case 'loop_on':
      case 'loop': // the playhead jumps from the loop end position to the loop start position
      case 'sustain_pedal':
        tmp = this.listeners[type];
        if (tmp && tmp.length > 0) {
          for (i = tmp.length - 1; i >= 0; i--) {
            listener = tmp[i];
            // remove by id
            if (id !== undefined) {
              if (listener.id !== id) {
                filteredListeners.push(listener);
              }
              // remove by callback
            } else if (callback !== undefined && listener.callback !== callback) {
              filteredListeners.push(listener);
            }
          }
          this.listeners[type] = [].concat(filteredListeners);
        }
        break;
      case 'note':
      case 'event':
      case 'position':
        return this.followEvent.removeEventListener(args);
      default:
        console.error('unsupported event');
    }
  };


  sequencer.protectedScope.songAddEventListener = addEventListener;
  sequencer.protectedScope.songRemoveEventListener = removeEventListener;
  sequencer.protectedScope.songDispatchEvent = dispatchEvent;

  sequencer.protectedScope.addInitMethod(function () {
    typeString = sequencer.protectedScope.typeString;
  });

}