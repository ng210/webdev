export default class Vec2 {
    //#region Pool
    static #pool = null;
    static #poolIndex = -1;
    static #poolCount = 0;

    static initialize(size = 1000) {
        Vec2.#pool = new Float32Array(2*size);
        Vec2.#poolIndex = 0;
        Vec2.#poolCount = 0;
        let pi = 0;
        while (pi < size-1) {
            Vec2.#pool[2*pi] = 2*pi + 2;
            pi++;
        }
        Vec2.#pool[2*pi] = -1;
    }

    static destroy() {
        Vec2.#pool = null;
        Vec2.#poolIndex = 0;
        Vec2.#poolCount = 0;
    }

    static allocate() {
        if (Vec2.#pool == null) {
            Vec2.initialize();
        }
        if (Vec2.#poolIndex != -1) {
            let index = Vec2.#poolIndex;
            Vec2.#poolIndex = Vec2.#pool[index];
            Vec2.#poolCount++;
            return index;
        }
        throw new Error('Pool overflow!');
    }

    static free(ix) {
        let res = null;
        if (Vec2.#poolCount > 0) {
            res = Vec2.#pool[2*ix] = Vec2.#poolIndex;
            Vec2.#poolIndex = 2*ix;
            Vec2.#poolCount--;
        }
        return res;
    }

    static getAt(ix) {
        //return ix < Vec2.#poolIndex ? Vec2.#pool[ix] : null; }
        return 2*ix < Vec2.#pool.length ? new Vec2(Vec2.#pool, 2*ix) : null;
    }

    static getPoolIndex() { return Vec2.#poolIndex; }

    static getPoolCount() { return Vec2.#poolCount; }
    //#endregion

    #array = null;
    #index = 0;

    get x() { return this.#array[this.#index]; }
    set x(value) { this.#array[this.#index] = value; }
    get y() { return this.#array[this.#index+1]; }
    set y(value) { this.#array[this.#index+1] = value; }
    get len() { return Math.sqrt(this.len2); }
    get len2() { return this.x**2 + this.y**2; }

    [Symbol.iterator]() {
        let index = -1;
        return {
            next: () => ({
                value: this.#array[this.#index + ++index],
                done: index == 2 })
        };
    }

    constructor() {
        let array = Vec2.#pool;
        let ix = 0;
        let x = 0;
        let y = 0;

        if (arguments.length > 0 && arguments[0] instanceof Float32Array) {
            array = arguments[0];
            ix = arguments[1];
            x = arguments[2] || array[ix];
            y = arguments[3] || array[ix+1];
        } else {
            ix = Vec2.allocate();
            array = Vec2.#pool;
            if (arguments[0] != undefined) x = arguments[0];
            if (arguments[1] != undefined) y = arguments[1];
        }
        this.#array = array;
        this.#index = ix;
        this.set(x, y);

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
            }
        });
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    // clone() {
    //     return new Vec2(this.x, this.y);
    // }

    compare(v2) {
        const diff = this.len2 - v2.len2;
        if (diff !== 0) return diff;
        return this.x - v2.x || this.y - v2.y;
    }

    // this += v2
    inc(v2) {
        this.x += v2.x;
        this.y += v2.y;
        return this;
    }
    // res = this + v2
    add(v2, res) {
        res.x = this.x + v2.x;
        res.y = this.y + v2.y;
        return res;
    }
    // this -= v2
    dec(v2) {
        this.x -= v2.x;
        this.y -= v2.y;
        return this;
    }
    // res = this - v2
    sub(v2, res) {
        res.x = this.x - v2.x;
        res.y = this.y - v2.y;
        return res;
    }
    // res = scalar * this
    mul(scalar, res) {
        res.x = this.x * scalar;
        res.y = this.y * scalar;
        return res;
    }
    // this *= scalar
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    // res = this / len(this)
    norm() {
        const len = this.len;
        if (len > 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }
    dot(v2) {        
        return this.x * v2.x + this.y * v2.y;
    }
    cross(v2) {
        return this.x * v2.y - this.y * v2.x;
    }
    perp(res) {
        res.x = -this.y;
        res.y = this.x;
        return res;
    }
    angle(v2) {
        return Math.acos(this.dot(v2) / (this.len * v2.len));
    }
    project(v2, res) {
        let scale = this.dot(v2) / v2.len2;
        return v2.mul(scale, res);
    }
    reflect(normal, res) {
        let scale = 2 * this.dot(normal);
        normal.mul(scale, res);
        return this.sub(res, res);
    }
    rotate(angle, res) {
        let cosT = Math.cos(angle);
        let sinT = Math.sin(angle);
        res.x = this.x * cosT - this.y * sinT;
        res.y = this.x * sinT + this.y * cosT;
        return res;
    }
    dist(v2) {
        let dx = this.x - v2.x;
        let dy = this.y - v2.y;
        return Math.sqrt(dx**2 + dy**2);
    }

    toString() {
        return `(${this.x.toPrecision(2)}|${this.y.toPrecision(2)})`;
    }

    fromPolar(r, theta) {
        this.x = r * Math.cos(theta);
        this.y = r * Math.sin(theta);
        return this;
    }

    random() {
        return this.fromPolar(
            Math.random(),
            2*Math.random()*Math.PI);
    }
}
