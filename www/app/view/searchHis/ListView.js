window.SearchHisListView = Backbone.View.extend({
    
    initialize: function(options) {

        this.callback = options.callback;
        this.model.on("reset remove", this.render, this);
    },
    
    events: {
        "click ul": "listItemClick"
    },
    
    render: function(eventName) {

        var ul = $('ul', this.el);
        ul.empty();
        _.each(this.model.models, function(searchHis) {
            ul.append(new SearchHisItemView({model: searchHis}).render().el);
        }, this);
        
        return this;
    },
    
    listItemClick: function(event) {

        var target = $(event.target);
        if (target.get(0).nodeName.toUpperCase() !== "A") {
            target = target.parent();
        }
        //在Android上，不能使用this.model.get(keyword)的方式得到当前点击项
        var searchHis = this.model.at($('li', this.el).index(target.parent()));
        var className = target.get(0).className;
        if (className === 'delete-disclosure') {
            var self = this;
            searchHis.destroy({success: function(model, response) {
                    self.model.remove(model);
            }});
        } else if(className.indexOf('detail-disclosure') === 0) {
            this.callback(searchHis);
        }

        return false;
    }
});