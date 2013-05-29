templates.SearchTagSetView = "app/view/searchTag/SetView.html";

window.SearchTagSetView = Backbone.View.extend({
    
    className: 'striped',
    backLabel: '返回',
    title: '搜索标签设置',
    
    initialize: function(options) {
        this.model = new SearchTagList();
        this.model.findByParent(0, true);
        this.render();
        this.view = this.$el;
    },
    
    render: function(eventName) {
        $(this.el).html(this.template(this.model.toJSON()));
        
        this.listView = new SearchTagListView({el: $('#searchTagSetView', this.el), model: this.model, disableInclude: true, callback: this.editTag});
        this.listView.render();
        
        return this;
    },
        
    editTag: function(tagId) {
        console.log("Do Nothing " + tagId);
    }
});