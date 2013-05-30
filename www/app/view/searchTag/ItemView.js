templates.SearchTagItemView = "app/view/searchTag/ItemView.html";

window.SearchTagItemView = Backbone.View.extend({
    
    className: "ui-btn ui-btn-icon-right ui-li ui-btn-up-c",
    tagName: "li",
    
    initialize: function() {
        this.model.bind("change", this.render, this);
    },
    
    render: function(eventName) {
        $(this.el).html(this.template(this.model.toJSON()));

        var self = this;
        var img = this.model.get('userImg') ? this.model.get('userImg') : this.model.get('img');
        if (img)
            NativeUtil.getFileUrl(
                    serverUrl + 'pub/media/' + img, img,
                    function(imgUrl) {
                        if(imgUrl)
                            $('<img height="36" width="36" class="list-icon"/>')
                                .attr('src', imgUrl)
                                .load(function() {  $('.imgHolder', self.el).html(this);} )
                                .on('error', function(event) { $('.imgHolder', self.el).remove(); });
                        else
                            $('.imgHolder', self.el).remove();
                    }
            );
        else
            $('.imgHolder', self.el).remove();

        return this;
    }
});