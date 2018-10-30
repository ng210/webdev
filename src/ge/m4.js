include('v3.js');

(function() {

	function M4(arr) {
		this.data = new Float32Array(16);
		for (var i=0; i<16; i++) {
			this.data[i] = 0.0;
		}
		if (Array.isArray(arr)) {
			var len = arr.length > 16 ? 16 : arr.length;
			for (var i=0; i<len; i++) {
				this.data[i] = arr[i];
			}
		}
		this.constructor = M4;
	}

	M4.identity = function() {
		return new M4([
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0 ]);
	};

	M4.translate = function(x, y, z) {
	//		[ 1 0 0 x ]
	// T =  [ 0 1 0 y ]
	//		[ 0 0 1 z ]
	//		[ 0 0 0 1 ]
		return new M4([
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			  x,   y,   z, 1.0 ]);
	};
	M4.translateV = function(v) {
		//		[ 1 0 0 x ]
		// T =  [ 0 1 0 y ]
		//		[ 0 0 1 z ]
		//		[ 0 0 0 1 ]
		return new M4([
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			v[0], v[1], v[2], 1.0 ]);
	};
	
	M4.scale = function(sx, sy ,sz) {
		return new M4([
			 sx, 0.0, 0.0, 0.0,
			0.0,  sy, 0.0, 0.0,
			0.0, 0.0,  sz, 0.0,
			0.0, 0.0, 0.0, 1.0 ]);
	};
	M4.scaleV = function(s) {
		return new M4([
			s[0], 0.0, 0.0, 0.0,
			0.0, s[1], 0.0, 0.0,
			0.0, 0.0, s[2], 0.0,
			0.0, 0.0, 0.0, 1.0 ]);
	};

	M4.rotate = function(axis, angle) {
		var c = Math.cos(angle);
		var ci = 1.0 - c;
		var sa = axis.mulC(Math.sin(angle));
		var xx = axis.x * axis.x;
		var yy = axis.y * axis.y;
		var zz = axis.z * axis.z;
		var xy = axis.x * axis.y;
		var xz = axis.x * axis.z;
		var yz = axis.y * axis.z;
		return new M4([
				c + ci*xx,	 ci*xy - sa.z,	 ci*xz + sa.y,	0.0,
			 ci*xy + sa.z,		c + ci*yy,	 ci*yz - sa.x,	0.0,
			 ci*xz - sa.y,	 ci*yz + sa.x,		c + ci*zz,	0.0,
					  0.0,			  0.0,			  0.0,	1.0
		]);
	};

	// Transform
	// camera(model) M = Rotate*Translate
	// view V = inv(M)
	// projection P
	// final in shader MVP
	// https://www.3dgep.com/understanding-the-view-matrix/#Transformations

	// Look at camera V=inv(Rxyz*T)
	M4.lookAt = function(eye, at, up) {
	//  [ xaxis.x,          yaxis.x,		  zaxis.x,         0,
	//    xaxis.y,          yaxis.y,          zaxis.y,         0,
	//    xaxis.z,          yaxis.z,          zaxis.z,		   0,
	//    -dot(xaxis,eye),	-dot(yaxis,eye),  -dot(zaxis,eye), 1 ]
		var za = eye.sub(at).norm();
		var xa = up.cross(za).norm();
		var ya = za.cross(xa);

		return new M4([
					xa.x,			ya.x,			za.x,		0,
					xa.y,			ya.y,			za.y,		0,
					xa.z,			ya.z,			za.z,		0,
			-xa.dot(eye),	-ya.dot(eye),	-za.dot(eye),		1 ]);
	};

	// FPS camera V=inv(T(Ry*Rx))
	M4.fps = function(eye, pitch, yaw) {
		var cy = Math.cos(yaw);
		var sy = Math.sin(yaw);
		var cp = Math.cos(pitch);
		var sp = Math.sin(pitch);
		var za = new V3(cy, 0, -sy);
		var xa = new V3(sy*sp, cp, cy*sp);
		var ya = new V3(sy*cp, -sp, cp*cy);

		return new M4([
			xa.x,					ya.x,					za.x,					0,
			xa.y,					ya.y,					za.y,					0,
			xa.z,					ya.z,					za.z,					0,
			-xa.dot(eye),	-ya.dot(eye),	-za.dot(eye),	1	]);
	};

	// TPS camera V=?
	M4.tps = function() {
		
	};

	M4.perspectiveFov = function(fov, a, n, f) {
		var v = 1/Math.tan(fov/2);
		var nf = 1/(n - f);
		return new M4([
			v/a,	0.0,		 0.0,		 0.0,
			0.0,	  v,		 0.0,		 0.0,
  			0.0,	0.0,	(f+n)*nf,		-1.0,
  			0.0,	0.0,	2*f*n*nf,		 0.0 ]);
	};
	
	M4.perspective = function(l, r, t, b, n, f) {
		var rl = r - l;
		var fn = f - n;
		var tb = t - b;
		return new M4([
			2.0*n/rl,		 0.0,	 (r+l)/rl,		 0.0,
				 0.0,	2.0*n/tb,	 (t+b)/tb,		 0.0,
				 0.0,		 0.0,	-(f+n)/fn, -2*f*n/fn,
				 0.0,		 0.0,		 -1.0,		 0.0 ]);

//			2.0*n/rl,			 0.0,				0.0,				0.0,
//					 0.0,	2.0*n/tb,				0.0,				0.0,
//			(r+l)/rl,	(t+b)/tb,	-(f+n)/fn,			 -1.0,
//					 0.0,			 0.0,	-2*f*n/fn,				0.0 ]);
	};

	M4.orthogonal = function(l, r, t, b, f, n) {
		return new M4([
			2.0/(r-l),		  0.0,			0.0,	-(r+l)/(r-l),
				  0.0,	2.0/(t-b),			0.0,	-(t+b)/(t-b),
				  0.0,		  0.0,	 -2.0/(f-n),	-(f+n)/(f-n),
				  0.0,		  0.0,			0.0,			 1.0 ]);
	};

	M4.prototype.mul = function(m) {
		var r = new M4();
		var ci = 0;
		var ao = 0;
		for (var i=0; i<4; i++) {
			for (var j=0; j<4; j++) {
				r.data[ci++] =
					this.data[ao+0]*m.data[j+0] +
					this.data[ao+1]*m.data[j+4] +
					this.data[ao+2]*m.data[j+8] +
					this.data[ao+3]*m.data[j+12];			
			}
			ao += 4;
		}
		return r;
	};
	
	M4.prototype.mulV = function(v4) {
		var r = [.0, .0, .0, .0];
		for (var j=0; j<4; j++) {
			var k = j;
			for (var i=0; i<4; i++) {
				r[j] += this.data[k] * v4[i];
				k += 4;
			}
		}
		return r;
	};
	M4.prototype.toString = function() {
		var table = [];
		var ix = 0;
		for (var i=0; i<4; i++) {
			var row = [];
			for (var j=0; j<4; j++) {
				row.push(this.data[ix++].toFixed(4));
			}
			table.push('['+row.join(', ')+']');
		}
		return '[' + table.join(',  ') + ']';
	};

	public(M4, 'M4');

})();