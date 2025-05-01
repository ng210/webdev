export default class Vec3 {
    static #_array = null;
    static #_index = -1;

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone() {
        throw new Error('Not implemented!');
    }

    compare(v3) {
        const diff = this.len2 - v3.len2;
        if (diff !== 0) return diff;
        return this.x - v3.x || this.y - v3.y || this.z - v3.z;
    }

    // this += v3
    inc(v3) {
        this.x += v3.x;
        this.y += v3.y;
        this.z += v3.z;
        return this;
    }
    // res = this + v3
    add(v3, res) {
        res.x = this.x + v3.x;
        res.y = this.y + v3.y;
        res.z = this.z + v3.z;
        return res;
    }
    // this -= v3
    dec(v3) {
        this.x -= v3.x;
        this.y -= v3.y;
        this.z -= v3.z;
        return this;
    }
    // res = this - v3
    sub(v3, res) {
        res.x = this.x - v3.x;
        res.y = this.y - v3.y;
        res.z = this.z - v3.z;
        return res;
    }
    // res = scalar * this
    mul(scalar, res) {
        res.x = this.x * scalar;
        res.y = this.y * scalar;
        res.z = this.z * scalar;
        return res;
    }
    // this *= scalar
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }
    // res = this / len(this)
    norm() {
        const len = this.len;
        if (len > 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }
    dot(v3) {        
        return this.x * v3.x + this.y * v3.y + this.z * v3.z;
    }
    cross(v3) {
        return new Vec3(
            this.y*v3.z - this.z*v3.y,
            this.z*v3.x - this.x*v3.z,
            this.x*v3.y - this.y*v3.x);
    }
    perp(res) {
        if (x !== 0 || y !== 0) {
            res.x = -y;
            res.y = x;
            res.z = 0;
        } else {
            res.x = -0;
            res.y = -z;
            res.z = y;
            return [0, -z, y];
        }
        return res;
    }
    angle(v3) {
        return Math.acos(this.dot(v3) / (this.len * v3.len));
    }
    project(v3, res) {
        let scale = this.dot(v3) / v3.len2;
        return v3.mul(scale, res);
    }
    reflect(normal, res) {
        let scale = 2 * this.dot(normal);
        normal.mul(scale, res);
        return this.sub(res, res);
    }
    rotate(theta, phi, res) {
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);
    
        // Rotation around Z-axis (theta)
        const x1 = cosT * this.x - sinT * this.y;
        const y1 = sinT * this.x + cosT * this.y;
        const z1 = this.z;  // Z remains unchanged in Z-rotation
    
        // Rotation around Y-axis (phi)
        res.x = cosP * x1 + sinP * z1;
        res.y = y1; // Y remains unchanged in Y-rotation
        res.z = -sinP * x1 + cosP * z1;
        
        return res;
    }
    dist(v3) {
        let dx = this.x - v3.x;
        let dy = this.y - v3.y;
        let dz = this.z - v3.z;
        return Math.sqrt(dx**2 + dy**2 + dz**2);
    }

    toString() {
        return `(${this.x.toPrecision(2)}|${this.y.toPrecision(2)}|${this.z.toPrecision(2)})`;
    }

    fromPolar(r, theta, phi) {
        this.x = r * Math.cos(theta) * Math.sin(phi);
        this.y = r * Math.sin(theta) * Math.sin(phi);
        this.z = r * Math.cos(phi);
        return this;
    }


    static initializePool(size) {
        Vec3.#_array = new Float32Array(4*size);
        Vec3.#_index = 0;
    }

    static allocate(count = 1) {
        let index = Vec3.#_index;
        if (index >= Vec3.#_array.length) {
            console.warn('Pool overflow!');
            Vec3.#_index = index = 0;
        }
        Vec3.#_index += 4*count;
        return index;
    }

    static free(count = 1) {
        Vec3.#_index -= 4*count;
        return Vec3.#_index;
    }

    static getPoolIndex() { return Vec3.#_index; }

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
    get len2() { return this.x**2 + this.y**2 + this.z**2 + this.w**2; }
    
    constructor(x = 0, y = 0, z = 0, array = null, index = -1) {
        if (array == null) {
            this.#array = Vec3.#_array;
            this.#index = Vec3.allocate();
        } else {
            this.#array = array;
            this.#index = index;
        }
        this.set(x, y, z);
    }

    clone() {
        return new Vec3(this.x, this.y, this.z);
    }

    static random() {
        return new Vec3()
            .fromPolar(
                Math.random(),
                Math.random()*2*Math.PI,
                Math.random()*2*Math.PI);
    }
}
