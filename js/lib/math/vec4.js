export default class Vec4 {
    //#region Pool
    static #pool = null;
    static #poolIndex = -1;
    static #poolCount = 0;

    static initialize(size = 1000) {
        Vec4.#pool = new Float32Array(4*size);
        Vec4.#poolIndex = 0;
        Vec4.#poolCount = 0;
        let pi = 0;
        while (pi < size-1) {
            Vec4.#pool[4*pi] = 4*pi + 4;
            pi++;
        }
        Vec4.#pool[4*pi] = -1;
    }

    static destroy() {
        Vec4.#pool = null;
        Vec4.#poolIndex = 0;
        Vec4.#poolCount = 0;
    }

    static allocate() {
        if (Vec4.#pool == null) {
            Vec4.initialize();
        }
        if (Vec4.#poolIndex != -1) {
            let index = Vec4.#poolIndex;
            Vec4.#poolIndex = Vec4.#pool[index];
            Vec4.#poolCount++;
            return index;
        }
        throw new Error('Pool overflow!');
    }

    static free(ix) {
        let res = null;
        if (Vec4.#poolCount > 0) {
            res = Vec4.#pool[4*ix] = Vec4.#poolIndex;
            Vec4.#poolIndex = 4*ix;
            Vec4.#poolCount--;
        }
        return res;
    }

    static getAt(ix) {
        //return ix < Vec4.#poolIndex ? Vec4.#pool[ix] : null; }
        return 4*ix < Vec4.#pool.length ? new Vec4(Vec4.#pool, 4*ix) : null;
    }

    static getPoolIndex() { return Vec4.#poolIndex; }

    static getPoolCount() { return Vec4.#poolCount; }
    //#endregion

    #array = null;
    #index = 0;

    get x() { return this.#array[this.#index]; }
    set x(value) { this.#array[this.#index] = value; }
    get y() { return this.#array[this.#index+1]; }
    set y(value) { this.#array[this.#index+1] = value; }
    get z() { return this.#array[this.#index+2]; }
    set z(value) { this.#array[this.#index+2] = value; }
    get w() { return this.#array[this.#index+3]; }
    set w(value) { this.#array[this.#index+3] = value; }
    get len() { return Math.sqrt(this.len2); }
    get len2() { return this.x**2 + this.y**2 + this.z**2; }

    [Symbol.iterator]() {
        let index = -1;
        return {
            next: () => ({
                value: this.#array[this.#index + ++index],
                done: index == 4 })
        };
    }

    constructor() {
        let array = Vec4.#pool;
        let ix = 0;
        let x = 0;
        let y = 0;
        let z = 0;
        let w = 0;

        if (arguments.length > 0 && arguments[0] instanceof Float32Array) {
            array = arguments[0];
            ix = arguments[1];
            x = arguments[2] || array[ix];
            y = arguments[3] || array[ix+1];
            z = arguments[4] || array[ix+2];
            w = arguments[5] || array[ix+3];
        } else {
            ix = Vec4.allocate();
            array = Vec4.#pool;
            if (arguments[0] != undefined) x = arguments[0];
            if (arguments[1] != undefined) y = arguments[1];
            if (arguments[2] != undefined) z = arguments[2];
            if (arguments[3] != undefined) w = arguments[3];
        }
        this.#array = array;
        this.#index = ix;
        this.set(x, y, z, w);

        Object.defineProperties(this, {
            0: {
                configurable: false,
                enumerable: false,
                get: function() { return this.x; },
                set: function(value) { this.x = value; }
            },
            1: {
                configurable: false,
                enumerable: false,
                get: function() { return this.y; },
                set: function(value) { this.y = value; }
            },
            2: {
                configurable: false,
                enumerable: false,
                get: function() { return this.z; },
                set: function(value) { this.z = value; }
            },
            4: {
                configurable: false,
                enumerable: false,
                get: function() { return this.w; },
                set: function(value) { this.w = value; }
            }
        });
    }
    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    // clone() {
    //     return new Vec4(this.x, this.y, this.z, this.w);
    // }

    compare(v4) {
        const diff = this.len2 - v4.len2;
        if (diff !== 0) return diff;
        return this.x - v4.x || this.y - v4.y || this.z - v4.z || this.w - v4.w;
    }

    // this += v4
    inc(v4) {
        this.x += v4.x;
        this.y += v4.y;
        this.z += v4.z;
        this.w += v4.w;
        return this;
    }
    // res = this + v4
    add(v4, res) {
        res.x = this.x + v4.x;
        res.y = this.y + v4.y;
        res.z = this.z + v4.z;
        res.w = this.w + v4.w;
        return res;
    }
    // this -= v4
    dec(v4) {
        this.x -= v4.x;
        this.y -= v4.y;
        this.z -= v4.z;
        this.w -= v4.w;
        return this;
    }
    // res = this - v4
    sub(v4, res) {
        res.x = this.x - v4.x;
        res.y = this.y - v4.y;
        res.z = this.z - v4.z;
        res.w = this.w - v4.w;
        return res;
    }
    // res = scalar * this
    mul(scalar, res) {
        res.x = this.x * scalar;
        res.y = this.y * scalar;
        res.z = this.z * scalar;
        res.w = this.w * scalar;
        return res;
    }
    // this *= scalar
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        this.w *= scalar;
        return this;
    }
    // res = this / len(this)
    norm() {
        const len = this.len;
        if (len > 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
            this.w = 0.0;
        }
        return this;
    }
    dot(v4) {
        return this.x * v4.x + this.y * v4.y + this.z * v4.z + this.w * v4.w;
    }
    cross(v4) {
        return new Vec4(
            this.y*v3.z - this.z*v3.y,
            this.z*v3.x - this.x*v3.z,
            this.x*v3.y - this.y*v3.x,
            0.0);
    }
    perp(res) {
        const x = this.x, y = this.y, z = this.z;
        if (x !== 0 || y !== 0) {
            // Vector not aligned with Z axis — use XY-plane perpendicular
            res.x = -y;
            res.y = x;
            res.z = 0;
        } else {
            // Fallback: vector aligned with Z axis — use YZ-plane
            res.x = 0;
            res.y = -z;
            res.z = 0;
        }
    
        res.w = 0.0; // Result is a direction vector
        return res;
    }
    
    angle(v4) {
        const dot = this.dot(v4);
        return Math.acos(dot / (this.len * v4.len));
    }
    project(v4, res) {
        let scale = this.dot(v4) / v4.len2;
        return v4.mul(scale, res);
    }
    reflect(normal, res) {
        let scale = 2 * this.dot(normal);
        normal.mul(scale, res);
        res.w = 0.0;
        return this.sub(res, res);
    }
    rotateX(angle, res) {
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);
        res.x = this.x;
        res.y = this.y * cosA - this.z * sinA;
        res.z = this.y * sinA + this.z * cosA;
        res.w = this.w;
        return res;
    }
    rotateY(angle, res) {
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);
        res.x = this.x * cosA - this.z * sinA;
        res.y = this.y;
        res.z = -this.x * sinA + this.z * cosA;
        res.w = this.w;
        return res;
    }
    rotateZ(angle, res) {
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);
        res.x = this.x * cosA - this.y * sinA;
        res.y = this.x * sinA + this.y * cosA;
        res.z = this.z;
        res.w = this.w;
        return res;
    }
    dist(v4) {
        return Math.hypot(this.x - v4.x, this.y - v4.y, this.z - v4.z);
    }

    toString() {
        return `(${this.x.toPrecision(2)}|${this.y.toPrecision(2)}|${this.z.toPrecision(2)}|${this.w.toPrecision(2)})`;
    }

    fromPolar(r, theta, phi) {
        let sinP = Math.sin(phi);
        this.x = r * Math.cos(theta) * sinP;
        this.y = r * Math.sin(theta) * sinP;
        this.z = r * Math.cos(phi);
        this.w = 0.0;
        return this;
    }

    random() {
        return this.fromPolar(
            Math.random(),
            2*Math.random()*Math.PI,
            Math.random()*Math.PI);
    }
}
