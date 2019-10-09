window.onload = function() {

    'use strict';

    var
        scope = window.scope,

        divContent = document.getElementById('content'),
        divMain = document.getElementById('main'),
        divLogo = document.getElementById('logo'),

        tabs,
        navigation;


    function init(){
        tabs = scope.createTabs();
        navigation = scope.createNavigation(function(){
            tabs.update.apply(null, arguments);
        });

        divLogo.addEventListener('click', function(){
            window.location = '/heartbeat';
        }, false);

        window.addEventListener('resize', resize, false);
        document.body.style.visibility = 'visible';
        resize();
    }


    function resize(){
        var contentWidth,
            windowWidth = window.innerWidth,
            windowHeight = window.innerHeight;

        //@TODO: better margins for content in main div
        //contentWidth = windowWidth - scope.sideNavWidth;
        //contentWidth = contentWidth > scope.maxContentWidth ? scope.maxContentWidth : contentWidth;

        //divContent.style.width = contentWidth + 'px';
        //divMain.style.height = windowHeight - 25 + 'px';

        tabs.resize(windowWidth, windowHeight);
    }

    init();
};