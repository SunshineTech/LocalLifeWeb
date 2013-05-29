window.SearchTag = Backbone.Model.extend({
 
    sync: function(method, model, options) {
        var dao = new SearchTagDAO();
        switch (method) {
            case "read":
                if(model.id) {
                    dao.findById(model.id, function(data) {
                        options.success(data);
                    });
                }
                break;
        }
    }
});

window.SearchTagList = Backbone.Collection.extend({
    
    model: SearchTag,
            
    findByParent: function(parentId, disableInclude) {
        var dao = new SearchTagDAO(),
            self = this;
        dao.findByParent(parentId, disableInclude, function(data) {
            self.reset(data);
        });
    },
    
    findByName: function(key) {
        var dao = new SearchTagDAO(),
            self = this;
        dao.findByName(key, function(data) {
            self.reset(data);
        });
    },
    
    getPrefectNormal: function() {
        var dao = new SearchTagDAO(),
            self = this;
        dao.getPrefectNormal(function(data) {
            self.reset(data);
        });
    },
    
    getPrefectNear: function() {
        var dao = new SearchTagDAO(),
            self = this;
        dao.getPrefectNear(function(data) {
            self.reset(data);
        });
    }
});