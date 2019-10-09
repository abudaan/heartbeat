(function () {

  'use strict';

  scope.forEach = function (obj, cb) {
    var name;
    for (name in obj) {
      if (obj.hasOwnProperty(name)) {
        cb.call(this, obj[name], name);
      }
    }
  };


  scope.ajax = function (method, url, data, success, error) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (success !== undefined && xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        success(xmlhttp.responseText);
      } else if (error !== undefined) {
        error(xmlhttp);
      }
    };
    xmlhttp.open(method, url, true);
    if (method === 'POST') {
      xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }

    // switch(type){
    //     case 'json':
    //         xmlhttp.setRequestHeader('Content-type', 'application/json');
    //         break;
    //     case 'xml':
    //         xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    //         break;
    //     default:
    //         //do nothing
    // }

    xmlhttp.send(data);
  };

  scope.objectForEach = function (o, cb) {
    var name,
      obj = o
    for (name in obj) {
      if (obj.hasOwnProperty(name)) {
        //cb.call(this, obj[name], name);
        cb(obj[name], name);
        i++;
      }
    }
  };

}());