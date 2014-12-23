(function(){

    'use strict';

    var scope = window.scope,
        navigations = {},
        mainItem,
        subItem,
        userAction = false,
        hashArray = [],
        hashString,
        itemsByHash = {};


    function createNavigation(id, parent){
        var i, item, ul, li,
            items = scope.navigation[id],
            tmpItems = {},
            maxi = items.length;

        itemsByHash[id] = {};

        ul = document.createElement('ul');
        ul.id = 'navigation_' + id;

        for(i = 0; i < maxi; i++){
            item = items[i];
            item.menuId = id;
            li = document.createElement('li');
            li.innerHTML = item.label;
            li.id = item.hash;
            tmpItems[item.hash] = item;
            li.addEventListener('mouseup', function(){
                this.className = 'main_nav_item_selected';
                var item = tmpItems[this.id];
                if(item.url.indexOf('http') === 0){
                    window.location = item.url;
                }else{
                    handleClick(item);
                }
            }, false);
            ul.appendChild(li);
            itemsByHash[id][item.hash] = li;
        }
        navigations[id] = ul;
        ul.style.display = id === 'main' ? 'block' : 'none';
        parent.appendChild(ul);
    }


    function handleClick(item){
        var menuId = item.menuId,
            i, maxi;

        hashString = '!';

        if(menuId === 'main'){
            hashArray[0] = item.hash;
        }else if(menuId === 'api' || menuId === 'docs'){
            hashArray[1] = item.hash;
        }
        maxi = hashArray.length;
        for(i = 0; i < maxi; i++){
            hashString += hashArray[i] + '/';
        }
        hashString = hashString.slice(0, -1);
        //console.log('handleClick', hash);
        userAction = true;
        window.location.hash = hashString;
    }


    function create(parent){
        var navs = ['main', 'api', 'docs'],
            numNavs = navs.length, i;

        for(i = 0; i < numNavs; i++){
            createNavigation(navs[i], parent);
        }
        console.log(itemsByHash);

        window.addEventListener('hashchange', gotoHash, false);
        gotoHash();
    }


    function gotoHash(){
        var hash;

        if(userAction){
            //console.log('bypass');
            userAction = false;
            hash = hashArray;
        }else{
            hash = window.location.hash;
            //console.log('gotoHash', hash);
            if(hash){
                hash = hash.replace('#!','');
                //hash = hash.replace('!','');
                //hash = hash.replace('#','');
                //hash = hash.replace(/^\//,'');
                hash = hash.split('/');
            }else{
                window.location.hash = '!' + scope.navigation.main[0].label;
                return;
            }
        }

        if(mainItem !== undefined && itemsByHash.main[mainItem] !== undefined){
            itemsByHash.main[mainItem].className = '';
        }
        mainItem = hash[0];
        if(mainItem !== undefined && itemsByHash.main[mainItem] !== undefined){
            itemsByHash.main[mainItem].className = 'main_nav_item_selected';
            hashArray[0] = mainItem;
        }else{
            window.location.hash = '!' + scope.navigation.main[0].label;
            return;
        }


        navigations['api'].style.display = mainItem === 'api' ? 'block' : 'none';
        navigations['docs'].style.display = mainItem === 'docs' ? 'block' : 'none';

        //console.log(hash);
        // if(hash.length === 1){
        //     return;
        // }

        if(subItem !== undefined && itemsByHash[mainItem][subItem] !== undefined){
            itemsByHash[mainItem][subItem].className = '';
        }
        subItem = hash[1];
        //console.log(subItem, itemsByHash[mainItem][subItem]);
        if(subItem !== undefined && itemsByHash[mainItem][subItem] !== undefined){
            itemsByHash[mainItem][subItem].className = 'main_nav_item_selected';
            hashArray[1] = subItem;
        }else{
            window.location.hash = '!' + mainItem;
            return;
        }
    }


    scope.createNavigation = function(parent){
        create(parent);
        return {
//            update: update
        };
    };

}());