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


    window.addEventListener('resize', resize, false);
    window.addEventListener('hashchange', gotoHash, false);
    resize();
    gotoHash();
};