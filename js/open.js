(function () {

  'use strict';

  var
    protectedScope = {},
    initMethods = [];


  protectedScope.addInitMethod = function (method) {
    initMethods.push(method);
  };

  protectedScope.callInitMethods = function () {
    var i, maxi = initMethods.length;
    for (i = 0; i < maxi; i++) {
      initMethods[i]();
    }
  };

  if (window.webkitRequestAnimationFrame !== undefined) {
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  }

  window.scope = {
    protectedScope: protectedScope,
    sideBarWidth: 250,
    maxWidthContent: 870,
    marginRightTabs: 40,
    headerHeight: 25
  };

}());