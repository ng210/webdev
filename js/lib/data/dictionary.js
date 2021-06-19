(function() {

	function Dictionary() {
		this._map = {};
		this._keys = [];
		this.length = 0;
	}

	Dictionary.prototype.add = function add(key, value) {
		if (this._map[key] == undefined) {
			this.length++;
			this._keys.push(key);
		}
		this._map[key] = value;
	};
	Dictionary.prototype.remove = function remove(key) {
		if (this._map[key] != undefined) {
			this.length--;
			this._keys.slice(this._keys.indexOf(key), 1);
			delete this._map[key];
		}		
	};
	Dictionary.prototype.get = function get(key) {
		return this._map[key];
	};
	Dictionary.prototype.getAt = function getAt(ix) {
		return ix < this.length ? this._map[this._keys[ix]] : null;
	};
	Dictionary.prototype.containsKey = function containsKey(key) {
		return this._map[key] != undefined;
	};
	Dictionary.prototype.indexOf = function indexOf(key) {
		return this._keys.indexOf(key);
	};
	Dictionary.prototype.keys = function keys(callback) {
		callback = callback || (x => x);
		return this._keys.map(callback);
	};
	Dictionary.prototype.values = function values(callback) {
		var values = Object.values(this._map);
		if (typeof callback === 'function') {
			values = values.map(callback);
		}
		return values;
	};

	publish(Dictionary, 'Dictionary');
})();