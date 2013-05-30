NativeUtil = {
    
    touchSupported: function() {
        return "ontouchstart" in window;
    },

    isTablet: function() {

        var win = $(window);
        var w = win.width();
        var h = win.height();
        var _w = Math.min( w,h );
        var _h = Math.max( w,h );
        
        //alert( _w );
        //alert( _h );

        return (_w > 640 && _h > 960 );
    },
        
    showAlert: function(message, title, buttonName) {
        if (navigator.notification) {
            navigator.notification.alert(
                message,
                null, // callback
                title ? title : "警告",
                buttonName ? buttonName : "知道了"
            );
        } else {
            alert((title ? title : "警告") + '\n\n' +  message);
        }
    },
        
    showConfirm: function(message, confirmCallback, title, buttonLabels) {
        if (navigator.notification) {
            function confirmCall(buttonIndex) {
                if(buttonIndex === 1) {
                    confirmCallback(true);
                } else {
                    confirmCallback(false);
                }
            };
            navigator.notification.confirm(
                message,
                confirmCall,
                title ? title : "确认",
                buttonLabels ? buttonLabels : "确定,点错了"
            );            
        } else {
            confirmCallback(confirm((title ? title : "确认") + '\n\n' +  message));
        }
    },
            
    getFileUrl: function(serverUrl, fileName, callback) {
        
        var path = 'LocalLife/' + fileName;
        if(window.requestFileSystem) {            
            window.requestFileSystem(
                LocalFileSystem.PERSISTENT, 0, 
                function onFileSystemSuccess(fileSystem) {
                     fileSystem.root.getFile(
                        path, {create: false, exclusive: true},
                        function gotFileEntry(fileEntry) {
                            console.log('File exists: ' + fileEntry.toURL());
                            callback && callback(fileEntry.toURL());
                        }, 
                        function FileNotExists(fileError) {
                            console.log('Find File Error: ' + fileError.code);
                            if(serverUrl) {
                                needDownload(fileSystem.root, function(needDownload) {
                                    if(needDownload === true)
                                        downloadFile(fileSystem.root);
                                    else
                                        callback && callback(serverUrl);
                                });
                            } else
                                callback && callback(serverUrl);                      
                        }
                     );
                }, 
                fail
            );
        } else
            callback && callback(serverUrl);
        
        function fail(fileError) {
            console.error('File Error: ' + fileError.code);
            callback && callback(serverUrl);
        }
        
        function downloadFile(directoryEntry) {
            directoryEntry.getFile(
                    path, {create: true, exclusive: false},
                    function gotFileEntry(fileEntry){
                        var sPath = fileEntry.fullPath;
                        //必须得删除创建的文件,否则,下载失败后，会有空文件
                        fileEntry.remove();
                        console.log(fileEntry.fullPath);
                        new FileTransfer().download(
                                encodeURI(serverUrl), sPath,
                                function(fileEntry) {
                                    console.log("download complete: " + fileEntry.toURL());
                                    callback && callback(fileEntry.toURL());
                                },
                                function(error) {
                                    console.error("Download Failure: [source: " + error.source + ", target: " + error.target + ", code: " + error.code + "]");
                                    callback && callback(serverUrl);
                                }
                        );
                    },
                    fail
            );
        }
        
        function needDownload(directoryEntry, callback) {
            var files = path.split('/');
            if(files.length > 1) {
                directoryExists(directoryEntry, files, 0, callback);
            } else
                callback(false);
        }
        
        function directoryExists(directoryEntry, files, idx, callback) {
            directoryEntry.getDirectory(
                    files[idx], {create: true, exclusive: false},
                    function gotDirectoryEntry(directoryEntry) {
                        idx++;
                        if(idx < files.length - 1)
                            directoryExists(directoryEntry, files, idx, callback);
                        else
                            callback(true);
                    },
                    function DirectoryNotExists(fileError) {
                        console.error('Find or Create Directory Error: ' + fileError.code);
                        callback(false);
                    }
            );
        }
    }
};