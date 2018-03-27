function createTerrain() {
	// create a model group for terrain
	var grp = new ModelGroup(
		// shaders
			['vs_terrain', 'fs_terrain'],
			//['vs2', 'fs2'],
		// attributes
			['aPosition', 'aUV0'],
		// uniforms
			g.uniforms
	);
	g.modelGroups.push(grp);
	//GE.gl.useProgram(grp.prg);

	var w = g.size-1, h = g.size-1;

	// create a sky-dome
	var sky = new Sphere(g.size, 60, 1);
	//sky.update([.0, .0, .0]);
	//sky.matrix.scale(g.size, g.size, g.size);
	//sky.matrix.rotate(-60, 0, 1, 0);
	//sky.matrix.translate(.0, -g.size/8, .0);
	grp.addModel(sky);
	

	// model #2: terrain
	var vertices = [];
	var indices = [];
	var uv0 = [];

	g.heightMap1 = new Float32Array(new ArrayBuffer(4*g.size*g.size));
	g.heightMap2 = new Float32Array(new ArrayBuffer(4*g.size*g.size));

	var ix = 0;
	for (var j=0; j<=h; j++) {
		for (var i=0; i<=w; i++) {
			x = (i - w/2), z = (j - h/2);
			var tx = i/w, ty = j/h;
			vertices.push(x, 0, z);
			uv0.push(tx, ty);
			if (i < w && j < h) {
				var i1=i+j*g.size, i2=i1+1, i3=i1+g.size, i4=i3+1;
				indices.push(i1, i2, i4);
				indices.push(i1, i4, i3);
			}
			var fr = 16*2*Math.PI;
			//var he = 4*(Math.sin(fr*ty) + Math.cos(fr*tx));
			var dx = (0.5-tx), dy = (0-ty);
			var d = Math.sqrt(dx*dx+dy*dy);
			var he = .0;	//4*Math.sin(fr*d)*d;
			//he += Math.floor(x/BALLUNIT) + Math.floor(z/BALLUNIT);
			g.heightMap1[ix] = he, g.heightMap2[ix++] = he;
			//g.heightMap1[ix] = ((i == 0) ? w/5:0) + ((j == 0) ? w/10:0), g.heightMap2[ix++] = ix/w;
			//var he = 10*Math.sin(7*Math.PI*j/h)*Math.cos(7*Math.PI*i/w);
			//g.heightMap1[ix] = he, g.heightMap2[ix++] = he;
		}
	}
	var terrain = new Model({aPosition:vertices, aUV0:uv0, index:indices});
	grp.addModel(terrain);
	
	// texture #1: height map
	g.heightMap = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, g.heightMap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, g.size, g.size, 0, gl.LUMINANCE, gl.FLOAT, g.heightMap1);
	gl.uniform1i(GE.gl.getUniformLocation(g.modelGroups[0].prg, "heightMap"), 0);
	gl.bindTexture(gl.TEXTURE_2D, null);
	grp.textures.push(g.heightMap);

//	// texture #2: sky map
//	g.skyMap1 = new Float32Array(new ArrayBuffer(4*100*100));
//	for (var j=0; j<100; j++) {
//		for (var i=0; i<100; i++) {
//			g.skyMap1[i+100*j] = 0.6+0.4*Math.sin(10*i*Math.PI/100)*Math.sin(10*j*Math.PI/100);
//		}
//	}
//	g.skyMap = gl.createTexture();
//	gl.bindTexture(gl.TEXTURE_2D, g.skyMap);
//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 100, 100, 0, gl.LUMINANCE, gl.FLOAT, g.skyMap1);
//	gl.uniform1i(GE.gl.getUniformLocation(g.modelGroups[0].prg, "skyMap"), 1);
//	gl.bindTexture(gl.TEXTURE_2D, null);
//	g.modelGroups[0].textures.push(g.skyMap);

	grp.lock();
	setHeightMap();
}

function getSunColor(a, sx, sy) {
	var col = [0.0, 0.0, 0.0];
	// 330.. 90 - [sx= ,sy= ]...[sx= ,sy= ]
	//  90..310 - [sx= ,sy= ]...[sx= ,sy= ]
	// 310..330 - [sx= ,sy= ]...[sx= ,sy= ]
	var sc = g.uniforms.iSkyColor;
	if (sy < 0) {
		col[0] = 0.1-0.1*sy*sc[0];
		col[1] = 0.1-0.15*sy*sc[1];
		col[2] = 0.1-0.2*sy*sc[2];
	} else {
		sy *= 0.9;
		col[0] = 0.1+sy*sc[0];
		col[1] = 0.1+sy*sc[1];
		col[2] = 0.1+sy*sc[2];
	}
	return col;
}

var currentAngle = 0;
/*****************************************************************************/
function setHeightMap() {
    // update normals
	//var s = -2*this.hScale;
//	var ix1 = 0, ix2 = g.size, y1 = 0, y2 = 0, y3 = 0, y4 = 0;
//	for (var j=0; j<g.size-1; j++) {
//		for (var i=0; i<g.size-1; i++) {
//			y1 = g.heightMap1[ix1];		// + this.elevation;
//			y2 = g.heightMap1[ix1+1];	// + this.elevation;
//			y3 = g.heightMap1[ix2];		// + this.elevation;
//			y4 = g.heightMap1[ix2+1];	// + this.elevation;
/*
			var h = (y1+y2+y3+y4)/4;
			if (h < this.waterLevel) {
				y1 = y2 = y3 = y4 = this.waterLevel;
			}
//*/
//			if (y1 < this.waterLevel) y1 = this.waterLevel;
//			if (y2 < this.waterLevel) y2 = this.waterLevel;
//			if (y3 < this.waterLevel) y3 = this.waterLevel;
//			if (y4 < this.waterLevel) y4 = this.waterLevel;
//			var d1 = y2 - y1;
//			var d2 = y3 - y4;
//			var d3 = y3 - y2;
//			var u = new J3DIVector3(1, d1, 0),
//				v = new J3DIVector3(1, d2, 0),
//				w = new J3DIVector3(1, d3, 1);
//			u.cross(v);
//			u.divide(u.length());
//			g.heightMap1[2*ix1 + 1]
//		}
//	}
    gl.bindTexture(gl.TEXTURE_2D, g.heightMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, g.size, g.size, 0, gl.LUMINANCE, gl.FLOAT, g.heightMap1);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
function Sphere(r, d, inwards) {
	var positions = [];
	var normals = [];
	var indices = [];
	var uv0 = [];
	var i1 = 2, d1 = Math.floor(180/d)-1, d2 = Math.floor(360/d)*d1;
	positions.push(0,0,r,  0,0,-r);
	normals.push(0,0,r, 0,0,-r);
	uv0.push(.0,.0, .0,.0);
	for (var j=0; j<360; j+=d) {
		var alpha = Math.PI/180*j;
		i0 = 0;
		for (var i=1; i<=d1; i++) {
			var beta = Math.PI/180*i*d;
			var x = r*Math.cos(alpha)*Math.sin(beta);
			var y = r*Math.sin(alpha)*Math.sin(beta);
			var z = r*Math.cos(beta);
			positions.push(x, y, z);
			normals.push(x, y, z);
			uv0.push(.0, .0);
			var i2 = i1 + d1;
			if (i2 >= d2+2) i2 -= d2;
			var i3 = i1+1;
			if (i == d1) i3 = 1;
			if (inwards) {
				indices.push(i0, i1, i2);
				indices.push(i1, i3, i2);
			} else
			{
				indices.push(i0, i2, i1);
				indices.push(i1, i2, i3);
			}
			i0 = i2;
			i1++;
		}
	}
	for (var i=0; i<positions.length; i+=3) {
		j++;
		if (j == 4) { txt.push('\n'); j = 0; }
	}
	return new Model({aPosition:positions, aNormal:normals, aUV0:uv0, index:indices});
}

function Sphere2(r, neg) {
	var vertices = [];
	var indices = [];
	var texCoords = [];
	//var dy = r/n;
	dn *= Math.PI/180;
	dm *= Math.PI/180;
	var x = 0, y = 0, z = 0, i1 = 0;
	for (j=0; j<=cm; j++) {
		var alpha = j*dm;
		var d = r*Math.sin(alpha);
		var z = Math.round(100000*r*Math.cos(alpha))/100000;
		for (i=0; i<=cn; i++) {
			var beta = i*dn;
			x = Math.round(100000*d*Math.cos(beta))/100000;
			y = Math.round(100000*d*Math.sin(beta))/100000;
			var j1 = -1;
			for (var vi=0; vi<vertices.length; vi+=3) {
				if (vertices[vi] == x && vertices[vi+1] == y && vertices[vi+2] == z) {
					j1 = vi/3;
					break;
				}
			}
			if (j1 == -1) {
				vertices.push(x, y, z);
				texCoords.push(i/cn, j/cm);
				//j1 = i + j*(cm+1);
				j1 = i1;
				i1++;
			}
			//indices.push(j1);
			if (i < cn && j < cm) {
				var i2 = j1 + 1, i3 = j1+cm+1, i4 = j1+1+cm+1;
				if (neg) {
					indices.push(j1, i4, i2);
					indices.push(j1, i3, i4);
				} else {
					indices.push(j1, i2, i4);
					indices.push(j1, i4, i3);
				}
			}
		}
	}
	return new Model({aPosition:positions, aNormal:normals, index:indices});
}
//	  5---6
//	 /|  /|
//	1-4-2 7
//	|/  |/
//	0---3

function Cube(s, neg) {
	var positions = [-s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s, -s,-s,s, -s,s,s, s,s,s, s,-s,s];
	//var	indices = [0,1,2, 0,2,3, 0,4,5, 0,5,1, 1,5,6, 1,6,2, 2,6,7, 2,7,3, 3,7,4, 3,4,0, 5,4,7, 5,7,6];
	var	indices = [0,1,2, 0,2,3,  3,2,6, 3,6,7,  7,6,5, 7,5,4,  4,5,1, 4,1,0,  1,5,6, 1,6,2,  4,0,3, 4,3,7];
	var normals = [-1,-1,-1, -1,1,-1, 1,1,-1, 1,-1,-1, -1,-1,1, -1,1,1, 1,1,1, 1,-1,1];
	//var	indices = [0,1,1,2,2,3,3,0, 0,4,4,5,5,6,6,7,7,4, 1,5, 2,6, 3,7];
//	if (!neg) {
//		for (var i=0; i<indices.length; i+=3) {
//			var tmp = indices[i+1];
//			indices[i+1] = indices[i+2];
//			indices[i+2] = tmp;
//		}
//	}
	return new Model({aPosition:positions, aNormal:normals, index:indices});
}
