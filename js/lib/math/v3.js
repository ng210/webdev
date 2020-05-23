(function() {

    function V3(x, y, z, w) {
        this.data = new Float32Array(3);
        if (x === undefined || typeof x === 'number') {
            if (arguments.length < 2) y = x, z = x;
            this.data[0] = x || .0;
            this.data[1] = y || .0;
            this.data[2] = z || .0;
        } else if (Array.isArray(x)) {
            this.data[0] = x[0] || .0;
            this.data[1] = x[1] || .0;
            this.data[2] = x[2] || .0;
        } else if (x instanceof V3) {
            this.data[0] = x.data[0];
            this.data[1] = x.data[1];
            this.data[2] = x.data[2];
        } else {
            throw new Error('Could not create V3 from these arguments!');
        }
        this.length();
    }
    V3.prototype = {
        get x()  { return this.data[0]; },
        get y()  { return this.data[1]; },
        get z()  { return this.data[2]; },
        set x(v) { return this.data[0] = v; },
        set y(v) { return this.data[1] = v; },
        set z(v) { return this.data[2] = v; }
    };
    // return this += v
    V3.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    };
    // return u = this - v
    V3.prototype.diff = function (v) {
        return new V3(this.x - v.x, this.y - v.y, this.z - v.z);
    };
    // return this · v
    V3.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    // return length(this), also set length(this)^2
    V3.prototype.length = function () {
        this.len2 = this.x * this.x + this.y * this.y + this.z*this.z;
        this.len = Math.sqrt(this.len2);
        return this.len;
    };
    // return length(this)^2
    V3.prototype.length2 = function () {
        return this.len2 = this.x * this.x + this.y * this.y + this.z*this.z;
    };
    // return this*v
    V3.prototype.mul = function (v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    };
    // return normalize(this)
    V3.prototype.norm = function () {
        this.length();
        this.x /= this.len;
        this.y /= this.len;
        this.z /= this.len;
        return this;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V3.prototype.prod = function (v) {
        return new V3(this.x*v.x, this.y*v.y, this.z*v.z);
    };
    // return u = this*c
    V3.prototype.prodC = function (c) {
        var r = new V3(this.x, this.y, this.z);
        return r.scale(c);
    };
    // return this*c;
    V3.prototype.scale = function (c) {
        this.x *= c;
        this.y *= c;
        this.z *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V3.prototype.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    };
    // return this -= v
    V3.prototype.sub = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    };
    // return u = this + v
    V3.prototype.sum = function (v) {
        return new V3(this.x + v.x, this.y + v.y, this.z + v.z);
    };

    // return "({this.x},{this.y},{this.z})"
    V3.prototype.toString = function () {
        return `(${this.x},${this.y},${this.z})`;
    };

    public(V3, 'V3');
})();