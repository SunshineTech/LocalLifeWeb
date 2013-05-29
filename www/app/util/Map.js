/** 
 * Map对象，实现Map功能 
 *  
 *  
 * size() 获取Map元素个数  
 * isEmpty() 判断Map是否为空  
 * clear() 删除Map所有元素  
 * put(key, value) 向Map中增加元素（key, value)  
 * remove(key) 删除指定key的元素，成功返回true，失败返回false  
 * get(key) 获取指定key的元素值value，失败返回null  
 * element(index) 获取指定索引的元素（使用element.key，element.value获取key和value），失败返回null  
 * containsKey(key) 判断Map中是否含有指定key的元素  
 * containsValue(value) 判断Map中是否含有指定value的元素  
 * keys() 获取Map中所有key的数组（array）  
 * values() 获取Map中所有value的数组（array） 
 */
function Map() {

    this.elements = new Array();

    // 删除Map所有元素  
    this.clear = function() {
        this.elements = new Array();
    },
        
    // 判断Map中是否含有指定key的元素  
    this.containsKey = function(_key) {
        var bln = false;
        if (this._indexOf(_key) > -1) {
            bln = true;
        }

        return bln;
    },
    
    // 判断Map中是否含有指定value的元素  
    this.containsValue = function(_value) {
        var bln = false;
        try {
            for (x in this.elements) {
                if (_value.equals(this.elements[x].value)) {
                    bln = true;
                    break;
                }
            }
        } catch (e) {
        }

        return bln;
    },
        
    // 获取指定key的元素值value，失败返回null  
    this.get = function(_key) {
        var index = this._indexOf(_key);
        if (index > -1) {
            return this.elements[index].value;
        }

        return null;
    },
        
    // 判断Map是否为空  
    this.isEmpty = function() {
        return (this.elements.length < 1);
    },
        
    // 向Map中增加元素（key, value)  
    this.put = function(_key, _value) {
        var index = this._indexOf(_key);
        if (index > -1) {
            if (_value.equals(this.elements[index].value)) {
                //Do nothing
            } else {
                this.elements[index].value = _value;
            }
        } else {
            this.elements.push({
                key: _key,
                value: _value
            });
        }
    },
            
    // 删除指定key的元素，成功返回true，失败返回false  
    this.remove = function(_key) {
        var bln = false;
        var index = this._indexOf(_key);
        if (index > -1) {
            this.elements.splice(index, 1);
            bln = true;
        }

        return bln;
    },
        
    // 获取Map元素个数  
    this.size = function() {
        return this.elements.length;
    },
            
    // 获取指定索引的元素（使用element.key，element.value获取key和value），失败返回null  
    this.element = function(_index) {
        if (_index < 0 || _index >= this.elements.length) {
            return null;
        }
        return this.elements[_index];
    },
            
    // 获取Map中所有key的数组（array）  
    this.keys = function() {
        var arr = new Array();
        for (i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].key);
        }

        return arr;
    },
            
    // 获取Map中所有value的数组（array）  
    this.values = function() {
        var arr = new Array();
        for (i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].value);
        }
        return arr;
    },
            
    // 判断Map中指定key的元素的索引值  
    this._indexOf = function(_key) {
        var index = -1;
        try {
            for (x in this.elements) {
                if (_key.equals(this.elements[x].key)) {
                    index = x;
                    break;
                }
            }
        } catch (e) {
        }

        return index;
    };
}


