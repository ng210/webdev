(function() {

    function V2(x, y) {
        this[0] = 0.0;
        this[1] = 0.0;
        this.set(x, y);
    }
    V2.prototype = new Float32Array(2);
    Object.defineProperties(V2.prototype,
        {
            x: { get: function() { return this[0]; }, set: function(x) { this[0] = x; } },
            y: { get: function() { return this[1]; }, set: function(y) { this[1] = y; } },
            len: { get: function() { return Math.sqrt(this.len2); } },
            len2: { get: function() { return this[0]*this[0] + this[1]*this[1]; } }
        }
    );

    V2.fromPolar = function fromPolarfromPolar(angle, length) {
        return new V2(Math.cos(angle), Math.sin(angle)).scale(length);
    };

    // return this += v
    V2.prototype.add = function add(v) {
        this[0] += v[0];
        this[1] += v[1];
        return this;
    };
    // return u = this - v
    V2.prototype.diff = function diff(v, r, o) {
        r = r || new V2(this);
        o = o || 0;
        r[o+0] = this[0] - v[0];
        r[o+1] = this[1] - v[1];
        return r;
    };
    // return this/v
    V2.prototype.div = function div(v) {
        this[0] /= v[0];
        this[1] /= v[1];
        return this;
    };
    // return this · v
    V2.prototype.dot = function dot(v) {
        return this.x * v.x + this.y * v.y;
    };
    // return this*v
    V2.prototype.mul = function mul(v) {
        this[0] *= v[0];
        this[1] *= v[1];
        return this;
    };
    // return normalize(this)
    V2.prototype.norm = function norm() {
        var len = this.len;
        this[0] /= len;
        this[1] /= len;
        return this;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V2.prototype.prod = function prod(v, r, o) {
        r = r || new V2(0);
        o = o || 0;
        r[o+0] = this[0] * v[0];
        r[o+1] = this[1] * v[1];
        return r;
    };
    // return u = this*c
    V2.prototype.prodC = function prodC(c, r, o) {
        r = r || new V2(0);
        o = o || 0;
        r[o+0] = this[0] * c;
        r[o+1] = this[1] * c;
        return r;
    };
    // return this*c;
    V2.prototype.scale = function scale(c) {
        this[0] *= c;
        this[1] *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V2.prototype.set = function set(x, y) {
        if (x === undefined || typeof x === 'number') {
            this[0] = x || 0.0;
            this[1] = y || 0.0;
        } else if (Array.isArray(x)) {
            this[0] = x[0] || 0.0;
            this[1] = x[1] || 0.0;
        } else if (x instanceof Float32Array) {
            var o = y || 0;
            this[0] = x[0+o] || 0.0;
            this[1] = x[1+o] || 0.0;
        } else {
            throw new Error('Could not create V2 from these arguments!');
        }
        return this;
    };
    // return this -= v
    V2.prototype.sub = function sub(v) {
        this[0] -= v[0];
        this[1] -= v[1];
        return this;
    };
    // return u = this + v
    V2.prototype.sum = function sum(v, r, o) {
        r = r || new V2(0);
        o = 0 || 0;
        r[o+0] = this[0] + v[0];
        r[o+1] = this[1] + v[1];
        return r;
    };
    V2.prototype.put = function put(r, o) {
        r[o++] = this[0];
        r[o++] = this[1];
        return r;
    };

    // return "({this.x},{this.y},{this.z})"
    V2.prototype.toString = function toString() {
        return `(${this[0]},${this[1]})`;
    };

    publish(V2, 'V2');
})();