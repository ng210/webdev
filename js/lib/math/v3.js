(function() {

    function V3(x, y, z) {
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
        this.set(x, y, z);
    }
    V3.prototype = new Float32Array(3);
    Object.defineProperties(V3.prototype,
        {
            x: { get: function() { return this[0]; }, set: function(x) { this[0] = x; } },
            y: { get: function() { return this[1]; }, set: function(y) { this[1] = y; } },
            z: { get: function() { return this[2]; }, set: function(z) { this[2] = z; } },
            len: { get: function() { return Math.sqrt(this.len2); } },
            len2: { get: function() { return this[0]*this[0] + this[1]*this[1] + this[2]*this[2]; } }
        }
    );
    V3.fromPolar = function fromPolar(polar, azimuth, length) {
        r = length*Math.sin(polar);
        return new V3(
            r*Math.cos(azimuth),
            length*Math.cos(polar),
            r*Math.sin(azimuth)
        );
    };

    // return this += v
    V3.prototype.add = function add(v) {
        this[0] += v[0];
        this[1] += v[1];
        this[2] += v[2];
        return this;
    };
    // return u = this - v
    V3.prototype.diff = function diff(v, r, o) {
        r = r || new V3(this);
        o = o || 0;
        r[o+0] = this[0] - v[0];
        r[o+1] = this[1] - v[1];
        r[o+2] = this[2] - v[2];
        return r;
    };
    // return this/v
    V3.prototype.div = function div(v) {
        this[0] /= v[0];
        this[1] /= v[1];
        this[2] /= v[2];
        return this;
    };
    // return this · v
    V3.prototype.dot = function dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    // return this*v
    V3.prototype.mul = function mul(v) {
        this[0] *= v[0];
        this[1] *= v[1];
        this[2] *= v[2];
        return this;
    };
    // return normalize(this)
    V3.prototype.norm = function norm() {
        var len = this.len;
        this[0] /= len;
        this[1] /= len;
        this[2] /= len;
        return this;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V3.prototype.prod = function prod(v, r, o) {
        r = r || new V3(0);
        o = o || 0;
        r[o+0] = this[0] * v[0];
        r[o+1] = this[1] * v[1];
        r[o+2] = this[2] * v[2];
        return r;
    };
    // return u = this*c
    V3.prototype.prodC = function prodC(c, r, o) {
        r = r || new V3(0);
        o = o || 0;
        r[o+0] = this[0] * c;
        r[o+1] = this[1] * c;
        r[o+2] = this[2] * c;
        return r;
    };
    // return this*c;
    V3.prototype.scale = function scale(c) {
        this[0] *= c;
        this[1] *= c;
        this[2] *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V3.prototype.set = function set(x, y, z) {
        if (x === undefined || typeof x === 'number') {
            this[0] = x || 0.0;
            this[1] = y == undefined ? this[0] : y;
            this[2] = z == undefined ? this[0] : z;
        } else if (Array.isArray(x)) {
            this[0] = x[0] || 0.0;
            this[1] = x[1] || 0.0;
            this[2] = x[2] || 0.0;
        } else if (x instanceof Float32Array) {
            var o = y || 0;
            this[0] = x[0+o] || 0.0;
            this[1] = x[1+o] || 0.0;
            this[2] = x[2+o] || 0.0;
        } else {
            throw new Error('Could not create V3 from these arguments!');
        }
        return this;
    };
    // return this -= v
    V3.prototype.sub = function sub(v) {
        this[0] -= v[0];
        this[1] -= v[1];
        this[2] -= v[2];
        return this;
    };
    // return u = this + v
    V3.prototype.sum = function sum(v, r, o) {
        r = r || new V3(0);
        o = o || 0;
        r[o+0] = this[0] + v[0];
        r[o+1] = this[1] + v[1];
        r[o+2] = this[2] + v[2];
        return r;
    };
    V3.prototype.put = function put(r, o) {
        r[o++] = this[0];
        r[o++] = this[1];
        r[o++] = this[2];        
        return r;
    };

    // return "({this.x},{this.y},{this.z})"
    V3.prototype.toString = function () {
        return `(${this[0]},${this[1]},${this[2]})`;
    };

    publish(V3, 'V3');
})();