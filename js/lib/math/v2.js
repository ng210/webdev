(function() {

    function V2(x, y) {
        this.data = new Float32Array(2);
        if (x === undefined || typeof x === 'number') {
            if (arguments.length < 2) y = x;
            this.data[0] = x || .0;
            this.data[1] = y || .0;
        } else if (Array.isArray(x)) {
            this.data[0] = x[0] || .0;
            this.data[1] = x[1] || .0;
        } else if (x.data instanceof Float32Array) {
            this.data[0] = x.data[0];
            this.data[1] = x.data[1];
        } else {
            throw new Error('Could not create V2 from these arguments!');
        }
        this.length();
    }
    V2.prototype = {
        get x()  { return this.data[0]; },
        get y()  { return this.data[1]; },
        set x(v) { return this.data[0] = v; },
        set y(v) { return this.data[1] = v; }
    };
    // return this += v
    V2.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    };
    // return u = this - v
    V2.prototype.diff = function (v) {
        return new V2(this.x - v.x, this.y - v.y);
    };
    // return this · v
    V2.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };
    // return length(this), also set length(this)^2
    V2.prototype.length = function () {
        this.len2 = this.x * this.x + this.y * this.y;
        this.len = Math.sqrt(this.len2);
        return this.len;
    };
    // return length(this)^2
    V2.prototype.length2 = function () {
        return this.len2 = this.x * this.x + this.y * this.y;
    };
    // return this*v
    V2.prototype.mul = function (v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    };
    // return normalize(this)
    V2.prototype.norm = function () {
        this.length();
        this.x = this.x/this.len;
        this.y = this.y/this.len;
        return this;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V2.prototype.prod = function (v) {
        return new V2(this.x*v.x, this.y*v.y);
    };
    // return u = this*c
    V2.prototype.prodC = function (c) {
        var r = new V2(this.x, this.y);
        return r.scale(c);
    };
    // return this*c;
    V2.prototype.scale = function (c) {
        this.x *= c;
        this.y *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V2.prototype.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    };
    // return this -= v
    V2.prototype.sub = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    };
    // return u = this + v
    V2.prototype.sum = function (v) {
        return new V2(this.x + v.x, this.y + v.y);
    };

    // return "({this.x},{this.y},{this.z})"
    V2.prototype.toString = function () {
        return `(${this.x},${this.y})`;
    };

    public(V2, 'V2');
})();