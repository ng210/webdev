(function() {
	var array = function() {
		Array.apply(this.arguments);
    };
    array.prototype = new Array;
	array.prototype.getClass = function() {
		return 'array';
	};
	array.prototype.compareTo = function(arr) {
		var res = this.length - arr.length;
	};
	array.prototype.apply = function(callback, args, filter) {
		var ret = -1;
		for (var i=0; i<this.length; i++) {
			var item = this[i];
			if (typeof filter !== 'function' || !filter.call(this, i, args)) {
				if (callback.call(this, i, args)) {
					ret = i;
					break;
				}
			}
		}
		return ret;
	};
	array.prototype.contains = function(item) {
		return (this.indexOf(item) != -1);
	};
	array.prototype.clone = function() {
		var clone = new this.constructor();
		for (var i=0; i<this.length; i++) {
			var item = this[i];
			clone.push(typeof item.clone === 'function' ? item.clone() : item.valueOf);
		}
		return clone;
	};
	module.exports = array;
})();
