(function() {

	function Map() {
		this._map = {};
		this.length = 0;
	}

	Map.prototype.add = function add(key, value) {
		if (this._map[key] == undefined) {
			this.length++;
		}
		this._map[key] = value;
	};
	Map.prototype.remove = function remove(key) {
		if (this._map[key] != undefined) {
			this.length--;
			delete this._map[key];
		}		
	};
	Map.prototype.get = function get(key) {
		return this._map[key];
	};
	Map.prototype.containsKey = function containsKey(key) {
		return this._map[key] != undefined;
	};
	Map.prototype.keys = function values(callback) {
		var keys = Object.keys(this._map);
		if (typeof callback === 'function') {
			keys = keys.map(callback);
		}
		return keys;
	};
	Map.prototype.values = function values(callback) {
		var values = Object.values(this._map);
		if (typeof callback === 'function') {
			values = values.map(callback);
		}
		return values;
	};

	publish(Map, 'Map');
})();