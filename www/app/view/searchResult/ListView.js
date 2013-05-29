window.SearchResultListView = Backbone.View.extend({
    
    initialize: function(options) {

        this.callback = options.callback;
        this.model.on("reset", this.render, this);
    },
    
    events: {
        "click ul": "listItemClick"
    },
    
    render: function(eventName) {

        var ul = $('ul', this.el);
        ul.empty();
        _.each(this.model.models, function(poi) { 
            ul.append(new SearchResultItemView({model: poi}).render().el);
        }, this);

        return this;
    },
    
    listItemClick: function(event) {

        var target = $(event.target);
        if (target.get(0).nodeName.toUpperCase() !== "A") {
            target = target.parent();
        }
        
        if(target.get(0).className.indexOf('detail-disclosure') === 0)
            this.callback(this.model.at($('li', this.el).index(target.parent())));

        return false;
    }
});