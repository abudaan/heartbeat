(function(){

    'use strict';

    var scope = window.scope,
        tabsHeight,
        position,
        animStep,
        numColumns,
        columnWidth = 240,
        currentTab,
        currentTabType,
        tabIsShowing,
        isTablet,
        windowWidth,
        windowHeight,
        maxWidth,
        maxHeight,
        currentItems,
        divTabContent,
        divColumnContainer,
        divTabButtons,
        divBtnClose,
        divBtnMethods,
        divBtnProperties;


    function init(){
        divTabContent = document.getElementById('tab_content');
        divColumnContainer = document.getElementById('tab_column_container');
        divTabButtons = document.getElementById('tab_buttons');
        divBtnClose = document.getElementById('tab_close');
        //divBtnClose = document.createElement('div');
        divBtnMethods = document.getElementById('tab_methods');
        divBtnProperties = document.getElementById('tab_properties');

        //divBtnClose.id = 'tab_button_close';
        //divBtnClose.className = 'tab_active';
        //divBtnClose.innerHTML = '&#8593';
        divBtnClose.style.display = 'none';

        divBtnClose.addEventListener('click', setTab, false);
        divBtnMethods.addEventListener('click', setTab, false);
        divBtnProperties.addEventListener('click', setTab, false);
        document.addEventListener('click', function(e){
            if(e.target !== divBtnMethods && e.target !== divBtnProperties){
                hide();
            }
        }, false);

        calculateColumns(window.innerWidth);
    }


    function setTab(e){
        e.preventDefault();
        var id = e.target.id;
        //console.log(id, currentTab)
        if(currentTab && currentTab.id === id){
            hide();
            return;
        }
        if(id === 'tab_button_close'){
            hide();
            return;
        }
        if(currentTab){
            currentTab.className = 'tab_active';
        }
        currentTab = e.target;
        currentTab.className = 'tab_selected';
        if(id === 'tab_methods'){
            currentTabType = 'methods';
            populateTab(currentItems.methods);
        }else{
            currentTabType = 'properties';
            populateTab(currentItems.properties);
        }
        show();
    }


    function show(){
        divTabContent.style.top = -tabsHeight + 'px';
        position = -tabsHeight;
        animStep = tabsHeight/10;
        animDown();
    }


    function hide(){
        position = 25;
        divBtnClose.style.display = 'none';
        if(currentTab){
            currentTab.className = 'tab_active';
            currentTab = undefined;
        }
        animUp();
    }


    function animDown(){
        if(isTablet === true){
            tabIsShowing = true;
            divTabContent.style.top = '25px';
            return;
        }

        position += animStep;
        divTabContent.style.top = position + 'px';
        if(position < 25){
            window.requestAnimationFrame(animDown);
        }else{
            tabIsShowing = true;
            divTabContent.style.top = '25px';
        }
    }


    function animUp(){
        if(isTablet === true){
            tabIsShowing = false;
            divTabContent.style.top = -tabsHeight + 'px';
            divColumnContainer.innerHTML = '';
            return;
        }

        position -= animStep;
        divTabContent.style.top = position + 'px';
        if(position > -tabsHeight){
            window.requestAnimationFrame(animUp);
        }else{
            tabIsShowing = false;
            divTabContent.style.top = -tabsHeight + 'px';
            divColumnContainer.innerHTML = '';
        }
    }


    function populateTab(items){
        var
        numItems = items.length, i, item, hash,
        maxNumItemsPerColumn = Math.ceil(numItems/numColumns),
        listItem, column;

        divTabContent.style.height = 'auto';
        divColumnContainer.innerHTML = '';
        divColumnContainer.style.width = numColumns * columnWidth + 'px';
        divColumnContainer.innerHTML = '';

        for(i = 0; i < numItems; i++){
            //console.log(i, i % maxNumItemsPerColumn === 0, maxNumItemsPerColumn, numItems, numColumns);
            if(i % maxNumItemsPerColumn === 0){
                column = document.createElement('ul');
                column.className = 'tab_column';
                column.style.width = columnWidth + 'px';
                divColumnContainer.appendChild(column);
            }
            item = items[i];
            listItem = document.createElement('li');
            listItem.className = 'tab_column_item';
            hash = item.toLowerCase();
            hash = hash.replace(/\(/, '');
            hash = hash.replace(/\)/, '');
            //console.log(hash);
            listItem.innerHTML = '<a href="#' + hash + '">' + item + '</a>';
            // listItem.addEventListener('click', function(){
            //     currentTab.className = 'tab_active';
            //     currentTab = undefined;
            //     animUp();
            // }, false);
            column.appendChild(listItem);
        }
        //divTabContent.appendChild(divBtnClose);
        divBtnClose.style.display = 'block';
        tabsHeight = divTabContent.getBoundingClientRect().height + 10 + 10; // add padding twice
        //console.log(tabsHeight);
        if(tabsHeight > maxHeight){
            tabsHeight = maxHeight;
            divTabContent.style.height = tabsHeight + 'px';
        }
        //console.log(tabsHeight, windowHeight, scope.headerHeight);
    }


    function calculateColumns(w){
        maxWidth = w - scope.sideBarWidth - scope.marginRightTabs;
        windowWidth = w;
        divTabButtons.style.width = maxWidth + 'px';
        divTabContent.style.width = maxWidth + 'px';
        numColumns = Math.floor(maxWidth/columnWidth);
        //console.log(windowHeight, windowWidth, w, numColumns, scope.sideBarWidth, scope.marginRightTabs);
        if(w < columnWidth){
            numColumns = 1;
        }
    }


    scope.createTabs = function(){
        init.apply(null, arguments);
        return {
            update: function(mainItem, subItem){
                if(subItem === undefined || mainItem === 'docs'){
                    divTabButtons.style.display = 'none';
                    divTabContent.style.top = '-100px';
                    return;
                }
                divTabButtons.style.display = 'block';
                divTabContent.style.top = '-100px';
                currentItems = scope.navigation[mainItem][subItem];
            },
            resize: function(w, h){
                if(h !== windowHeight){
                    maxHeight = h - scope.headerHeight;
                    windowHeight = h;
                    if(tabIsShowing){
                        tabsHeight = maxHeight;
                        divTabContent.style.height = maxHeight + 'px';
                    }
                }
                if(w === windowWidth){
                    return;
                }
                calculateColumns(w);
                if(currentTabType !== undefined && tabIsShowing === true){
                    //console.log('resize');
                    populateTab(currentItems[currentTabType]);
                }
            }
        };
    };

}());