window.SearchTagDAO = function() {
    this.db = window.openDatabase("LocalLifeDB", "1.0", "Local Life DB", 200000);
};

_.extend(SearchTagDAO.prototype, {
    
    _getResults: function(tx, results, callback) {
        
        var len = results.rows.length,
                tags = [],
                i = 0;
        
        for (; i < len; i = i + 1) {
            tags[i] = results.rows.item(i);
        }
 
        callback(tags);
    },
        
    findById: function(id, callback) {
    
        var self = this;
        this.db.transaction(
            function(tx) {
                var sql = "SELECT id, name, userImg, img, priority, normalPriority, nearPriority, parentId, isActive " +
                        "FROM searchTag " +
                        "WHERE id = ? ";
                
                tx.executeSql(sql, [id], function(tx, results) { self._getResults(tx, results, callback); });
            },
            function(tx) { NativeUtil.showAlert(tx.message, "查询标签时出错"); }
        );
    },
    
    findByParent: function(parentId, disableInclude, callback) {
        
        var self = this;
        this.db.transaction(
            function(tx) {
                var sql = "SELECT t.id, t.name, t.userImg, t.img, count(s.id) subCount " +
                        "FROM searchTag t LEFT JOIN searchTag s ON s.parentId = t.id AND s.isActive = 1 " +
                        "WHERE t.isActive = 1 AND t.parentId = ? " +
                        "GROUP BY t.id ORDER BY t.priority";
                
                if(disableInclude) {
                    
                    sql = "SELECT t.id, t.name, t.userImg, t.img, count(s.id) subCount " +
                            "FROM searchTag t LEFT JOIN searchTag s ON s.parentId = t.id " +
                            "WHERE t.parentId = ? " +
                            "GROUP BY t.id ORDER BY t.priority";
                }
                
                tx.executeSql(sql, [parentId], function(tx, results) { self._getResults(tx, results, callback); });
            },
            function(tx) { NativeUtil.showAlert(tx.message, "查询下级标签时出错"); }
        );
    },
    
    findByName: function(key, callback) {
        
        if(key) {
            var self = this;
            this.db.transaction(
                function(tx) {
                    var sql = "SELECT id, name, userImg, img, 0 subCount " +
                            "FROM searchTag " +
                            "WHERE name LIKE ? " +
                            "ORDER BY priority";

                    tx.executeSql(sql, [key + '%'], function(tx, results) { self._getResults(tx, results, callback); });
                },
                function(tx) { NativeUtil.showAlert(tx.message, "查询标签时出错"); }
            );
        } else {
            callback();
        }        
    },
    
    getPrefectNormal: function(callback) {
        
        var self = this;
        this.db.transaction(
            function(tx) {
                var sql = "SELECT id, name, userImg, img, 0 subCount " +
                        "FROM searchTag " +
                        "WHERE normalPriority > 0 " +
                        "ORDER BY normalPriority";
                
                tx.executeSql(sql, [], function(tx, results) { self._getResults(tx, results, callback); });
            },
            function(tx) { NativeUtil.showAlert(tx.message, "查询普通搜索推荐标签时出错"); }
        );
    },
    
    getPrefectNear: function(callback) {
        
        this.db.transaction(
            function(tx) {
                var sql = "SELECT id, name, userImg, img " +
                        "FROM searchTag " +
                        "WHERE nearPriority > 0 " +
                        "ORDER BY nearPriority";
                
                tx.executeSql(sql, [], function(tx, results) { self._getResults(tx, results, callback); });
            },
            function(tx) { NativeUtil.showAlert(tx.message, "查询附近搜索标签时出错"); }
        );
    },

    // Check if searchTag table exists
    isInitialized: function(callback) {
        
        this.db.transaction(
            function(tx) {
                var sql = "SELECT name FROM sqlite_master WHERE type='table' AND name=:tableName";
                tx.executeSql(sql, ['searchTag'], function(tx, results) {
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
                self.sync(callback);
            } else {
                self.createTable(function() {
                    self.sync(callback);
                });
            }
        });
    },

    createTable: function(callback) {
        this.db.transaction(
             function(tx) {
                var sql = "CREATE TABLE IF NOT EXISTS searchTag ( " +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                        "name VARCHAR(10), " +
                        "userImg VARCHAR(50), "  + //用户定义图片
                        "img VARCHAR(50), "  +                        
                        "priority INTEGER, " +  //优先级
                        "normalPriority INTEGER, " + //普通搜索推荐优先级
                        "nearPriority INTEGER, " + //附近搜索推荐优先级
                        "parentId INTEGER, " + //上级类别Id
                        "isActive INTEGER, " + //是否启用
                        "lastModified VARCHAR(50))";
                        
                tx.executeSql(sql);
            },
            function(tx) { NativeUtil.showAlert(tx.message, "生成数据表出错"); },
            function(tx) { callback(); }
        );
    },

    getLastSync: function(callback) {
        this.db.transaction(
            function(tx) {
                tx.executeSql("SELECT MAX(lastModified) lastSync FROM searchTag", [],
                    function(tx, results) {
                        var lastSync = results.rows.item(0).lastSync;
                        console.log('Last local timestamp is ' + lastSync);
                        callback(lastSync);
                    }
                );
            },
            function(tx) { NativeUtil.showAlert(tx.message, "查询标签最后更新时间出错"); }
        );
    },

    sync: function(callback) {

        var self = this;
        console.log('Starting synchronization...');
        this.getLastSync(function(lastSync) {
            var syncURL = serverUrl + 'lbs/searchTag/';
            self.getChanges(syncURL, lastSync,
                function (changes) {
                    if (changes.length > 0) {
                        self.applyChanges(changes, callback);
                    } else {
                        console.log('Nothing to synchronize');
                        if(callback)
                            callback(0);
                    }
                }
            );
        });
    },

    getChanges: function(syncURL, modifiedSince, callback) {
        console.log("Getting server changes since  " + modifiedSince + " at " + syncURL);
        
        var isneedtoKillAjax = true;
        setTimeout(function() {
            checkajaxkill();
        }, 5000);
        
        var myAjaxCall = $.getJSON(
            syncURL + "?modifiedSince=" + modifiedSince + "&format=json&jsoncallback=?",
            function (data) {
                isneedtoKillAjax = false;
                console.log("The server returned " + data.length + " changes that occurred after " + modifiedSince);
                callback(data);
            }
        );
            
        function checkajaxkill() {
            if(isneedtoKillAjax) {
                myAjaxCall.abort();
                NativeUtil.showAlert("同步搜索标签数据超时，请确认网络状况并稍后重试！", "同步错误");                 
            }
        }
    },

    applyChanges: function(tags, callback) {
        this.db.transaction(
            function(tx) {
                var l = tags.length;
                var sql =
                    "INSERT OR REPLACE INTO searchTag " +
                    "(id, name, userImg, img, priority, normalPriority, nearPriority, parentId, isActive, lastModified) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                console.log('Inserting or Updating in local database:');
                var tag;
                for (var i = 0; i < l; i++) {
                    tag = tags[i];
                    console.log(tag.id + ' ' + (tag.name ? tag.name : tag.default_name) + ' ' + (tag.user_img ? tag.user_img : '') +  ' ' + tag.img + ' ' + tag.priority + ' ' + tag.normal_priority + ' ' + tag.near_priority + ' ' + tag.parent_id);
                    var params = [tag.id, tag.name ? tag.name : tag.default_name, tag.user_img ? tag.user_img : '', tag.img, tag.priority, tag.normal_priority, tag.near_priority, tag.parent_id, tag.is_active, tag.updated_at];
                    tx.executeSql(sql, params);                    
                }
                console.log('Apply Changes complete (' + l + ' items applied)');
                if(callback)
                    callback(l);
            },
            function(tx) {
                console.log('Apply Changes Error (' + tx.message + ')');
                NativeUtil.showAlert(tx.message, "更新标签数据时出错");
            }
        );
    },
    
    dropTable: function(callback) {
        this.db.transaction(
            function(tx) {
                console.log('Dropping searchTag table');
                tx.executeSql('DROP TABLE IF EXISTS searchTag');
            },
            function(tx) { NativeUtil.showAlert(tx.message, "删除标签表时出错"); },
            function() {
                console.log('Table searchTag successfully DROPPED in local SQLite database');
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