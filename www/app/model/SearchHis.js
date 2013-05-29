window.SearchHis = Backbone.Model.extend({
    
    idAttribute: [ "keyword","address" ],
    
    defaults: {
        keyword: '',
        longitude: '',
        latitude: '',
        address: ''
    },
    
    sync: function(method, model, options) {
        
        var dao = new SearchHisDAO();
        switch (method) {
            case "create":
            case "update":
                dao.save(model);
                break;
            case "delete":                
                if(model.id) {
                    dao.delete(model.get('keyword'), model.get('address'), function(data) {
                        options.success(data);
                    });
                }                
                    
                break;
        }
    }
});

window.SearchHisList = Backbone.Collection.extend({
    
    model: SearchHis,
    
    findByName: function(key) {
        var dao = new SearchHisDAO(),
            self = this;
        dao.findByName(key, function(data) {
            self.reset(data);
        });
    },
            
    deleteAll: function() {
        var dao = new SearchHisDAO(),
            self = this;
        dao.deleteAll(function() {
            self.reset();
        });
    }
});