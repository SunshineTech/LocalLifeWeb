var BaiduMap = window.BaiduMap = BaiduMap || {};

(function() {
    BaiduMap.MAP_MINLEVEL = 3;
    BaiduMap.MAP_MAXLEVEL = 19;
    /**
     * GPS坐标系类型
     */
    BaiduMap.COORD_TYPE_GPS  = 0;
    
    /**
     * Google 坐标系类型
     */
    BaiduMap.COORD_TYPE_GOOGLE = 2;
    
    var Convertor = BaiduMap.Convertor = {};
    
    Convertor.translate = function(p, type, callback) {
        var callbackName = 'cbk_' + Math.round(Math.random() * 10000);
        Convertor[callbackName] = function(json) {
            if(json && json instanceof Array){
                for(var i = 0; i < json.length; i++){
                    var item = json[i];
                    if(item && item.error === 0){
                        var newPt = new BMap.Point(item.x, item.y);
                        Position = cordova.require('cordova/plugin/Position');
                        var pos = {
                            coords: {
                                latitude: newPt.lat,
                                longitude: newPt.lng,
                                altitude: p.coords.altitude,
                                accuracy: p.coords.accuracy,
                                heading: p.coords.heading,
                                velocity: p.coords.velocity,
                                altitudeAccuracy: p.coords.altitudeAccuracy
                            },
                            timestamp: (p.timestamp === undefined ? new Date() : ((p.timestamp instanceof Date) ? p.timestamp : new Date(p.timestamp)))
                        };
                        console.info("The cord translated: (" + pos.coords.longitude + ", " + pos.coords.latitude + ", " + pos.coords.accuracy + ").");
                        callback && callback(pos);
                    }
                }
            }
            
            delete BaiduMap.Convertor[callbackName];    //调用完需要删除改函数
        };    
        var xyUrl = "http://api.map.baidu.com/ag/coord/convert?x=" + p.coords.longitude + "&y=" + p.coords.latitude + "&from=" + type + "&to=4&mode=1&ie=utf-8&oue=1&res=api&&callback=BaiduMap.Convertor." + callbackName;
        console.info("The request of coord translation: " + xyUrl);
        createScript(xyUrl);
    };
    
    function createScript(url) {
        
        var script = document.createElement("script");
        script.src = url;
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('charset', 'utf-8');

        // 脚本加载完成后进行移除
        if (script.addEventListener) {
            script.addEventListener('load', function(e) {
                var t = e.target;
                t.parentNode.removeChild(t);
            }, false);
        } else if (script.attachEvent) {
            script.attachEvent('onreadystatechange', function(e) {
                var t = window.event.srcElement;
                if (t && (t.readyState === 'loaded' || t.readyState === 'complete')) {
                    t.parentNode.removeChild(t);
                }
            });
        }
        // 使用setTimeout解决ie6无法发送问题
        setTimeout(function() {
            document.getElementsByTagName('head')[0].appendChild(script);      
            script = null;
        }, 1);
      }
    
    var GeolocationControl = BaiduMap.GeolocationControl = function(options) {
        this.defaultAnchor = BMAP_ANCHOR_TOP_LEFT;
        this.defaultOffset = new BMap.Size(2, 2);
        options = options || {};
        this.options = {enableAutoLocation: options.enableAutoLocation, locationIcon: options.locationIcon};
    };
    
    GeolocationControl.prototype = new BMap.Control();
    
    GeolocationControl.prototype.toString = function() {
        return 'BaiduMap.GeolocationControl';
    };
    
    GeolocationControl.prototype.initialize = function(map) {
        
        var map = this._map = map;
        var div = document.createElement("div");
        div.innerHTML = "<img src='assets/img/locatetool-1.png'/>";
        var me = this;
        div.onclick = function() {
            if(me.isLocating) {
                this.innerHTML = "<img src='assets/img/locatetool-1.png'/>";
                me.isLocating = false;
                me.getGeo().clearWatch(me.watchId);
                console.debug("Locating stopped");
            } else {
                this.innerHTML = "<img src='assets/img/locatetool-2.png'/>";
                me.isLocating = true;
                me.location();
            }
        };
        map.getContainer().appendChild(div);        
        
        if(this.options.enableAutoLocation) {
            div.innerHTML = "<img src='assets/img/locatetool-2.png'/>";
            this.isLocating = true;
            map.addEventListener("tilesloaded", locate(me));
        }
        
        return div;
    };

    function locate(me) {
        console.info("Map loaded, stopping listener and starting location.");
        me._map.removeEventListener("tilesloaded", locate);
        me.location();
    };
    
    GeolocationControl.prototype.getGeo = function() {
        if(this.isExplorerLocate()) {
            console.debug("Explorer locate");
            return navigator.geolocation;
        } else {
            console.debug("Not explorer locate");
            return cordova.require('cordova/plugin/geolocation');
        }
    };

    GeolocationControl.prototype.isExplorerLocate = function() {
        return window.localStorage.getItem("location_way") === "Explorer";  
    };
    
    GeolocationControl.prototype.location = function() {
        console.debug("Locate watching");
        var me = this;
        this.watchId = this.getGeo().watchPosition(function(position) {onGeoSuccess(position, me);}, this.locationError, { maximumAge: 6000, timeout: 60000, enableHighAccuracy: true });
    };

    function onGeoSuccess(position, me) {
        
        if(me.isExplorerLocate()) {
            console.info("Explorer locate, it need to be translated into Baidu Coord.");
            Convertor.translate(position, BaiduMap.COORD_TYPE_GPS, function(ps) { me.locationSuccess(ps); });
        } else {
            me.locationSuccess(position);
        }
    }
    
    GeolocationControl.prototype.locationSuccess = function(position) {
        console.info("Locate success: (" + position.coords.longitude + ", " + position.coords.latitude + ", " + position.coords.accuracy + ")");
        var newPt = new BMap.Point(position.coords.longitude, position.coords.latitude);
        window.localStorage.setItem("mypostion_longitude", position.coords.longitude);
        window.localStorage.setItem("mypostion_latitude", position.coords.latitude);
        this._map.panTo(newPt);
        if(this.centerMarker) {
            //window.infoWin.hide();
            this.centerMarker.setPosition(newPt);
        } else {
            this.centerMarker = new BMap.Marker(newPt, {icon: this.options.locationIcon, enableMassClear: false});
            this.centerMarker.addEventListener("click", function() {
                window.overlayClicked = true;
                window.infoWin.open(this);
                var address = "我的位置<br>精确到" + parseInt(position.coords.accuracy) + "米";
                //var address = '<ul style="margin: 0; color: #FFFFFF;"><li style="font-size: 1em;">我的位置</li><li style="font-size: 0.8em;">精确到' + parseInt(position.coords.accuracy) + '米</li></ul>';
                window.infoWin.setName(address, {"font-size": "1em"});
            });
            this._map.addOverlay(this.centerMarker);
        }
        
        if(this.centerCircle) {
            this.centerCircle.setCenter(newPt);
        } else {
            this.centerCircle = new BMap.Circle(newPt, position.coords.accuracy, {fillColor: "#e3e3ef", strokeWeight: 1, fillOpacity: 0, enableMassClear: false});
            this.centerCircle.addEventListener("click", function() {
                window.overlayClicked = true;
                console.log('centerCircle');
            });
            this._map.addOverlay(this.centerCircle);
        }     
    };

    GeolocationControl.prototype.locationError = function(error) {
        console.warn("Locate error: " + error.code + ": " +  error.message);
    };
    /**
    var MarkToolControl = BaiduMap.MarkToolControl = function() {
        this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;
        this.defaultOffset = new BMap.Size(2, 28);
    };

    MarkToolControl.prototype = new BMap.Control();

    MarkToolControl.prototype.initialize = function(map) {
        
        var div = this._div = document.createElement("div");
        div.innerHTML = "<img src='assets/img/marktool-1.png'/>";
        var me = this;
        div.onclick = function() {
            console.log("MarkToolControl clicked");
            me.changeStatus();
        };
        map.getContainer().appendChild(div);
        
        map.addEventListener("click", function(e) {
            me.onMapClick(e);
        });
        
        return div;
    };

    MarkToolControl.prototype.changeStatus = function() {
        if(this.markable) {
            this._div.innerHTML = "<img src='assets/img/marktool-1.png'/>";
            this.markable = false;
        } else {
            this._div.innerHTML = "<img src='assets/img/marktool-2.png'/>";
            this.markable = true;
        }
    };

    MarkToolControl.prototype.onMapClick = function(e) {
        
        if(!markers) {
            markers = new Map();
        }

        if(this.markable) {
            this.changeStatus();

            var map = e.target;
            var point = e.point;
            map.panTo(point);
            var mark = new BMap.Marker(point, {offset: new BMap.Size(0, -15), icon: new BMap.Icon("assets/img/mark.png", new BMap.Size(30, 30))});
            mark.addEventListener("click", function() { openInfoWin(this); });
            map.addOverlay(mark);

            new BMap.Geocoder().getLocation(point, function(rs) {
                markers.put(point, rs);
                //openInfoWin(mark);
                setTimeout(function() {openInfoWin(mark);}, 500);
            });                
        }
    };

    function openInfoWin(mark) {
        //一定要先打开,再更改内容
        window.infoWin.open(mark);
        var rs = markers.get(mark.getPosition());
        if(rs) {
            var addComp = rs.addressComponents;
            var address = addComp.street + addComp.streetNumber;
            if(!address) {
                address = rs.address;
            }
            
            for(x in rs.surroundingPois) {
                console.log(x + " " + rs.surroundingPois[x].title);
            }
        }
        if(!address) {
            address = "未知位置";
        }
        
        window.infoWin.setName(address, {"font-size": "1.2em", "line-height": "40px"});
    };
    **/
    var ScaleControl = BaiduMap.ScaleControl = function() {
        this.defaultAnchor = BMAP_ANCHOR_BOTTOM_LEFT;
        this.defaultOffset = new BMap.Size(5, 30);
    };
   
    ScaleControl.prototype = new BMap.Control();
   
    ScaleControl.prototype.toString = function() {
        return 'BaiduMap.ScaleControl';
    };

    ScaleControl.prototype.initialize = function(map) {
        
        var div = document.createElement("div");
        div.innerHTML = "<img src='assets/img/scale-" + map.getZoom() + ".png'/>";
        map.getContainer().appendChild(div);
        
        var me = this;
        map.addEventListener("zoomend", function() {
            div.innerHTML = "<img src='assets/img/scale-" + this.getZoom() + ".png'/>";
        });
    
        return div;
    };
    
    var NavigationControl = BaiduMap.NavigationControl = function() {
        this.defaultAnchor = BMAP_ANCHOR_BOTTOM_RIGHT;
        this.defaultOffset = new BMap.Size(2, 30);
    };

    NavigationControl.prototype = new BMap.Control();
    
    NavigationControl.prototype.toString = function() {
        return 'BaiduMap.NavigationControl';
    };

    NavigationControl.prototype.initialize = function(map) {
        
        var div = document.createElement("div");
        
        var zoomCtl = this._zoomCtl = document.createElement("div");
        zoomCtl.onclick = function() {
            if(map.getZoom() < BaiduMap.MAP_MAXLEVEL) {
                map.zoomIn();
            }
        };
    
        var narrowCtl = this._narrowCtl = document.createElement("div");
        narrowCtl.onclick = function() {
            if(map.getZoom() > BaiduMap.MAP_MINLEVEL) {
                map.zoomOut();
            }
        };
    
        this.changeStatus(map);
        
        div.appendChild(zoomCtl);
        div.appendChild(narrowCtl);
        map.getContainer().appendChild(div);
        
        var me = this;
        map.addEventListener("zoomend", function() {
            me.changeStatus(this);
            window.localStorage.setItem("mymap_level", this.getZoom());            
        });
    
        return div;
    };

    NavigationControl.prototype.changeStatus = function(map) {

        var mapLevel = map.getZoom();
        if(mapLevel >= BaiduMap.MAP_MAXLEVEL) {
            this._zoomCtl.innerHTML = "<img src='assets/img/zoom-1.png'/>";
            this._zoomable = false;
        } else {
            if(!this._zoomable) {
                this._zoomCtl.innerHTML = "<img src='assets/img/zoom-2.png'/>";
                this._zoomable = true;
            }            
        }
    
        if(mapLevel <= BaiduMap.MAP_MINLEVEL) {
            this._narrowCtl.innerHTML = "<img src='assets/img/narrow-1.png'/>";
            this._narrowable = false;
        } else {
            if(!this._narrowable) {
                this._narrowCtl.innerHTML = "<img src='assets/img/narrow-2.png'/>";
                this._narrowable = true;
            }            
        }
    };
    
    var InfoWindow = BaiduMap.InfoWindow = function(map) {
        
        var sContent = '<div class="windowInfo">' +
                            '<div class="nearBy"/>' +
                            '<div class="split1"/>' +
                            '<div class="address"/>' +
                            '<div class="split2"/>' +
                            '<div class="fromTo"/>' +
                       '</div>' +
                       '<div class="tip"></div>';
        
        BMapLib.InfoBox.call(this, map, sContent, {
            enableAutoPan: true
        });
    };

    InfoWindow.prototype = new BMapLib.InfoBox();

    InfoWindow.prototype.setName = function(name, styles) {
        console.log(name);
        var style = "";
        for (var key in styles) {
            style += key + ": " + styles[key] + ";";
        }
        
        var sContent = '<div class="windowInfo">' +
                            '<div class="nearBy"></div>' +
                            '<div class="split1"></div>' +
                            '<div class="fromTo"></div>' +
                            '<div class="split2"></div>' +            
                            '<div class="address"' + (style ? ' style="' + style + '"' : '') + '>' + name + '</div>' +
                       '</div>' +
                       '<div class="tip"></div>';
        this.setContent(sContent);
    };
})();