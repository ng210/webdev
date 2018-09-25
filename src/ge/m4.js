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
		return new M4([ 1,0,0,x,  0,1,0,y, 0,0,1,z, 0,0,0,1 ]);	
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
			xa.x,					ya.x,					za.x,					0,
			xa.y,					ya.y,					za.y,					0,
			xa.z,					ya.z,					za.z,					0,
			-xa.dot(eye),	-ya.dot(eye),	-za.dot(eye),	1	]);
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

	M4.perspective = function(fieldOfView, aspect, zNear, zFar) {
		
	};

	M4.ortho = function(left, right, top, bottom) {
		
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

	M4.prototype.toString = function() {
		var arr = [];
		var ix = 0;
		for (var i=0; i<4; i++) {
			arr.push(this.data.slice(ix, ix+4).join());
			ix += 4;
		}
		return '[' + arr.join(',  ') + ']';
	};
	module.exports=M4;
})();