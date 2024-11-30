Noise.SIZE = 256;  // must be power of 2
Noise.MASK = Noise.SIZE-1;

function lerp (x1, x2, f) { return (1-f)*x1 + f*x2; }

function Noise(seed) {
    this.seed = seed || (new Date()).getTime();
    this.cache = [];
    this.fillCache();
    this.transform2d = (x, y, v, buffer, ix) => { buffer[ix] = v; return ix+1; };
}

Noise.prototype.fillCache = function() {
    var tmp = [];
    for (var i=0; i<2*Noise.SIZE; i++) {
        tmp.push(i & Noise.MASK);
    }
    var n = this.seed;
    while (tmp.length > 0) {
        this.cache.push(tmp.splice(n & Noise.MASK, 1)[0]);
        //n = Math.random()*tmp.length;
        n = (n*152751 + 314767)%tmp.length;
    }
};

Noise.prototype.get2d = function(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    
    xi = xi & Noise.MASK;
    yi = yi & Noise.MASK;
    var i1 = this.cache[xi] + yi;
    var i2 = this.cache[xi + 1] + yi;
    var i3 = i1 + 1;
    var i4 = i2 + 1;
    var v1 = lerp(this.cache[i1], this.cache[i2], xf);
    var v2 = lerp(this.cache[i3], this.cache[i4], xf);
    return lerp(v1, v2, yf)/Noise.SIZE;
};

Noise.prototype.fbm2d = function(x, y, n, a0, f0, an, fn) {
    var fi = f0, ai = a0;
    var v = 0;
    for (var i=1; i<n; i++) {
        v += ai * this.get2d(fi*x, fi*y);
        ai *= an; fi *= fn;
    }
    return v;
};

Noise.prototype.createFbm2d = function createFbm2d(width, height, sx, sy, n, a0, f0, an, fn, data) {
    var ix = 0, i = 0;
    while (ix < data.length) {
        var y = Math.floor(i/width)/height;
        var x = i/width; x -= Math.trunc(x);
        ix = this.transform2d(x, y, this.fbm2d(sx*x, sy*y, n, a0, f0, an, fn), data, ix);
        i++;
    }
};