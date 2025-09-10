import { lerp } from './fn.js'

export default class Noise {
	#seed = 0;
	#cache = [];

	static SIZE = 256;		// must be power of 2
	static MASK = Noise.SIZE-1;


	static transform1d = (x, v, buffer, ix) => { buffer[ix] = v; return ix+1; };
	static transform2d = (x, y, v, buffer, ix) => { buffer[ix] = v; return ix+1; };
	static transform3d = (x, y, z, v, buffer, ix) => { buffer[ix] = v; return ix+1; };
	
	constructor(seed) {
		this.#seed = seed || (new Date()).getTime();
		this.#cache = [];
		this.fillCache();
	}

	fillCache() {
		var tmp = [];
		for (var i=0; i<2*Noise.SIZE; i++) {
			tmp.push(i & Noise.MASK);
		}
		var n = this.#seed;
		while (tmp.length > 0) {
			this.#cache.push(tmp.splice(n & Noise.MASK, 1)[0]);
			//n = Math.random()*tmp.length;
			n = (n*152751 + 314767)%tmp.length;
		}
	}

	get1d(x) {
		var xi = Math.floor(x);
		var xf = x - xi;
		xi = xi & Noise.MASK;
		var v1 = this.#cache[xi];
		var v2 = this.#cache[xi+1];
		return lerp(v1, v2, xf)/Noise.SIZE;
	}

	get2d(x, y) {
		var xi = Math.floor(x), yi = Math.floor(y);
		var xf = x - xi, yf = y - yi;
		
		xi = xi & Noise.MASK;
		yi = yi & Noise.MASK;
		var i1 = this.#cache[xi] + yi;
		var i2 = this.#cache[xi + 1] + yi;
		var i3 = i1 + 1;
		var i4 = i2 + 1;
		var v1 = lerp(this.#cache[i1], this.#cache[i2], xf);
		var v2 = lerp(this.#cache[i3], this.#cache[i4], xf);
		return lerp(v1, v2, yf)/Noise.SIZE;
	}

	get3d(x, y, z) {
		var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
		var xf = x - xi, yf = y - yi, zf = z - zi;
		
		// 	  7-----8		1: (0, 0, 0)	2: (1, 0, 0)
		//	 /|	   /|		3: (0, 1, 0)	4: (1, 1, 0)
		//  3-----4 |		5: (0, 0, 1)	6: (1, 0, 1)
		//  | 5---|-6		7: (0, 1, 1)	8: (1, 1, 1)
		//	|/	  |/		
		//  1-----2			
		
		xi = xi & Noise.MASK;
		yi = yi & Noise.MASK;
		zi = zi & Noise.MASK;
		var i1 = this.#cache[this.#cache[xi] + yi] + zi;
		var i2 = this.#cache[this.#cache[xi+1] + yi] + zi;
		var i3 = this.#cache[this.#cache[xi] + yi+1] + zi;
		var i4 = this.#cache[this.#cache[xi+1] + yi+1] + zi;
		var i5 = i1 + 1;
		var i6 = i2 + 1;
		var i7 = i3 + 1;
		var i8 = i4 + 1;
		var v1 = lerp(this.#cache[i1], this.#cache[i2], xf);
		var v2 = lerp(this.#cache[i3], this.#cache[i4], xf);
		var v3 = lerp(this.#cache[i5], this.#cache[i6], xf);
		var v4 = lerp(this.#cache[i7], this.#cache[i8], xf);
		var v5 = lerp(v1, v2, yf);
		var v6 = lerp(v3, v4, yf);
		return lerp(v5, v6, zf)/Noise.SIZE;
	}

	fbm1d(x, n, a0, f0, an, fn) {
		var fi = f0, ai = a0;
		var v = 0;
		for (var i=1; i<n; i++) {
			v += ai * this.get1d(fi*x);
			ai *= an; fi *= fn;
		}
		return v;
	}

	fbm2d(x, y, n, a0, f0, an, fn) {
		var fi = f0, ai = a0;
		var v = 0;
		for (var i=1; i<n; i++) {
			v += ai * this.get2d(fi*x, fi*y);
			ai *= an; fi *= fn;
		}
		return v;
	}

	fbm3d(x, y, z, n, a0, f0, an, fn) {
		var fi = f0, ai = a0;
		var v = 0;
		for (var i=0; i<n; i++) {
			v += ai * this.get3d(fi*x, fi*y, fi*z);
			ai *= an; fi *= fn;
		}
		return v;
	}

	createFbm1d(length, sx, n, a0, f0, an, fn, data) {
		var ix = 0; var i = 0;
		while (ix < data.length) {
			var x = i/length;
			ix = this.transform1d(x, this.fbm1d(sx*x, n, a0, f0, an, fn), data, ix);
			i++;
		}
	}
	
	createFbm1dFrom2d(length, sx, y, n, a0, f0, an, fn, data) {
		var ix = 0; var i = 0;
		while (ix < data.length) {
			var x = i/length;
			ix = this.transform2d(x, y, this.fbm2d(sx*x, y, n, a0, f0, an, fn), data, ix);
			i++;
		}
	}

	createFbm2d(width, height, sx, sy, n, a0, f0, an, fn, data) {
		var ix = 0, i = 0;
		while (ix < data.length) {
			var y = Math.floor(i/width)/height;
			var x = i/width; x -= Math.trunc(x);
			ix = this.transform2d(x, y, this.fbm2d(sx*x, sy*y, n, a0, f0, an, fn), data, ix);
			i++;
		}
	};

	createFbm2dFrom3d(width, height, z, sx, sy, n, a0, f0, an, fn, data) {
		var ix = 0, i = 0;
		while (ix < data.length) {
			var y = Math.floor(i/width)/height;
			var x = i/width; x -= Math.trunc(x);
			ix = this.transform3d(x, y, z, this.fbm3d(sx*x, sy*y, z, n, a0, f0, an, fn), data, ix);
			i++;
		}
		

		// var ix = 0;
		// for (var j=0; j<height; j++) {
		// 	var y = j/height;
		// 	for (var i=0; i<width; i++) {
		// 		var x = i/width;
		// 		ix = this.transform3d(x, y, z, this.fbm3d(x, y, z, n, a0, f0, an, fn), data, ix);
		// 	}
		// }
	}

	createFbm3d(width, height, depth, sx, sy, sz, n, a0, f0, an, fn, data) {
		var surface = width*height;
		var ix = 0, i = 0;
		while (ix < data.length) {
			var z = Math.floor(i/surface)/depth;
			var y = Math.floor(i/width)/height;
			var x = i/width; x -= Math.trunc(x);
			ix = this.transform3d(x, y, z, this.fbm3d(sx*x, sy*y, sz*z, n, a0, f0, an, fn), data, ix);
			i++;
		}

		// var ix = 0;
		// for (var k=0; k<depth; k++) {
		// 	var z = k/depth;
		// 	for (var j=0; j<height; j++) {
		// 		var y = j/height;
		// 		for (var i=0; i<width; i++) {
		// 			var x = i/width;
		// 			data[ix++] = this.transform3d(x, y, z, this.fbm3d(x, y, z, n, a0, f0, an, fn));
		// 		}
		// 	}
		// }
	}
}