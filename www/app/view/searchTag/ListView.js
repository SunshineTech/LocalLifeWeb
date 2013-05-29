window.SearchTagListView = Backbone.View.extend({
    
    initialize: function(options) {
        this.disableInclude = options.disableInclude;
        this.callback = options.callback;
        this.model.on("reset", this.render, this);
    },
    
    events:{
        "click ul": "listItemClick"
    },
    
    render: function (eventName) {
        var ul = $('ul', this.el);
        ul.empty();
        _.each(this.model.models, function(searchTag) {
            ul.append(new SearchTagItemView({model: searchTag}).render().el);
        }, this);
        
        return this;
    },
        
    listItemClick: function( event ) {
        
        var target = $( event.target );
        if (target.get(0).nodeName.toUpperCase() !== "A") {
            target = target.parent();
        }
    
        var href = target.get(0).href;
        var tagId = href.substr(href.indexOf('#') + 1);
        
        var className = target.get(0).className;
        if(className.indexOf('list-disclosure') === 0) {

            if(this.target && this.target !== target) {
                this.sublist.hide();
                this.target.removeClass('sublist-open');
            }
        
            var targetLi = target.parent();
            var sublistEL = $('#tagList-' + tagId, this.el);
            if(sublistEL.length <= 0) {
                var sublist = $('<li class="subList" id="tagList-' + tagId + '"><ul class="tableview tableview-links"></ul></li>');
                targetLi.after(sublist);
                sublistEL = $('#tagList-' + tagId, this.el);
                
                var searchTagList = new SearchTagList();
                searchTagList.findByParent(tagId, this.disableInclude);
                var listView = new SearchTagListView({el: sublistEL, model: searchTagList, disableInclude: this.disableInclude, callback: this.callback});
                listView.render();               
            }
            
            if(className === 'list-disclosure') {
                target.addClass('sublist-open');
                sublistEL.show();
                this.target = target;
                this.sublist = sublistEL;
                if (window.viewNavigator.scroller !== null) {
                    window.viewNavigator.scroller.scrollToElement(targetLi.get(0), 100);
                }                
            } else {
                sublistEL.hide();
                target.removeClass('sublist-open');
            }
            window.viewNavigator.refreshScroller();
        } else if(className.indexOf('detail-disclosure') === 0) {
            this.callback(this.model.get(tagId));
        }
    
        return false;
    }
});