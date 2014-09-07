window.onload = function(){

    'use strict';

    var
        listItems = document.querySelectorAll('li>span'),
        logo = document.getElementById('logo'),
        viewer = document.getElementById('viewer'),
        i, item, selectedItem,
        numItems = listItems.length,
        sideBar = document.getElementById('side'),
        sideBarWidth = sideBar.getBoundingClientRect().width + 10;

    //console.log(numItems);

    sideBar.style.width = sideBarWidth + 'px';

    function gotoHash(){
        var hash = window.location.hash,
            id;

        hash = hash.replace('#!','');
        id = hash.replace(/\//g, ':');
        if(hash === ''){
            //window.location.hash = '!create_reverb';
            return;
        }
        if(selectedItem){
            selectedItem.className = 'active';
        }
        selectedItem = document.getElementById(id);
        if(selectedItem){
            selectedItem.className = 'selected';
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
        window.location = '/';
    }, false);


    for(i = 0; i < numItems; i++){
        item = listItems[i];
        item.addEventListener('click', function(){
            window.location.hash = '!' + this.parentNode.id.replace(/:/g, '/');
        }, false);
    }


    sequencer.ready(function init(){
        var os = sequencer.os,
            browser = sequencer.browser,
            message = '';

        browser = browser.substring(0,1).toUpperCase() + browser.substring(1);

        if(os === 'ios'){
            message = 'Although heartbeat supports iOS, not all examples are optimized for tablets. Therefor some examples might not work properly.\n\n';
            message += 'Web MIDI API is not supported on iOS so you can not connect your MIDI devices to heartbeat.\n\n';
            message += 'Some examples require MIDI in or out, these examples won\'t work on this device';
        }else if(os === 'android'){
            message = 'Although heartbeat supports Android, not all examples are optimized for tablets. Therefor some examples might not work properly.\n\n';
        }

        if(sequencer.webmidi === false && os !== 'ios'){
            if(browser === 'Chrome'){
                message += 'Web MIDI API supported!\n\n';
                message += 'To enable it:\n\n';
                message += ' - point your browser to chrome://flags\n';
                message += ' - search for "MIDI" and click "enable"\n';
                message += ' - connect your MIDI devices (if you haven\'t already)\n';
                message += ' - restart your browser\n\n';
                message += 'Now all your MIDI devices are connected to heartbeat.';
            }else{
                message += 'The Web MIDI API is not supported in ' + browser + ' so you can not connect your MIDI devices to heartbeat.\n\n';
                message += 'Some examples require MIDI in or out, please use Google Chrome or Chromium for these examples.';
            }
        }

        if(message !== ''){
            alert(message);
        }

        window.addEventListener('resize', resize, false);
        window.addEventListener('hashchange', gotoHash, false);
        resize();
        gotoHash();
    });
};