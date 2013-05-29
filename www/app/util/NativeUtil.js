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
    }
};