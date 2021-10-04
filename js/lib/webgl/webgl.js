(function () {
	// ********************************************************************************************
	//
	// Program
	//
	// ********************************************************************************************
	function Program(shaders, attribInfo) {
    	this.prg = gl.createProgram();
		this.shaders = [];
		this.uniforms = {};
		//// 2k buffer for uniforms
		//this.uniformData = new DataView(new ArrayBuffer(2048));

		this.attributesByBufferId = [];

	    for (var type in shaders) {
			var shader = webGL.createShader(type, shaders[type]);
			this.shaders.push(shader);
            gl.attachShader(this.prg, shader);
        }
        gl.linkProgram(this.prg);

        if (!gl.getProgramParameter(this.prg, gl.LINK_STATUS)) {
            throw new Error('Error linking shader program: ' + gl.getProgramInfoLog(this.prg));
        }

		var attributes = this.extractVariables(shaders[gl.VERTEX_SHADER]);
		var vsUniforms = this.extractVariables(shaders[gl.VERTEX_SHADER], true);
		var fsUniforms = this.extractVariables(shaders[gl.FRAGMENT_SHADER], true);
		var uniforms = mergeObjects(vsUniforms, fsUniforms);
        for (var ak in attributes) {
			var attrib = attributes[ak];
			attrib.ref = gl.getAttribLocation(this.prg, ak);
			if (attrib.ref != -1) {
				var bufferId = 0;
				var divisor = 0;
				var offset = -1;
				if (attribInfo && attribInfo[ak]) {
					if (attribInfo[ak].buffer != undefined) bufferId = attribInfo[ak].buffer;
					if (attribInfo[ak].divisor != undefined) divisor = attribInfo[ak].divisor;
					if (attribInfo[ak].offset != undefined) offset = attribInfo[ak].offset;
				}
				var aBucket = this.attributesByBufferId[bufferId];
				if (aBucket == undefined) {
					aBucket = this.attributesByBufferId[bufferId] = [0];	// first element is total size of attributes in bytes
				}
				attrib.offset = offset == -1 ? aBucket[0] : offset;
				attrib.divisor = divisor;
				aBucket.push(attrib);
				aBucket[0] += attrib.size;
			}
		}
		var offset = 0;
        for (var uk in uniforms) {
			var uniform = uniforms[uk];
			var type = uniform.type;
			uniform.ref = gl.getUniformLocation(this.prg, uk);
			if (uniform.ref != -1) {
				uniform.update = type.updater;
				uniform.set = type.set;
				uniform.offset = offset;
				uniform.value = type.name.startsWith('FLOAT') ? new Float32Array(type.length) : new Uint32Array(type.length);
				this.uniforms[uk] = uniform;
				offset += type.size;
			}
		}
	}
	Program.prototype.destroy = function destroy() {
		for (var i=0; i<this.shaders.length; i++) {
			var sh = this.shaders[i];
			gl.detachShader(this.prg, sh);
			gl.deleteShader(sh);
		}
		gl.deleteProgram(this.prg);
	};
	Program.prototype.extractVariables = function extractVariables(shader, isUniform) {
		var type = isUniform ? 'uniform' : 'in';
        var re = new RegExp(`^\\s*${type}\\s+(?<type>\\w+)\\s+(?<name>\\w+)\\s*;\\s*`, 'gim');
        var m = [...shader.matchAll(re)];
        var variables = {};
        for (var i=0; i<m.length; i++) {
            var t = m[i].groups.type.toUpperCase();
            var n = m[i].groups.name;
			var type = webGL.types[t];
			if (type) {
            	variables[n] = {
					'name': n,
					'type': type,
					'ref':0,
					'size':type.size
				};
			}
        }
		return variables;
    };
	Program.prototype.setUniform = function setUniform(name, value) {
		var u = this.uniforms[name];
		if (u) {
			u.set(value);
		}
	};
	Program.prototype.updateUniform = function updateUniform(name) {
		var u = this.uniforms[name];
		if (u) u.update(u);
	};

	var Uniform = {
		setScalar: function setScalar(value) {
			this.value[0] = value;
		},
		setVec2: function setVec2(value) {
			this.value[0] = value[0];
			this.value[1] = value[1];
		},
		setVec3: function setVec3(value) {
			this.value[0] = value[0];
			this.value[1] = value[1];
			this.value[2] = value[2];
		},
		setVec4: function setVec4(value) {
			this.value[0] = value[0];
			this.value[1] = value[1];
			this.value[2] = value[2];
			this.value[3] = value[3];
		},

		// setFloat: function setFloat(buffer) {
		// 	this.value[0] = buffer[0];
		// },
		// setVec2: function setVec2(buffer) {

		// },
		// setVec3: function setVec3(buffer) {

		// 	this.value[2] = buffer[2];
		// },
		// setVec4: function setVec4(buffer, offset, value) {
		// 	buffer.setFloat32(offset, 	value[0]);
		// 	buffer.setFloat32(offset+4, value[1]);
		// 	buffer.setFloat32(offset+8, value[2]);
		// 	buffer.setFloat32(offset+12,value[3]);
		// },
	
		// setBool: function setUint(buffer, offset, value) {
		// 	buffer.setUint32(offset, value);
		// },
		// setBool2: function setUint2(buffer, offset, value) {
		// 	buffer.setUint8(offset, 	value[0]);
		// 	buffer.setUint8(offset+4,	value[1]);
		// },
		// setBool3: function setUint3(buffer, offset, value) {
		// 	buffer.setUint8(offset, 	value[0]);
		// 	buffer.setUint8(offset+4,	value[1]);
		// 	buffer.setUint8(offset+8,	value[2]);
		// },
		// setBool4: function setUint4(buffer, offset, value) {
		// 	buffer.setUint8(offset, 	value[0]);
		// 	buffer.setUint8(offset+4,	value[1]);
		// 	buffer.setUint8(offset+8,	value[2]);
		// 	buffer.setUint8(offset+12,	value[3]);
		// },
	
		// setInt: function setUint(buffer, offset, value) {
		// 	buffer.setInt32(offset, value);
		// },
		// setInt2: function setInt2(buffer, offset, value) {
		// 	buffer.setInt32(offset, 	value[0]);
		// 	buffer.setInt32(offset+4,	value[1]);
		// },
		// setInt3: function setInt3(buffer, offset, value) {
		// 	buffer.setInt32(offset, 	value[0]);
		// 	buffer.setInt32(offset+4,	value[1]);
		// 	buffer.setInt32(offset+8,	value[2]);
		// },
		// setInt4: function setInt4(buffer, offset, value) {
		// 	buffer.setInt32(offset, 	value[0]);
		// 	buffer.setInt32(offset+4,	value[1]);
		// 	buffer.setInt32(offset+8,	value[2]);
		// 	buffer.setInt32(offset+12,	value[3]);
		// },
	
		// setUint: function setUint(buffer, offset, value) {
		// 	buffer.setUint32(offset, value);
		// },
		// setUint2: function setUint2(buffer, offset, value) {
		// 	buffer.setUint32(offset, 	value[0]);
		// 	buffer.setUint32(offset+4,	value[1]);
		// },
		// setUint3: function setUint3(buffer, offset, value) {
		// 	buffer.setUint32(offset, 	value[0]);
		// 	buffer.setUint32(offset+4,	value[1]);
		// 	buffer.setUint32(offset+8,	value[2]);
		// },
		// setUint4: function setUint4(buffer, offset, value) {
		// 	buffer.setUint32(offset, 	value[0]);
		// 	buffer.setUint32(offset+4,	value[1]);
		// 	buffer.setUint32(offset+8,	value[2]);
		// 	buffer.setUint32(offset+12,	value[3]);
		// },
	
		setMat2: function setMat2(value) {
			for (var i=0; i<4; i++) {
				this.value[i] = value[i];
			}
		},
		setMat2x3: function setMat2x3(value) {
			for (var i=0; i<6; i++) {
				this.value[i] = value[i];
			}
		},
		setMat2x4: function setMat2x4(value) {
			for (var i=0; i<8; i++) {
				this.value[i] = value[i];
			}
		},
		setMat3: function setMat3(value) {
			for (var i=0; i<9; i++) {
				this.value[i] = value[i];
			}
		},
		setMat3x4: function setMat3x4(value) {
			for (var i=0; i<12; i++) {
				this.value[i] = value[i];
			}
		},
		setMat4: function setMat4(value) {
			for (var i=0; i<16; i++) {
				this.value[i] = value[i];
			}
		}	
	};

	var webGL = {
		VERTEX_ATTRIB_POSITION:		0x01,
		VERTEX_ATTRIB_NORMAL:		0x02,
		VERTEX_ATTRIB_COLOR:		0x04,
		VERTEX_ATTRIB_TEXTURE1:		0x08,
		VERTEX_ATTRIB_TEXTURE2:		0x10,

		buffers: [],
		extensions: {}
	};

	webGL.types = {
	//#region uniform
		FLOAT:	{ 'name': 'FLOAT', 				'base':'FLOAT', 'id': 0, 'size':  4, 'length':  1, 'set': Uniform.setScalar, 'updater': un => gl.uniform1f(un.ref, un.value) },
		VEC2:	{ 'name': 'FLOAT_VEC2', 		'base':'FLOAT', 'id': 0, 'size':  8, 'length':  2, 'set': Uniform.setVec2, 	 'updater': un => gl.uniform2f(un.ref, un.value[0], un.value[1] ) },
		VEC3:	{ 'name': 'FLOAT_VEC3', 		'base':'FLOAT', 'id': 0, 'size': 12, 'length':  3, 'set': Uniform.setVec3, 	 'updater': un => gl.uniform3f(un.ref, un.value[0], un.value[1], un.value[2]) },
		VEC4:	{ 'name': 'FLOAT_VEC4', 		'base':'FLOAT', 'id': 0, 'size': 16, 'length':  4, 'set': Uniform.setVec4, 	 'updater': un => gl.uniform4f(un.ref, un.value[0], un.value[1], un.value[2], un.value[3]) },
		BOOL:	{ 'name': 'BOOL', 				'base':'BOOL',  'id': 0, 'size':  1, 'length':  1, 'set': Uniform.setScalar, 'updater': un => gl.uniform1i(un.ref, un.value) },
		BVEC2:	{ 'name': 'BOOL_VEC2',			'base':'BOOL',  'id': 0, 'size':  2, 'length':  2, 'set': Uniform.setVec2, 	 'updater': un => gl.uniform2i(un.ref, un.value[0], un.value[1] ) },
		BVEC3:	{ 'name': 'BOOL_VEC3',			'base':'BOOL',  'id': 0, 'size':  3, 'length':  3, 'set': Uniform.setVec3, 	 'updater': un => gl.uniform3i(un.ref, un.value[0], un.value[1], un.value[2]) },
		BVEC4:	{ 'name': 'BOOL_VEC4',			'base':'BOOL',  'id': 0, 'size':  4, 'length':  4, 'set': Uniform.setVec4, 	 'updater': un => gl.uniform4i(un.ref, un.value[0], un.value[1], un.value[2], un.value[3]) },
		INT:	{ 'name': 'INT',				'base':'INT',   'id': 0, 'size':  4, 'length':  1, 'set': Uniform.setScalar, 'updater': un => gl.uniform1i(un.ref, un.value) },
		IVEC2:	{ 'name': 'INT_VEC2',			'base':'INT',   'id': 0, 'size':  8, 'length':  2, 'set': Uniform.setVec2, 	 'updater': un => gl.uniform2i(un.ref, un.value[0], un.value[1] ) },
		IVEC3:	{ 'name': 'INT_VEC3',			'base':'INT',   'id': 0, 'size': 12, 'length':  3, 'set': Uniform.setVec3, 	 'updater': un => gl.uniform3i(un.ref, un.value[0], un.value[1], un.value[2]) },
		IVEC4:	{ 'name': 'INT_VEC4',			'base':'INT',   'id': 0, 'size': 16, 'length':  4, 'set': Uniform.setVec4, 	 'updater': un => gl.uniform4i(un.ref, un.value[0], un.value[1], un.value[2], un.value[3]) },
		UINT:	{ 'name': 'UNSIGNED_INT',		'base':'UINT',  'id': 0, 'size':  4, 'length':  1, 'set': Uniform.setScalar, 'updater': un => gl.uniform1i(un.ref, un.value) },
		UVEC2:	{ 'name': 'UNSIGNED_INT_VEC2',	'base':'UINT',  'id': 0, 'size':  8, 'length':  2, 'set': Uniform.setVec2, 	 'updater': un => gl.uniform2i(un.ref, un.value[0], un.value[1] ) },
		UVEC3:	{ 'name': 'UNSIGNED_INT_VEC3',	'base':'UINT',  'id': 0, 'size': 12, 'length':  3, 'set': Uniform.setVec3, 	 'updater': un => gl.uniform3i(un.ref, un.value[0], un.value[1], un.value[2]) },
		UVEC4:	{ 'name': 'UNSIGNED_INT_VEC4',	'base':'UINT',  'id': 0, 'size': 16, 'length':  4, 'set': Uniform.setVec4, 	 'updater': un => gl.uniform4i(un.ref, un.value[0], un.value[1], un.value[2], un.value[3]) },
		MAT2:	{ 'name': 'FLOAT_MAT2',			'base':'FLOAT', 'id': 0, 'size': 16, 'length':  4, 'set': Uniform.setMat2, 	 'updater': un => gl.uniformMatrix2fv  (un.ref, false, un.value) },
		MAT2x3:	{ 'name': 'FLOAT_MAT2x3',		'base':'FLOAT', 'id': 0, 'size': 24, 'length':  6, 'set': Uniform.setMat2x3, 'updater': un => gl.uniformMatrix2x3fv(un.ref, false, un.value) },
		MAT2x4:	{ 'name': 'FLOAT_MAT2x4',		'base':'FLOAT', 'id': 0, 'size': 32, 'length':  8, 'set': Uniform.setMat2x4, 'updater': un => gl.uniformMatrix2x4fv(un.ref, false, un.value) },
		MAT3:	{ 'name': 'FLOAT_MAT3',			'base':'FLOAT', 'id': 0, 'size': 36, 'length':  9, 'set': Uniform.setMat3, 	 'updater': un => gl.uniformMatrix3fv  (un.ref, false, un.value) },
		MAT3x2:	{ 'name': 'FLOAT_MAT3x2',		'base':'FLOAT', 'id': 0, 'size': 24, 'length':  6, 'set': Uniform.setMat2x3, 'updater': un => gl.uniformMatrix3x2fv(un.ref, false, un.value) },
		MAT3x4:	{ 'name': 'FLOAT_MAT3x4',		'base':'FLOAT', 'id': 0, 'size': 48, 'length': 12, 'set': Uniform.setMat3x4, 'updater': un => gl.uniformMatrix3x4fv(un.ref, false, un.value) },
		MAT4:	{ 'name': 'FLOAT_MAT4',			'base':'FLOAT', 'id': 0, 'size': 64, 'length': 16, 'set': Uniform.setMat4, 	 'updater': un => gl.uniformMatrix4fv  (un.ref, false, un.value) },
		MAT4x2:	{ 'name': 'FLOAT_MAT4x2',		'base':'FLOAT', 'id': 0, 'size': 32, 'length':  8, 'set': Uniform.setMat2x4, 'updater': un => gl.uniformMatrix4x2fv(un.ref, false, un.value) },
		MAT4x3:	{ 'name': 'FLOAT_MAT4x3',		'base':'FLOAT', 'id': 0, 'size': 48, 'length': 12, 'set': Uniform.setMat3x4, 'updater': un => gl.uniformMatrix4x3fv(un.ref, false, un.value) },
	SAMPLER2D:	{ 'name': 'SAMPLER_2D',			'base':null, 	'id': 0, 'size':  1, 'length':  1, 'set': Uniform.setScalar, 'updater': un => gl.uniform1i(un.ref, un.value) },
		// FLOATV:	{ 'name': 'FLOAT', 				'id': 0, 'size':  4,'length':  1, 'updater': (ref, value) => gl.uniform1fv(ref, value) },
		// VEC2V:	{ 'name': 'FLOAT_VEC2', 		'id': 0, 'size':  8,'length':  2, 'updater': (ref, value) => gl.uniform2fv(ref, value) },
		// VEC3V:	{ 'name': 'FLOAT_VEC3', 		'id': 0, 'size': 12,'length':  3, 'updater': (ref, value) => gl.uniform3fv(ref, value) },
		// VEC4V:	{ 'name': 'FLOAT_VEC4', 		'id': 0, 'size': 16,'length':  4, 'updater': (ref, value) => gl.uniform4fv(ref, value) },
		// BOOLV:	{ 'name': 'BOOL', 				'id': 0, 'size':  1,'length':  1, 'updater': (ref, value) => gl.uniform1iv(ref, value) },
		// BVEC2V:	{ 'name': 'BOOL_VEC2',			'id': 0, 'size':  2,'length':  2, 'updater': (ref, value) => gl.uniform2iv(ref, value) },
		// BVEC3V:	{ 'name': 'BOOL_VEC3',			'id': 0, 'size':  3,'length':  3, 'updater': (ref, value) => gl.uniform3iv(ref, value) },
		// BVEC4V:	{ 'name': 'BOOL_VEC4',			'id': 0, 'size':  4,'length':  4, 'updater': (ref, value) => gl.uniform4iv(ref, value) },
		// INTV:	{ 'name': 'INT',				'id': 0, 'size':  4,'length':  1, 'updater': (ref, value) => gl.uniform1iv(ref, value) },
		// IVEC2V:	{ 'name': 'INT_VEC2',			'id': 0, 'size':  8,'length':  2, 'updater': (ref, value) => gl.uniform2iv(ref, value) },
		// IVEC3V:	{ 'name': 'INT_VEC3',			'id': 0, 'size': 12,'length':  3, 'updater': (ref, value) => gl.uniform3iv(ref, value) },
		// IVEC4V:	{ 'name': 'INT_VEC4',			'id': 0, 'size': 16,'length':  4, 'updater': (ref, value) => gl.uniform4iv(ref, value) },
		// UINTV:	{ 'name': 'UNSIGNED_INT',		'id': 0, 'size':  4,'length':  1, 'updater': (ref, value) => gl.uniform1iv(ref, value) },
		// UVEC2V:	{ 'name': 'UNSIGNED_INT_VEC2',	'id': 0, 'size':  8,'length':  2, 'updater': (ref, value) => gl.uniform2iv(ref, value) },
		// UVEC3V:	{ 'name': 'UNSIGNED_INT_VEC3',	'id': 0, 'size': 12,'length':  3, 'updater': (ref, value) => gl.uniform3iv(ref, value) },
		// UVEC4V:	{ 'name': 'UNSIGNED_INT_VEC4',	'id': 0, 'size': 16,'length':  4, 'updater': (ref, value) => gl.uniform4iv(ref, value) }
	//#endregion
	//#region texture
		R8UI:	{ 'name':'R8UI',		'base':'UINT', 		'id': 0, 'size':  1, 'length':  1, 'type': 'UNSIGNED_BYTE' 	},
		R32UI:	{ 'name':'R32UI',		'base':'UINT', 		'id': 0, 'size':  4, 'length':  1, 'type': 'UNSIGNED_INT' 	},
		R32F:	{ 'name':'R32F',		'base':'FLOAT', 	'id': 0, 'size':  4, 'length':  1, 'type': 'FLOAT' 			},
		RG8UI:	{ 'name':'RG8UI',		'base':'UINT', 		'id': 0, 'size':  2, 'length':  2, 'type': 'UNSIGNED_BYTE' 	},
		RG32UI:	{ 'name':'RG32UI',		'base':'UINT', 		'id': 0, 'size':  8, 'length':  2, 'type': 'UNSIGNED_INT' 	},
		RG32F:	{ 'name':'RG32F',		'base':'FLOAT', 	'id': 0, 'size':  8, 'length':  2, 'type': 'FLOAT' 			},
	   RGBA8UI:	{ 'name':'RGBA8UI', 	'base':'UINT',		'id': 0, 'size':  4, 'length':  4, 'type': 'UNSIGNED_BYTE' 	},
	  RGBA32UI:	{ 'name':'RGBA32UI',	'base':'UINT', 		'id': 0, 'size': 16, 'length':  4, 'type': 'UNSIGNED_INT' 	},
	   RGBA32F:	{ 'name':'RGBA32F',		'base':'FLOAT', 	'id': 0, 'size': 16, 'length':  4, 'type': 'FLOAT' 			}
	//#endregion
	};

	webGL.init = function init(canvas, useWebGl2) {
		if (!canvas) {
			var canvas = document.createElement('canvas');
			canvas.id = 'canvas';
			canvas.width = window.innerWidth/1;
			canvas.height = window.innerHeight/1;
			document.body.appendChild(canvas);
		}
		var ver = useWebGl2 ? 'webgl2': 'webgl';
		window.gl = canvas.getContext(ver, { alpha: true });
		// translate uniform types
		for (var i in this.types) {
			var ut = this.types[i];
			var id = gl[ut.name];
			if (id != undefined) {
				window[`gl_${i.toLowerCase()}`] = ut.id = id;
				var base = gl[ut.base];
				if (base != undefined) ut.base = base;
				//this.types[id] = ut;
			} else console.warn(`Type '${i}' not valid.`);

		}
	};
	webGL.onresize = function onresize() {
		
	};

	webGL.createBuffer = function createBuffer(target, source, usage) {
		var buffer = gl.createBuffer();
		if (source != undefined) {
			gl.bindBuffer(target, buffer);
			gl.bufferData(target, source, usage);
		}
		this.buffers.push({'type':target, 'ref':buffer});
		return buffer;
	};
	webGL.deleteBuffer = function deleteBuffer(ref) {
		var ix = this.buffers.findIndex(x => x.ref == ref);
		if (ix != -1) {
			gl.deleteBuffer(ref);
			this.buffers.splice(ix, 1);
		}
	};
	webGL.createShader = function(type, code) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, code);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error('Error compiling shader:' + gl.getShaderInfoLog(shader));
		}
		return shader;
	};
	webGL.createProgram = function(shaders, attribInfo) {
		return new Program(shaders, attribInfo);
	};
	webGL.useProgram = function(p, uniforms) {
		if (p != null) {
			gl.useProgram(p.prg);
			for (var i=0; i<p.attributesByBufferId.length; i++) {
				var ab = p.attributesByBufferId[i];
				if (ab) {
					gl.bindBuffer(webGL.buffers[i].type, webGL.buffers[i].ref);
					for (var j=1; j<p.attributesByBufferId[i].length; j++) {
						var a = p.attributesByBufferId[i][j];
						gl.enableVertexAttribArray(a.ref);
						gl.vertexAttribPointer(a.ref, a.type.length, gl.FLOAT, false, p.attributesByBufferId[i][0], a.offset);
						//if (a.divisor) webGL.extensions.ANGLE_instanced_arrays.vertexAttribDivisorANGLE(a.ref, a.divisor);
						if (a.divisor) gl.vertexAttribDivisor(a.ref, a.divisor);
					}
				}
			}

			if (uniforms) {
				for (var i in uniforms) {
					p.setUniform(i, uniforms[i]);
					p.updateUniform(i);
				}
			}
		} else gl.useProgram(null);
		return p;
	};
	webGL.createTexture = function createTexture(image) {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		if (image) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		return texture;
	};
	webGL.useExtension = function useExtension(extensionName) {
		var ext = gl.getExtension(extensionName);
		if (ext) webGL.extensions[extensionName] = ext;
		return ext;
	};

	publish(webGL, 'webGL');

})();