(function () {

  'use strict';

  var scope = window.scope,
    navigations = {},
    itemsByHash = {},
    callback,
    divSideNav;

  function createNavigation(id) {
    var i, item, ul, li,
      items = scope.navigation[id],
      tmpItems = {},
      maxi = items.length;

    itemsByHash[id] = {};

    ul = document.createElement('ul');
    ul.id = 'navigation_' + id;

    for (i = 0; i < maxi; i++) {
      item = items[i];
      item.menuId = id;
      li = document.createElement('li');
      li.innerHTML = item.label;
      li.id = item.hash;
      tmpItems[item.hash] = item;
      li.addEventListener('mouseup', function () {
        this.className = 'main_nav_item_selected';
        window.location = tmpItems[this.id].url;
      }, false);
      ul.appendChild(li);
      itemsByHash[id][item.hash] = li;
    }
    navigations[id] = ul;
    ul.style.display = id === 'main' ? 'block' : 'none';
    divSideNav.appendChild(ul);
  }


  function create(cb) {
    var navs = ['main', 'api', 'docs', 'tests'],
      numNavs = navs.length, i,
      path = window.location.pathname,
      mainItem, subItem, liMain, liSub;

    divSideNav = document.querySelectorAll('#side>nav')[0];
    callback = cb;

    for (i = 0; i < numNavs; i++) {
      createNavigation(navs[i]);
    }

    path = path.replace(/^\//, '');
    path = path.replace(/\/$/, '');
    path = path.split('/');

    //console.log(path,itemsByHash.main);
    mainItem = path[1];
    navigations.api.style.display = mainItem === 'api' ? 'block' : 'none';
    navigations.docs.style.display = mainItem === 'docs' ? 'block' : 'none';

    //console.log(path);

    if (path.length > 2) {
      subItem = path[2];
      liSub = itemsByHash[mainItem][subItem];
      liSub.className = 'main_nav_item_selected';
      liSub.innerHTML = '<span>' + liSub.innerHTML + '</span>';
    } else if (mainItem === 'api' || mainItem === 'docs') {
      window.location.href = scope.navigation[mainItem][0].hash;
    }

    //console.log(mainItem,itemsByHash.main[mainItem]);
    //console.log(subItem,itemsByHash[mainItem][subItem]);

    liMain = itemsByHash.main[mainItem];
    liMain.className = 'main_nav_item_selected';
    liMain.innerHTML = '<span>' + liMain.innerHTML + '</span>';

    callback(mainItem, subItem);
  }


  scope.createNavigation = function () {
    create.apply(null, arguments);
  };

}());