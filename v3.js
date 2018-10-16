// 3d vector operations:

(function() {
try {

var V3Base = {};
Object.defineProperties(V3Base, {
	'x': {
		'get': function() { return this[0]; },
		'set': function(v) { this[0] = v; }
	},
	'y': {
		'get': function() { return this[1]; },
		'set': function(v) { this[1] = v; }		
	},
	'z': {
		'get': function() { return this[2]; },
		'set': function(v) { this[2] = v; }		
	},
	'length': {
		'get': function() { return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2]*this[2]); }
	}
});
V3Base.prototype = Object.create(Float32Array.prototype);

function V3(x, y, z) {
	var vx, vy, vz;
	if (Array.isArray(x) || x.constructor == V3) {
		vx = x[0]; vy = x[1]; vz = x[2];
	} else {
		vx = x; vy = y || x ; vz = z || x;
	}
	this[0] = vx || 0.0;
	this[1] = vy || 0.0;
	this[2] = vz || 0.0;

	this.constructor = V3;
}
V3.prototype = V3Base;

// return length*(cos(arg), sin(arg))
V3.fromPolar = function (arg1, arg2, len) {
	return new V3(Math.sin(arg1)*Math.cos(arg2), Math.sin(arg1)*Math.sin(arg2), Math.cos(arg1)).scale(len);
};
// return u = this + v
V3.prototype.add = function (v) {
	return new V3(this[0] + v[0], this[1] + v[1], this[2] + v[2]);
};
// return u = this x v
V3.prototype.cross = function (v) {
	return new V3(this[1]*v[2] - this[2]*v[1], this[2]*v[0] - this[0]*v[2], this[0]*v[1] - this[1]*v[0]);
};
// return this -= v
V3.prototype.dec = function (v) {
	this[0] -= v[0];
	this[1] -= v[1];
	this[2] -= v[2];
	return this;
};
// return this · v
V3.prototype.dot = function (v) {
	return this[0] * v[0] + this[1] * v[1] + this[2] * v[2];
};
// return this += v
V3.prototype.inc = function (v) {
	this[0] += v[0];
	this[1] += v[1];
	this[2] += v[2];
	return this;
};
// return length(this), also set length(this)^2
V3.prototype.length = function () {
	this.len2 = this[0] * this[0] + this[1] * this[1] + this[2]*this[2];
	this.len = Math.sqrt(this.len2);
	return this.len;
};
// return length(this)^2
V3.prototype.length2 = function () {
	return this.len2 = this[0] * this[0] + this[1] * this[1] + this[2]*this[2];
};
// return u = (this.x*v.x, this[1]*v[1], this[2]*v[2])
V3.prototype.mul = function (v) {
	return new V3(this[0]*v[0], this[1]*v[1], this[2]*v[2]);
};
// return u = this*c
V3.prototype.mulC = function (c) {
	var r = new V3(this[0], this[1], this[2]);
	return r.scale(c);
};
// return normalize(this)
V3.prototype.norm = function () {
	this.length();
	this[0] /= this.len;
	this[1] /= this.len;
	this[2] /= this.len;
	return this;
};
// return this*c;
V3.prototype.scale = function (c) {
	this[0] *= c;
	this[1] *= c;
	this[2] *= c;
	return this;
};
// return this = (v.x, v.y, v.z)
V3.prototype.set = function (v) {
	this[0] = v[0];
	this[1] = v[1];
	this[2] = v[2];
	return this;
};
// return u = this - v
V3.prototype.sub = function (v) {
	return new V3(this[0] - v[0], this[1] - v[1], this[2] - v[2]);
};
// return "({this.x},{this[1]},{this[2]})"
V3.prototype.toString = function () {
	return '(' + this[0].toFixed(4) + ',' +
	this[1].toFixed(4) + ',' +
	this[2].toFixed(4) + ')';
};

} catch (error) {
	alert(error);
}
//module.exports = V3;
window.top.V3=V3;
})();