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
        if(sequencer.webmidi !== true){
            if(sequencer.browser === 'chrome' || sequencer.browser === 'chromium'){
                //alert('Web MIDI API supported!\n\nTo enable it:\n\n - point your browser to chrome://flags\n - search for "MIDI" and click "enable"\n - connect your MIDI devices (if you haven\'t already)\n - restart your browser or press the "relaunch" button at the bottom of the page\n\nNow all your MIDI devices are connected to heartbeat.');
                alert('Web MIDI API supported!\n\nTo enable it:\n\n - point your browser to chrome://flags\n - search for "MIDI" and click "enable"\n - connect your MIDI devices (if you haven\'t already)\n - restart your browser\n\nNow all your MIDI devices are connected to heartbeat.');
            }else{
                alert('Web MIDI API not supported in ' + sequencer.browser + '.\n\nYou can use heartbeat anyway but you can not connect your MIDI devices to heartbeat.\n\nSome examples require MIDI in or out, please use Google Chrome or Chromium for these examples');
            }
        }
        window.addEventListener('resize', resize, false);
        window.addEventListener('hashchange', gotoHash, false);
        resize();
        gotoHash();
    });
};