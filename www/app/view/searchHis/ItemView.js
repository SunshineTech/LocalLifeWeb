templates.SearchHisItemView = "app/view/searchHis/ItemView.html";

window.SearchHisItemView = Backbone.View.extend({
    
    className: "ui-btn ui-btn-icon-right ui-li ui-btn-up-c",
    tagName: "li",
    
    initialize: function() {
        this.model.bind("change", this.render, this);
    },
    
    render: function(eventName) {
        $(this.el).html(this.template(this.model.toJSON()));
        
        return this;
    }
});