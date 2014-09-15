(function(){

	'use strict';

	var
        // satisfy jslint
        sequencer = window.sequencer,
        console = window.console,
        AP = Array.prototype,

        supportedEvents = 'play stop pause end record_start record_stop sustain_pedal',
        listenerIndex = 0,

        addEventListener,
        removeEventListener,
		dispatchEvent;


    dispatchEvent = function() {
        var i, tmp, listener,
            args = AP.slice.call(arguments),
            numArgs = args.length,
            song = args[0],
            type = args[1],
            params = [];

        //console.log(arguments, args);

        // if there are arguments specified, put them before the argument song
        if(numArgs > 2){
            i = 2;
            while(i < numArgs){
                params.push(args[i]);
                i++;
            }
        }
        params.push(song);

        tmp = song.listeners[type];
        if(tmp === undefined){
            return;
        }
        for (i = tmp.length - 1; i >= 0; i--) {
            listener = tmp[i];
            listener.callback.apply(null, params);
        }
    };


    //@param: type, callback
    //@param: type, data, callback
    addEventListener = function(){
        var args = Array.prototype.slice.call(arguments),
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
            case 'loop_off':
            case 'loop_on':
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
           default:
                //console.log(type, args[1], args[2]);
                return this.followEvent.addEventListener(type, args[1], args[2]);
        }
    };


    removeEventListener = function(){
        var args = Array.prototype.slice.call(arguments),
            tmp,
            arg0 = args[0],
            callback = args[1],
            type,id,
            filteredListeners = [],
            i, listener;

        if(arg0.indexOf('_') !== -1){
            tmp = arg0.split('_');
            type = tmp[0];
            id = arg0;
        }else{
            type = arg0;
        }

        // not a transport event, so handled by FollowEvent
        if(supportedEvents.indexOf(type) === -1){
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
            case 'loop_off':
            case 'loop_on':
            case 'sustain_pedal':
                tmp = this.listeners[type];
                for(i = tmp.length - 1; i >= 0; i--){
                    listener = tmp[i];
                    if(id !== undefined){
                        if(listener.id !== id){
                            filteredListeners.push(listener);
                        }
                    }else if(callback !== undefined && listener.callback !== callback){
                        filteredListeners.push(listener);
                    }
                }
                this.listeners[type] = [].concat(filteredListeners);
                break;
            default:
                console.error('unsupported event');
        }
    };

    sequencer.protectedScope.songAddEventListener = addEventListener;
    sequencer.protectedScope.songRemoveEventListener = removeEventListener;
    sequencer.protectedScope.songDispatchEvent = dispatchEvent;

    sequencer.protectedScope.addInitMethod(function(){
    });

}());