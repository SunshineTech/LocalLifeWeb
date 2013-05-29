window.SearchHisDAO = function() {
    this.db = window.openDatabase("LocalLifeDB", "1.0", "Local Life DB", 200000);
};

_.extend(SearchHisDAO.prototype, {
    
    _getResults: function(tx, results, callback) {

        var len = results.rows.length,
                hises = [],
                i = 0;

        for (; i < len; i = i + 1) {
            hises[i] = results.rows.item(i);
        }

        callback(hises);
    },
            
    findByName: function(key, callback) {

        var self = this;
        this.db.transaction(
            function(tx) {
                var sql = "SELECT keyword, longitude, latitude, address " +
                        "FROM searchHis " +
                        "WHERE keyword LIKE ? " +
                        "ORDER BY lastVisited DESC";

                tx.executeSql(sql, [key + '%'], function(tx, results) {
                    self._getResults(tx, results, callback);
                });
            },
            function(tx) {
                NativeUtil.showAlert(tx.message, "查询搜索历史时出错");
            }
        );       
    },
    
    save: function(searchHis, callback) {
        
        var self = this;
        this.db.transaction(
            function(tx) {
                var sql = "INSERT OR REPLACE INTO searchHis " +
                    "(keyword, longitude, latitude, address, lastVisited) " +
                    "VALUES (?, ?, ?, ?, ?)";

                var params = [searchHis.get('keyword'), searchHis.get('longitude'), searchHis.get('latitude'), searchHis.get('address'), new Date()];
                tx.executeSql(sql, params);
                if(callback)
                    callback();
            },
            function(tx) {
                console.log('Save Error (' + tx.message + ')');
                NativeUtil.showAlert(tx.message, "保存搜索历史数据时出错");
            }
        );
    },
    
    delete: function(keyword, address, callback) {
        
        this.db.transaction(
            function(tx) {
                var sql = "DELETE FROM searchHis " +
                        "WHERE keyword = ? AND address = ?";
                
                tx.executeSql(sql, [keyword, address]);
                if(callback)
                    callback();
            },
            function(tx) {
                NativeUtil.showAlert(tx.message, "删除搜索历史时出错");
            }
        );        
    },
    
    deleteAll: function(callback) {
        
        this.db.transaction(
            function(tx) {
                var sql = "DELETE FROM searchHis";

                tx.executeSql(sql, []);
                if(callback)
                    callback();
            },
            function(tx) {
                NativeUtil.showAlert(tx.message, "删除搜索历史时出错");
            }
        );        
    },
    
    // Check if searchTag table exists
    isInitialized: function(callback) {

        this.db.transaction(
                function(tx) {
                    var sql = "SELECT name FROM sqlite_master WHERE type='table' AND name=:tableName";
                    tx.executeSql(sql, ['searchHis'], function(tx, results) {
                        if (results.rows.length === 1) {
                            console.log('Database is initialized');
                            callback(true);
                        } else {
                            console.log('Database is not initialized');
                            callback(false);
                        }
                    });
                },
                function(tx) {
                    NativeUtil.showAlert(tx.message, "查询主表时出错");
                }
        );
    },
    
    initialize: function(callback) {
        var self = this;
        this.isInitialized(function(result) {
            if (result) {
                if (callback)
                    callback();
            } else {
                self.createTable(callback);
            }
        });
    },
            
    createTable: function(callback) {
        this.db.transaction(
                function(tx) {
                    var sql = "CREATE TABLE IF NOT EXISTS searchHis ( " +
                            "keyword VARCHAR(30), " +
                            "longitude VARCHAR(20), " +
                            "latitude VARCHAR(20), " +
                            "address VARCHAR(100), " +
                            "lastVisited VARCHAR(50), " + 
                            "PRIMARY KEY (keyword, address))";

                    tx.executeSql(sql);
                },
                function(tx) {
                    NativeUtil.showAlert(tx.message, "生成数据表出错");
                },
                function(tx) {
                    if (callback)
                        callback();
                }
        );
    },
    
    dropTable: function(callback) {
        this.db.transaction(
                function(tx) {
                    console.log('Dropping searchHis table');
                    tx.executeSql('DROP TABLE IF EXISTS searchHis');
                },
                function(tx) {
                    NativeUtil.showAlert(tx.message, "删除搜索历史表时出错");
                },
                function() {
                    console.log('Table searchHis successfully DROPPED in local SQLite database');
                    callback();
                }
        );
    },
    
    reset: function(callback) {
        var self = this;
        this.dropTable(function() {
            self.initialize(callback);
        });
    }
});