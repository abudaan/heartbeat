window.onload = function(){

    'use strict';

    var
        listItems = document.querySelectorAll('li>span'),
        logo = document.getElementById('logo'),
        viewer = document.getElementById('viewer'),
        i,
        item,
        selectedItem,
        numItems = listItems.length,
        sideBar = document.getElementById('side'),
        sideBarWidth = sideBar.getBoundingClientRect().width + 10;

    //viewer.src = '';
    sideBar.style.width = sideBarWidth + 'px';

    function gotoHash(){
        var hash = window.location.hash,
            id;
        hash = hash.replace('#!','');
        id = hash.replace(/\//g, ':');
        id = id.replace(/:$/, '');
        if(hash === ''){
            //window.location.hash = '!create_reverb';
            return;
        }
        if(selectedItem){
            selectedItem.className = 'active';
        }
        //console.log(id);
        selectedItem = document.getElementById(id);
        if(selectedItem){
            selectedItem.className = 'selected';
            //viewer.src = window.location.origin + window.location.pathname + hash;
            viewer.src = hash;
        }else{
            //window.location.hash = '!create_reverb';
        }
    }


    function resize(){
        var w = window.innerWidth;
        viewer.width = w - sideBarWidth + 'px';
        viewer.style.marginLeft = sideBarWidth + 'px';
    }


    logo.addEventListener('click', function(){
        window.location = '/heartbeat';
    }, false);



    (function check(){

        var ua = navigator.userAgent,
            plugins = window.navigator.plugins,
            plugin,
            os,
            browser,
            message = '',
            jazz = false,
            webmidi = navigator.requestMIDIAccess !== undefined;

        if(ua.match(/(iPad|iPhone|iPod)/g)){
            os = 'ios';
        }else if(ua.indexOf('Android') !== -1){
            os = 'android';
        }else if(ua.indexOf('Linux') !== -1){
            os = 'linux';
        }else if(ua.indexOf('Macintosh') !== -1){
            os = 'osx';
        }else if(ua.indexOf('Windows') !== -1){
            os = 'windows';
        }

        if(ua.indexOf('Chrome') !== -1){
            // chrome, chromium and canary
            browser = 'Chrome';

            if(ua.indexOf('OPR') !== -1){
                browser = 'Opera';
            }else if(ua.indexOf('Chromium') !== -1){
                browser = 'Chromium';
            }
        }else if(ua.indexOf('Safari') !== -1){
            browser = 'Safari';
        }else if(ua.indexOf('Firefox') !== -1){
            browser = 'Firefox';
        }else if(ua.indexOf('Trident') !== -1){
            browser = 'Internet Explorer';
        }

        if(os === 'ios'){
            if(ua.indexOf('CriOS') !== -1){
                browser = 'Chrome';
            }
        }

        // check if Jazz plugin is installed
        for(i = plugins.length - 1; i >= 0; i--){
            plugin = plugins[i];
            if(plugin.name.toLowerCase().indexOf('jazz') !== -1){
                jazz = true;
            }
        }

        //console.log(ua, os, browser, webmidi, jazz);

        if(os === 'ios'){
            message = 'The examples are not optimized for tablets so be aware that some examples might not work properly.\n\n';
            message += 'Some examples require MIDI in/out, but unfortunately there is currently no reliable way of receiving MIDI events in a browser on iOS.\n\n';
        }else if(os === 'android'){
            message = 'The examples are not optimized for tablets so be aware that some examples might not work properly.\n\n';
            if(browser !== 'Chrome'){
                message += 'Some examples require MIDI in/out, please use Chrome for these examples.';
            }else if(webmidi === false){
                message += 'The Web MIDI API is not enabled, to enable it:\n\n';
                message += ' - point your browser to chrome://flags\n';
                message += ' - search for "MIDI" and click "enable"\n';
                message += ' - connect your MIDI devices (if you haven\'t already)\n';
                message += ' - restart your browser\n\n';
                message += 'Now all your MIDI devices are automatically connected to heartbeat.';
            }
        }else if(browser === 'Internet Explorer'){
            message = 'The WebAudio API hasn\'t been implemented in Internet Explorer: the examples won\'t run, please use any other browser';
        }else{
            if(jazz === true && webmidi === false){
                if(browser === 'Chrome' || browser === 'Chromium'){
                    message = 'Using Jazz plugin and Chris Wilson\'s WebMIDIAPIShim for MIDI in/out\n\n';
                    message += 'However, you can also use the Web MIDI API which is more stable and performs better than the Jazz plugin.\n\n';
                    message += 'To enable it:\n\n';
                    message += ' - point your browser to chrome://flags\n';
                    message += ' - search for "MIDI" and click "enable"\n';
                    message += ' - connect your MIDI devices (if you haven\'t already)\n';
                    message += ' - restart your browser\n\n';
                    message += 'Now all your MIDI devices are connected to heartbeat.\n\n';
                    message += 'Note: you don\'t need to de-install your Jazz plugin, it will be bypassed automatically.';
                }else{
                    message = 'Using Jazz plugin and Chris Wilson\'s WebMIDIAPIShim for MIDI in/out.';
                }
            }else if(webmidi === false){
                if(browser === 'Chrome' || browser === 'Chromium'){
                    message += 'The Web MIDI API is not enabled, to enable it:\n\n';
                    message += ' - point your browser to chrome://flags\n';
                    message += ' - search for "MIDI" and click "enable"\n';
                    message += ' - connect your MIDI devices (if you haven\'t already)\n';
                    message += ' - restart your browser\n\n';
                    message += 'Now all your MIDI devices are automatically connected to heartbeat.';
                }else{
                    //message += 'The Web MIDI API is not implemented in ' + browser + ' / ' + os + '.\n\n';
                    message += 'Some examples require MIDI in or out, please use Chrome or Chromium for these examples, or install the Jazz plugin from http://jazz-soft.net';
                }
            }
        }

        resize();

        if(message !== ''){
            window.alert(message);
        }

        if(browser !== 'Internet Explorer'){
            for(i = 0; i < numItems; i++){
                item = listItems[i];
                item.addEventListener('click', function(){
                    window.location.hash = '!' + this.parentNode.id.replace(/:/g, '/');
                }, false);
            }
            window.addEventListener('resize', resize, false);
            window.addEventListener('hashchange', gotoHash, false);
            gotoHash();
        }else{
            listItems = document.querySelectorAll('li');
            for(i = listItems.length - 1; i >= 0; i--){
                item = listItems[i];
                item.className = 'disabled';
            }
        }

    }());
};
