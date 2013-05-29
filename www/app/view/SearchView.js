templates.SearchView = "app/view/SearchView.html";

window.SearchView = Backbone.View.extend({
    
    initialize: function(options) {
        this.map = options.map;
        this.bounds = options.bounds;
        this.render();
        this.view = this.$el;
        this.initSearchView();
    },
            
    events:{
        "click #cleanSearchHis":"cleanSearchHis"
    },
    
    render: function () {

        $(this.el).html(this.template());
        this.setElement(this.$("#searchView"));
        
        var style = " ";
        if ( window.viewNavigator && window.viewNavigator.history.length >= 1 ) {
            this.backLabel = '返回';
            style = "margin-left: 65px;";
        }

        var self = this;
        var searchKeyComp = this.searchKeyComp = $('<input data-type="search" class="ui-input-text ui-body-null" placeholder="地点、顺风车、出租车、餐饮、住宿、购物" autofocus="autofocus" autocomplete="off"/>');
        searchKeyComp.on({
            'focus click': function() {
                window.unBackable = true;
            },
            'blur': function() {
                window.unBackable = false;
            },
            'input': function() {
                self.onSearch(this.value);
            }
        });
    
        var clearText = this.clearText = $('<a href="#" class="ui-input-clear ui-btn ui-btn-icon-notext ui-btn-corner-all ui-shadow ui-btn-up-c ui-input-clear-hidden" title="清除文字" data-theme="c"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">清除文字</span><span class="ui-icon ui-icon-delete ui-icon-shadow"></span></span></a>');
        clearText.on('click', function() {
            searchKeyComp.val("");
            self.onSearch();
        });
        
        this.title = $('<div id="textSearch" class="ui-input-search ui-shadow-inset ui-btn-corner-all ui-btn-shadow ui-icon-search ui-body-c" style="' + style + '"></div>');
        this.title.append(searchKeyComp);
        this.title.append(clearText);
        
        this.headerActions = $('<a href="#" class="header-button header-button-icon header-button-right search" style="display: none"><button><img src="assets/img/search-icon.png" width="14" height="14"></button></a>');
        this.headerActions.on('click', function() {
            console.log(searchKeyComp.val());
        });
        
        this.searchHisList = new SearchHisList();
        this.searchHisList.findByName('');
        this.searchHisList.on("reset remove", function() {
            setTimeout(function() {
                window.viewNavigator.refreshScroller();
                self.displayCleanBtn(); 
            }, 20);
        }, this);
        new SearchHisListView({el: $('.searchHis', this.el), model: this.searchHisList, callback: this.searchHisSelected}).render();
        
        var self = this;
        //为了保证回调函数的上下文是本对象，需要如下处理：
        var searchTagSelectedCallback = function(searchTag) { self.searchTagSelected(searchTag); };
        this.searchTagList = new SearchTagList();
        this.searchTagList.on("reset", function() {
            setTimeout(function() {
                window.viewNavigator.refreshScroller();
            }, 20);
        }, this);
        new SearchTagListView({el: $('.searchTag', this.el), model: this.searchTagList, callback: searchTagSelectedCallback}).render();
        
        this.searchResultList = new Backbone.Collection();
        this.searchResultList.on("reset", function() {
            setTimeout(function() {
                window.viewNavigator.refreshScroller();
            }, 20);
        }, this);
        new SearchResultListView({el: $('.searchResult', this.el), model: this.searchResultList, callback: this.searchResultSelected}).render();
        
        var validTags = new SearchTagList();
        validTags.findByParent(0);
        new SearchTagListView({el: $('#allTags', this.el), model: validTags, callback: searchTagSelectedCallback}).render();
        
        var prefectTags = new SearchTagList();
        prefectTags.getPrefectNormal();
        new SearchTagListView({el: $('#prefectTags', this.el), model: prefectTags, callback: searchTagSelectedCallback}).render();
        
        return this;
    },
        
    initSearchView: function() {
        
        var self = this;
        setTimeout(function() {
            var gallery, i, page,
                dots = document.querySelectorAll('#nav li'),
                slides = ['#preSearch', '#prefectTags', '#allTags'];

            self.gallery = gallery = new SwipeView('#wrapper', {
                numberOfPages: slides.length
            });

            // Load initial data
            for (i = 0; i < 3; i++) {
                page = i === 0 ? slides.length - 1 : i - 1;
                gallery.masterPages[i].appendChild(document.querySelector(slides[page]));
            }            

            self.scroll = 'swipeview-masterpage-2';
            gallery.goToPage(1);

            gallery.onFlip(function() {
                self.displayCleanBtn();
                var el, upcoming, i;
                for (i = 0; i < 3; i++) {

                     upcoming = gallery.masterPages[i].dataset.upcomingPageIndex;
                     if (upcoming !== gallery.masterPages[i].dataset.pageIndex) {
                         el = gallery.masterPages[i].querySelector('div');
                         el.innerHTML = slides[upcoming];
                     }
                }

                $('#nav .selected').removeClass('selected');
                dots[gallery.pageIndex].className = 'selected';
                
                self.scroll = 'swipeview-masterpage-' + ((gallery.pageIndex + 1) % 3);             
                window.viewNavigator.resetScroller();
            });

            gallery.onMoveOut(function () {
                 gallery.masterPages[gallery.currentMasterPage].className = gallery.masterPages[gallery.currentMasterPage].className.replace(/(^|\s)swipeview-active(\s|$)/, '');
            });

            gallery.onMoveIn(function () {
                 var className = gallery.masterPages[gallery.currentMasterPage].className;
                 /(^|\s)swipeview-active(\s|$)/.test(className) || (gallery.masterPages[gallery.currentMasterPage].className = !className ? 'swipeview-active' : className + ' swipeview-active');
            });
        }, 0);
    },
    
    displayCleanBtn: function() {
        if(this.gallery.pageIndex === 0 && !($.trim(this.searchKeyComp.val()) || this.searchHisList.size() === 0)) {
            $('#cleanSearchHis', this.el).show();
            $('#wrapper', this.el).css('top', '40px');
        } else {
            $('#cleanSearchHis', this.el).hide();
            $('#wrapper', this.el).css('top', '10px');
        }
    },

    cleanSearchHis: function(event) {
        this.searchHisList.deleteAll();
    },
    
    onSearch: function(searchKey) {
        var key = $.trim(searchKey);
        this.searchHisList.findByName(key);
        this.searchTagList.findByName(key);
        this.searchByKeyword(key);
        if(key) {
            if(!this.displayHeaderActions) {
                this.displayHeaderActions = true;
                this.displaySearch(true);
                this.gallery.goToPage(0);
            }            
        } else {
            if(this.displayHeaderActions) {
                this.displayHeaderActions = false;
                this.displaySearch(false);
                this.gallery.goToPage(1);
            }            
        }
    },
        
    displaySearch: function(display) {
        if(display) {
            this.title.css('margin-right', '42px');
            this.headerActions.show();
            this.clearText.removeClass('ui-input-clear-hidden');
        } else {
            this.title.css('margin-right', '5px');
            this.headerActions.hide();
            this.clearText.addClass('ui-input-clear-hidden');
        }
    },
            
    searchByKeyword: function(key) {

        if(key) {
            
            var self = this;
            var options = {
                onSearchComplete: function(results) {
                    // 判断状态是否正确
                    if (local.getStatus() === BMAP_STATUS_SUCCESS) {
                        var s = new Array();
                        for (var i = 0; i < results.getCurrentNumPois(); i ++){
                            s[i] = results.getPoi(i);
                        }
                        
                        self.searchResultList.reset(s);
                    } else {
                        self.searchResultList.reset();
                    }
                }
            };
          
            var local = new BMap.LocalSearch(this.map, options);
            local.search(key, {forceLocal: true});
        } else {
            this.searchResultList.reset();
        }
    },
    
    searchHisSelected: function(searchHis) {
        searchHis.save();
    },
    
    searchTagSelected: function(searchTag) {
        new SearchHis({keyword: searchTag.get('name')}).save();

        var searchResultView = new SearchResultView({map: this.map, bounds: this.bounds, keyword: searchTag.get('name')});
        window.viewNavigator.pushView( searchResultView );
    },
    
    searchResultSelected: function(localResultPoi) {
        new SearchHis({keyword: localResultPoi.get('title'), longitude: localResultPoi.get('point').lng, latitude: localResultPoi.get('point').lat, address: localResultPoi.get('address')}).save();
    }
});