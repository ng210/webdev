(function() {

    function V4(x, y, z, w) {
        this.data = new Float32Array(4);
        if (x === undefined || typeof x === 'number') {
            if (arguments.length < 2) y = x, z = x, w = x;
            this.data[0] = x || .0;
            this.data[1] = y || .0;
            this.data[2] = z || .0;
            this.data[3] = w || .0;
        } else if (Array.isArray(x)) {
            this.data[0] = x[0] || .0;
            this.data[1] = x[1] || .0;
            this.data[2] = x[2] || .0;
            this.data[3] = x[3] || .0;
        } else if (x instanceof V4) {
            this.data[0] = x.data[0];
            this.data[1] = x.data[1];
            this.data[2] = x.data[2];
            this.data[3] = x.data[3];
        } else {
            throw new Error('Could not create V4 from these arguments!');
        }
        this.length();
    }
    V4.prototype = {
        get x()  { return this.data[0]; },
        get y()  { return this.data[1]; },
        get z()  { return this.data[2]; },
        get w()  { return this.data[3]; },
        set x(v) { return this.data[0] = v; },
        set y(v) { return this.data[1] = v; },
        set z(v) { return this.data[2] = v; },
        set w(v) { return this.data[3] = v; }
    };
    // return this += v
    V4.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;
        return this;
    };
    // return u = this - v
    V4.prototype.diff = function (v) {
        return new V4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    };
    // return this · v
    V4.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    };
    // return length(this), also set length(this)^2
    V4.prototype.length = function () {
        this.len2 = this.x * this.x + this.y * this.y + this.z*this.z + this.w*this.w;
        this.len = Math.sqrt(this.len2);
        return this.len;
    };
    // return length(this)^2
    V4.prototype.length2 = function () {
        return this.len2 = this.x * this.x + this.y * this.y + this.z*this.z + this.w*this.w;
    };
    // return this*v
    V4.prototype.mul = function (v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        this.w *= v.w;
        return this;
    };
    // return normalize(this)
    V4.prototype.norm = function () {
        this.length();
        this.x /= this.len;
        this.y /= this.len;
        this.z /= this.len;
        this.w /= this.len;
        return this;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V4.prototype.prod = function (v) {
        return new V4(this.x*v.x, this.y*v.y, this.z*v.z, this.w*v.w);
    };
    // return u = this*c
    V4.prototype.prodC = function (c) {
        var r = new V4(this.x, this.y, this.z, this.w);
        return r.scale(c);
    };
    // return this*c;
    V4.prototype.scale = function (c) {
        this.x *= c;
        this.y *= c;
        this.z *= c;
        this.w *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V4.prototype.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.w = v.w;
        return this;
    };
    // return this -= v
    V4.prototype.sub = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        this.w -= v.w;
        return this;
    };
    // return u = this + v
    V4.prototype.sum = function (v) {
        return new V4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    };

    // return "({this.x},{this.y},{this.z})"
    V4.prototype.toString = function () {
        return `(${this.x},${this.y},${this.z},${this.w})`;
    };

    public(V4, 'V4');
})();