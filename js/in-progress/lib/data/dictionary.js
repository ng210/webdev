(function() {

	function Dictionary() {
		Object.defineProperties(this, {
			'_keys': {
				configurable: false,
				writable: false,
				enumerable: false,
				value: []
			},
			'_map': {
				configurable: false,
				writable: false,
				enumerable: false,
				value: {}
			}
		});
	}

	Object.defineProperties(Dictionary.prototype, {
		'size': {
			configurable: false,
			enumerable: false,
			get() { return this._keys.length }
		}
	});
	Dictionary.prototype.add = Dictionary.prototype.put = Dictionary.prototype.set = function add(key, value) {
		if (this._map[key] == undefined) {
			this._keys.push(key);
		}
		this._map[key] = value;
	};
	Dictionary.prototype.remove = function remove(key) {
		if (this._map[key] != undefined) {
			this._keys.slice(this._keys.indexOf(key), 1);
			delete this._map[key];
		}		
	};
	Dictionary.prototype.get = function get(key) {
		return this._map[key];
	};
	Dictionary.prototype.getAt = function getAt(ix) {
		return ix < this.size ? this._map[this._keys[ix]] : null;
	};
	Dictionary.prototype.iterate = function iterate(action) {
		var result = false;
		for (var i=0; i<this._keys.length; i++) {
			var key = this._keys[i];
			if (result = action(key, this._map[key])) break;
		}
		return result;
	};
	Dictionary.prototype.containsKey = Dictionary.prototype.has = function containsKey(key) {
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
	Dictionary.prototype.deepCompare = function deepCompare(dict) {
		var result = self.deepCompare(this._keys, dict._keys);
		if (!result) {
			result = self.deepCompare(this._map, dict._map);
		}
		return result;
	};
	Dictionary.clone = function clone(d) {
		var res = new Dictionary();
		d.iterate( (k, v) => res.add(k, v));
		return res;
	};

	Dictionary.fromObject = function fromObject(obj, includeAll) {
		var dict = new Dictionary();
		for (var i in obj) {
			if (includeAll || obj.hasOwnProperty(i)) {
				dict.put(i, obj[i]);
			}
		}
		return dict;
	};

	publish(Dictionary, 'Dictionary');
})();