templates.MapView = "app/view/MapView.html";

window.MapView = Backbone.View.extend({
    
    scroll: false,
    
    initialize: function(options) {
        this.render();
        this.view = this.$el;
        this.initMap();
    },
        
    events:{
        "click a": "openExternalLink"
    },
        
    render: function (eventName) {

        $(this.el).html(this.template());
        this.setElement(this.$("#mapView"));
        
        var style = " ";
        if ( window.viewNavigator && window.viewNavigator.history.length >= 1 ) {
            this.backLabel = '返回';
            style = "margin-left: 65px;";
        }
        this.title = $('<div id="goSearch" class="ui-input-search ui-shadow-inset ui-btn-corner-all ui-btn-shadow ui-icon-search ui-body-c" style="' + style + '">地点、顺风车、出租车、餐饮、住宿、购物</div>');
        var self = this;
        this.title.on( "click", function(){
            var serchView = new SearchView({map: self.map, bounds: self.map.getBounds()});
            window.viewNavigator.pushView( serchView );
        } );        
        
        return this;
    },
    
    initMap: function() {
        if(typeof(BMap) === 'undefined') {
            NativeUtil.showAlert("不能获取到地图，请确认网络状况并稍后重试！", "获取地图错误");
            return false;
        }
        var self = this;
        setTimeout( function() {
            var map = self.map = new BMap.Map('map', {enableHighResolution: false});

            window.infoWin = new BaiduMap.InfoWindow(map);            

            var point = new BMap.Point(116.404, 39.915);
            if (window.localStorage.getItem("mypostion_latitude") && window.localStorage.getItem("mypostion_longitude")) {
                point = new BMap.Point(window.localStorage.getItem("mypostion_longitude"), window.localStorage.getItem("mypostion_latitude"));
            }
            var mapLevel = BaiduMap.MAP_MAXLEVEL - 1;
            if (window.localStorage.getItem("mymap_level")) {
                //坑爹啊！必须转化成整数，否则需要先缩小才能放大!!切记!!!
                mapLevel = parseInt(window.localStorage.getItem("mymap_level"));
            }
            map.centerAndZoom(point, mapLevel);

            map.enableScrollWheelZoom();
            map.enableKeyboard();
            map.enableInertialDragging();
            map.enableContinuousZoom();
            
            map.addEventListener("click", self.onMapClick);

            map.addControl(new BaiduMap.GeolocationControl({enableAutoLocation: true, locationIcon: new BMap.Icon("assets/img/center.png", new BMap.Size(18, 18)) }));
            map.addControl(new BMap.MapTypeControl({ anchor: BMAP_ANCHOR_TOP_RIGHT, offset: new BMap.Size(2, 2) }));
            map.addControl(new BaiduMap.ScaleControl());
            map.addControl(new BaiduMap.NavigationControl());
        }, 0);
    },
          
    openExternalLink: function (event) {
                       
    	event.stopImmediatePropagation();
        event.preventDefault();

	return false;
    },
    
    onMapClick: function(e) {
        if(window.overlayClicked) {
            console.log("overlayClicked");
            window.overlayClicked = false;
        } else {
            console.log("Not overlayClicked");
        }
    }
});