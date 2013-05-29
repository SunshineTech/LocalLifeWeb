templates.SearchResultView = "app/view/SearchResultView.html";

window.SearchResultView = Backbone.View.extend({
    
    backLabel: '返回',
    
    initialize: function(options) {
        this.map = options.map;
        this.center = options.center;
        this.bounds = options.bounds;
        this.title = options.keyword;
        this.render();
        this.view = this.$el;
    },
            
    render: function (eventName) {
        $(this.el).html(this.template());
        this.setElement(this.$("#searchResultView"));
        
        return this;
    },
            
    showCallback: function() {

        var options = {
                renderOptions: {panel: "searchResultView"},
                onSearchComplete: function(results) {
                    console.log(local.getStatus());
                }
            };
          
            var local = new BMap.LocalSearch(this.map, options);
            local.searchInBounds(this.title, this.bounds);
    }
});