(function() {
	function Map() {
	}
	extend(Object, Map);

	Object.defineProperties(Map.prototype, {
		'_keys': {
			configurable: false,
			enumerable: true,
			writable: false,
			value: []
		},
		'length': {
			configurable: false,
			enumerable: true,
			get() { return this._keys.length; }
		}
	});

	Map.prototype.add = function add(key, value) {
		var res = false;
		if (this._keys.indexOf(key) == -1) {
			this._keys.push(key);
			this[key] = value;
			res = true;
		}
		return res;
	};
	Map.prototype.remove = function remove(key) {
		var ix = this._keys.indexOf(key);
		return this.removeAt(ix);
	};
	Map.prototype.removeAt = function(ix) {
		var res = null;
		if (ix >= 0 && ix < this._keys.length) {
			res = this._keys.splice(ix, 1);
			delete this[this._keys[ix]];
		}
		return res;
	};
	Map.prototype.clear = function() {
		for (var i=0; i<this.length; i++) {
			delete this[this._keys[i]];
		}
		this._keys.length = 0;
	};
	Map.prototype.indexOf = function indexOf(key) {
		return this._keys.indexOf(key);
	};
	Map.prototype.getAt = function getAt(ix) {
		var res = null;
		if (ix < this._keys.length) {
			res = this[this._keys[ix]];
		}
		return res;
	};
	Map.prototype.containsKey = function containsKey(key) {
		return this.indexOf(key) != -1;
	};
	Map.prototype.sort = function(compare) {
		this._keys.sort(compare);
	};
	// Map.prototype.apply = function apply() {

	// };

	publish(Map, 'Map');
})();

/*******************************************************************************
 * Sort map items by key.
 * Arguments
 * 	fCompare: comparator function, method of elements in the array.
 * 		Type of function is [bool oItem::Function(oItem)].
 * 		If current object is smaller than oItem the returned value is negative.
 * 		If current object is equal to oItem the returned value is zero.
 * 		If current object is greater than oItem the returned value is positive.  
 * Returns
 ******************************************************************************/


// Map.fromObject = function(obj)
// {
// 	var map = new Map();
// 	obj.apply(
// 		function(i, args)
// 		{
// 			var v = this[i];
// 			if (typeof this[i] === 'object')
// 			{
// 				v = Map.fromObject(this[i]);
// 			}
// 			map.add(i, v);
// 			return true;
// 		},
// 		null,
// 		function(i, args)
// 		{
// 			return i == '_hashCode';
// 		}
// 	);
// 	return map;
// };
