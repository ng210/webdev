(function () {
	//#region BUFFER (TEXTURE)
    function Buffer() {
        this.type = webGL.types.FLOAT;
        this.length = 0;
        this.originalLength = 0;
        this.width = 256;
        this.height = 256;
        this.internalFormat = 0;
        this.format = 0;
        this.type = 0;
        this.data = null;
        this.texture = null;
    }

    Buffer.prototype.setType = function setType(type) {
		if (typeof type === 'string') {
			switch (type.toLowerCase()) {
				case 'uint8':
				case 'byte': this.type = webGL.types.R8UI; break;
				case 'uint32':
				case 'long': this.type = webGL.types.R32UI; break;
				case 'float': this.type = webGL.types.R32F; break;
				case 'uint8[2]':
				case 'byte[2]': this.type = webGL.types.RG8UI; break;
				case 'uint32[2]':
				case 'long[2]': this.type = webGL.types.RG32UI; break;
				case 'float[2]': this.type = webGL.types.RG32F; break;
				case 'uint8[4]':
				case 'byte[4]': this.type = webGL.types.RGBA8UI; break;
				case 'uint32[4]':
				case 'long[4]': this.type = webGL.types.RGBA32UI; break;
				case 'float[4]': this.type = webGL.types.RGBA32F; break;
				default: throw new Error(`Unsupported type '${type}'!`);
			}
		} else if (Object.values(webGL.types).indexOf(type) != -1) {
			this.type = type;
		} else throw new Error(`Unkown type '${type}'!`);

		this.internalFormat = 0, this.format = 0;
		switch (this.type.id) {
			case gl.R8UI:    	this.internalFormat = gl.R8UI;   	this.format = gl.RED_INTEGER;   break;
			case gl.R32UI:      this.internalFormat = gl.R32UI;     this.format = gl.RED_INTEGER;	break;
			case gl.R32F:       this.internalFormat = gl.R32F;      this.format = gl.RED;			break;

			case gl.RG8UI:      this.internalFormat = gl.RG8UI;     this.format = gl.RG_INTEGER;  	break;
			case gl.RG32UI:     this.internalFormat = gl.RG32UI;    this.format = gl.RG_INTEGER;    break;
			case gl.RG32F:      this.internalFormat = gl.RG32F;     this.format = gl.RG;			break;

			case gl.RGBA8:    	this.internalFormat = gl.RGBA8;   	this.format = gl.RGBA;			break;
			case gl.RGBA8UI:    this.internalFormat = gl.RGBA8UI;   this.format = gl.RGBA_INTEGER;	break;
			case gl.RGBA32UI:   this.internalFormat = gl.RGBA32UI;  this.format = gl.RGBA_INTEGER;	break;
			case gl.RGBA32F:    this.internalFormat = gl.RGBA32F;   this.format = gl.RGBA;			break;

			default: throw new Error('Invalid type!');
		}
    };

    Buffer.prototype.setSize = function setSize() {
		if (arguments.length == 1) {
			// length
			this.originalLength = arguments[0];
			var length = arguments[0]/this.type.length;
			var r = Math.ceil(Math.sqrt(length));
			var p = Math.ceil(Math.log2(r));
			this.width = Math.pow(2, p);
			this.height = Math.ceil(length/this.width);
		} else if (arguments.length > 1) {
			// width, height
			this.width = arguments[0];
			this.height = arguments[1];
			this.originalLength = this.width * this.height * this.type.length;
		}

		this.length = this.width * this.height * this.type.length;
    };

    Buffer.prototype.createArrayBuffer = function createArrayBuffer() {
        switch (this.type.id) {
            case gl.R8UI:
            case gl.RG8UI:
            case gl.RGBA8UI:
                this.data = new Uint8Array(this.length);
                break;
            case gl.R32UI:
            case gl.RG32UI:
            case gl.RGBA32UI:
                this.data = new Uint32Array(this.length);
                break;
            case gl.R32F:
            case gl.RG32F:
            case gl.RGBA32F:
                this.data = new Float32Array(this.length);
                break;
            default:
                throw new Error('Unsupported input data type!');
        }
		return this.data;
    };

    Buffer.prototype.setData = function setData(source) {
		var data = null;
		// default fbo
		if (source == null) {
			// use current fbo
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			this.texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, this.width, this.height, 0);
		}
		// fbo
		else if (source instanceof WebGLFramebuffer) throw new Error('Only the default FrameBuffer object is supported!');
		// Buffer
		else if (source instanceof webGL.Buffer) data = source.data;
		// length or [width, height]
		else if (typeof source === 'number' || Array.isArray(source)) data = this.createArrayBuffer();
        // ArrayBuffer
		else if (source.buffer && source.buffer instanceof ArrayBuffer) data = source;
		// image
        else if (source instanceof Image) data = source;

		// if (data && data.length != this.length) {
		// 	// resize buffer
		// 	var buffer = Reflect.construct(this.data.constructor, [this.length]);
		// 	buffer.set(this.data, 0);
		// 	this.data = buffer;
		// }

		if (source) {
			this.setTexture(data);
		}
    };
	Buffer.prototype.updateTexture = function updateTexture(data) {
		data = data || this.data;
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		if (data.buffer instanceof ArrayBuffer) {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.type.id, this.width, this.height, 0, this.format, gl[this.type.type], data, 0);
		} else {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.type.id, this.width, this.height, 0, this.format, gl[this.type.type], data);
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		//gl.generateMipmap(gl.TEXTURE_2D);
		
	};
    Buffer.prototype.setTexture = function setTexture(data) {
        data = data || this.data;
        if (data) {
			if (!this.texture) {
				this.texture = gl.createTexture();
			}
			this.updateTexture(data);
        }
    };
	Buffer.prototype.setShader = function setShader(fs) {
		if (!fs) {
			this.prg = webGL.flatRenderingPrg;
		} else {
			var shaders = {};
			shaders[gl.VERTEX_SHADER] = webGL.flatShaders[gl.VERTEX_SHADER];
			shaders[gl.FRAGMENT_SHADER] = fs;
			this.prg = webGL.createProgram(shaders, { 'a_position': { 'buffer': 0 }});
		}
	};
	Buffer.prototype.render = function render(shaderArgs) {
		webGL.useProgram(this.prg || webGL.flatRenderingPrg, shaderArgs);
		gl.bindBuffer(gl.ARRAY_BUFFER, webGL.screenVBO.ref);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	};

    Buffer.fromLength = function fromLength(length, type) {
        var buffer = new Buffer();
        buffer.setType(type);
        buffer.setSize(length);
		buffer.setData(buffer.length);
        return buffer;
    };
	Buffer.fromSize = function fromSize(width, height, type) {
		var buffer = new Buffer();
		buffer.setType(type);
		buffer.setSize(width, height);
		buffer.setData(buffer.length);
		return buffer;
	};

    Buffer.fromArrayBuffer = function fromArrayBuffer(arrayBuffer, type) {
        if (!type) {
            switch (arrayBuffer.constructor) {
                case Uint8Array: type = 'uint8'; break;
                case Uint32Array: type = 'uint32'; break;
                case Float32Array: type = 'float'; break;
                default: throw new Error('Unsupported input ArrayBuffer type!');
            }
        }
        var buffer = new Buffer();
        buffer.setType(type);
        buffer.setSize(arrayBuffer.length);
		buffer.setData(buffer.length);
        return buffer;
    };

	Buffer.fromBuffer = function fromBuffer(inputBuffer, type) {
		var buffer = new Buffer();
		buffer.setType(type || inputBuffer.type);
		buffer.setSize(inputBuffer.width, inputBuffer.height);
		buffer.data = inputBuffer.data;
		buffer.texture = inputBuffer.texture;
		return buffer;
	};

    Buffer.fromImage = function fromImage(img, type) {
        var buffer = new Buffer();
		buffer.setType(type || webGL.types.RGBA32F);
		buffer.setSize(img.naturalWidth || img.width, img.naturalHeight || img.height);
		buffer.setData(img);
        return buffer;
    };

    Buffer.fromFramebuffer = function fromFramebuffer(fbo, type) {
        var buffer = new Buffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		if (!fbo) {
			// fix type to UINT8[4]
			// TODO: get type from fbo (getFrameBufferParameter?)
			buffer.setType(type || 'float[4]');
			buffer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
		} else {
			throw new Error('Framebuffers except default are not supported!');
			// buffer.texture = gl.createTexture();
			// gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
			// gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, buffer.width, buffer.height, 0);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		}

		buffer.setData(fbo);
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return buffer;
    };

    Buffer.create = function create(data, type) {
        var buffer = null;
        if (!data || data instanceof WebGLFramebuffer) buffer = Buffer.fromFramebuffer(data, type);
		else if (data instanceof webGL.Buffer) buffer = Buffer.fromBuffer(data, type);
        else if (typeof data === 'number') buffer = Buffer.fromLength(data, type);
        else if (Array.isArray(data)) buffer = Buffer.fromSize(data[0], data[1], type);
        else if (data.buffer && data.buffer instanceof ArrayBuffer) buffer = Buffer.fromArrayBuffer(data, type);
        else if (data instanceof Image) buffer = Buffer.fromImage(data, type);
        return buffer;
    };
	//#endregion
	
	//#region PROGRAM
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
		var uniforms = mergeObjects(vsUniforms, fsUniforms, mergeObjects.NEW);
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
        var re = new RegExp(`[;\\s]${type}\\s+(?<type>\\w+)\\s+(?<name>\\w+)\\s*;`, 'gim');
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
	//#endregion

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
		textures: [],
		extensions: {},

		screenVBO: null
	};

	webGL.types = {
	//#region uniform
	FLOAT:	{ 'name': 'FLOAT', 				'base':'FLOAT', 'id': 0, 'size':  4, 'length':  1, 'set': Uniform.setScalar, 'updater': function() { gl.uniform1f(this.ref, this.value); } },
	VEC2:	{ 'name': 'FLOAT_VEC2', 		'base':'FLOAT', 'id': 0, 'size':  8, 'length':  2, 'set': Uniform.setVec2, 	 'updater': function() { gl.uniform2f(this.ref, this.value[0], this.value[1] ); } },
	VEC3:	{ 'name': 'FLOAT_VEC3', 		'base':'FLOAT', 'id': 0, 'size': 12, 'length':  3, 'set': Uniform.setVec3, 	 'updater': function() { gl.uniform3f(this.ref, this.value[0], this.value[1], this.value[2]); } },
	VEC4:	{ 'name': 'FLOAT_VEC4', 		'base':'FLOAT', 'id': 0, 'size': 16, 'length':  4, 'set': Uniform.setVec4, 	 'updater': function() { gl.uniform4f(this.ref, this.value[0], this.value[1], this.value[2], this.value[3]); } },
	BOOL:	{ 'name': 'BOOL', 				'base':'BOOL',  'id': 0, 'size':  1, 'length':  1, 'set': Uniform.setScalar, 'updater': function() { gl.uniform1i(this.ref, this.value); } },
	BVEC2:	{ 'name': 'BOOL_VEC2',			'base':'BOOL',  'id': 0, 'size':  2, 'length':  2, 'set': Uniform.setVec2, 	 'updater': function() { gl.uniform2i(this.ref, this.value[0], this.value[1] ); } },
	BVEC3:	{ 'name': 'BOOL_VEC3',			'base':'BOOL',  'id': 0, 'size':  3, 'length':  3, 'set': Uniform.setVec3, 	 'updater': function() { gl.uniform3i(this.ref, this.value[0], this.value[1], this.value[2]); } },
	BVEC4:	{ 'name': 'BOOL_VEC4',			'base':'BOOL',  'id': 0, 'size':  4, 'length':  4, 'set': Uniform.setVec4, 	 'updater': function() { gl.uniform4i(this.ref, this.value[0], this.value[1], this.value[2], this.value[3]); } },
	INT:	{ 'name': 'INT',				'base':'INT',   'id': 0, 'size':  4, 'length':  1, 'set': Uniform.setScalar, 'updater': function() { gl.uniform1i(this.ref, this.value); } },
	IVEC2:	{ 'name': 'INT_VEC2',			'base':'INT',   'id': 0, 'size':  8, 'length':  2, 'set': Uniform.setVec2, 	 'updater': function() { gl.uniform2i(this.ref, this.value[0], this.value[1] ); } },
	IVEC3:	{ 'name': 'INT_VEC3',			'base':'INT',   'id': 0, 'size': 12, 'length':  3, 'set': Uniform.setVec3, 	 'updater': function() { gl.uniform3i(this.ref, this.value[0], this.value[1], this.value[2]); } },
	IVEC4:	{ 'name': 'INT_VEC4',			'base':'INT',   'id': 0, 'size': 16, 'length':  4, 'set': Uniform.setVec4, 	 'updater': function() { gl.uniform4i(this.ref, this.value[0], this.value[1], this.value[2], this.value[3]); } },
	UINT:	{ 'name': 'UNSIGNED_INT',		'base':'UINT',  'id': 0, 'size':  4, 'length':  1, 'set': Uniform.setScalar, 'updater': function() { gl.uniform1i(this.ref, this.value); } },
	UVEC2:	{ 'name': 'UNSIGNED_INT_VEC2',	'base':'UINT',  'id': 0, 'size':  8, 'length':  2, 'set': Uniform.setVec2, 	 'updater': function() { gl.uniform2i(this.ref, this.value[0], this.value[1] ); } },
	UVEC3:	{ 'name': 'UNSIGNED_INT_VEC3',	'base':'UINT',  'id': 0, 'size': 12, 'length':  3, 'set': Uniform.setVec3, 	 'updater': function() { gl.uniform3i(this.ref, this.value[0], this.value[1], this.value[2]); } },
	UVEC4:	{ 'name': 'UNSIGNED_INT_VEC4',	'base':'UINT',  'id': 0, 'size': 16, 'length':  4, 'set': Uniform.setVec4, 	 'updater': function() { gl.uniform4i(this.ref, this.value[0], this.value[1], this.value[2], this.value[3]); } },
	MAT2:	{ 'name': 'FLOAT_MAT2',			'base':'FLOAT', 'id': 0, 'size': 16, 'length':  4, 'set': Uniform.setMat2, 	 'updater': function() { gl.uniformMatrix2fv  (this.ref, false, this.value); } },
	MAT2x3:	{ 'name': 'FLOAT_MAT2x3',		'base':'FLOAT', 'id': 0, 'size': 24, 'length':  6, 'set': Uniform.setMat2x3, 'updater': function() { gl.uniformMatrix2x3fv(this.ref, false, this.value); } },
	MAT2x4:	{ 'name': 'FLOAT_MAT2x4',		'base':'FLOAT', 'id': 0, 'size': 32, 'length':  8, 'set': Uniform.setMat2x4, 'updater': function() { gl.uniformMatrix2x4fv(this.ref, false, this.value); } },
	MAT3:	{ 'name': 'FLOAT_MAT3',			'base':'FLOAT', 'id': 0, 'size': 36, 'length':  9, 'set': Uniform.setMat3, 	 'updater': function() { gl.uniformMatrix3fv  (this.ref, false, this.value); } },
	MAT3x2:	{ 'name': 'FLOAT_MAT3x2',		'base':'FLOAT', 'id': 0, 'size': 24, 'length':  6, 'set': Uniform.setMat2x3, 'updater': function() { gl.uniformMatrix3x2fv(this.ref, false, this.value); } },
	MAT3x4:	{ 'name': 'FLOAT_MAT3x4',		'base':'FLOAT', 'id': 0, 'size': 48, 'length': 12, 'set': Uniform.setMat3x4, 'updater': function() { gl.uniformMatrix3x4fv(this.ref, false, this.value); } },
	MAT4:	{ 'name': 'FLOAT_MAT4',			'base':'FLOAT', 'id': 0, 'size': 64, 'length': 16, 'set': Uniform.setMat4, 	 'updater': function() { gl.uniformMatrix4fv  (this.ref, false, this.value); } },
	MAT4x2:	{ 'name': 'FLOAT_MAT4x2',		'base':'FLOAT', 'id': 0, 'size': 32, 'length':  8, 'set': Uniform.setMat2x4, 'updater': function() { gl.uniformMatrix4x2fv(this.ref, false, this.value); } },
	MAT4x3:	{ 'name': 'FLOAT_MAT4x3',		'base':'FLOAT', 'id': 0, 'size': 48, 'length': 12, 'set': Uniform.setMat3x4, 'updater': function() { gl.uniformMatrix4x3fv(this.ref, false, this.value); } },
SAMPLER2D:	{ 'name': 'SAMPLER_2D',			'base':null, 	'id': 0, 'size':  1, 'length':  1, 'set': Uniform.setScalar, 'updater': function() { gl.uniform1i(this.ref, this.value); } },
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
	    RGBA8:	{ 'name':'RGBA8', 		'base':'UINT',		'id': 0, 'size':  4, 'length':  4, 'type': 'UNSIGNED_BYTE' 	},
	   RGBA8UI:	{ 'name':'RGBA8UI', 	'base':'UINT',		'id': 0, 'size':  4, 'length':  4, 'type': 'UNSIGNED_BYTE' 	},
	  RGBA32UI:	{ 'name':'RGBA32UI',	'base':'UINT', 		'id': 0, 'size': 16, 'length':  4, 'type': 'UNSIGNED_INT' 	},
	   RGBA32F:	{ 'name':'RGBA32F',		'base':'FLOAT', 	'id': 0, 'size': 16, 'length':  4, 'type': 'FLOAT' 			}
	//#endregion
	};

	webGL.Buffer = Buffer;

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
		this.buffers.length = 0;
		this.textures.length = 0;
		this.screenVBO = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);
		this.flatShaders = {};
		this.flatShaders[gl.VERTEX_SHADER] = 
		   `#version 300 es
			in vec2 a_position;
			out vec2 v_texcoord;
	
			void main(void) {
				gl_Position = vec4(a_position, 0., 1.);
				v_texcoord = vec2(.5*a_position.x + .5, .5*a_position.y + .5);
			}`;
			this.flatShaders[gl.FRAGMENT_SHADER] =
		   `#version 300 es
			precision highp float;

			uniform sampler2D u_texture0;
			in vec2 v_texcoord;
			out vec4 color;
	
			void main(void) {
				color = texture(u_texture0, v_texcoord);
			}`;
			this.flatRenderingPrg = webGL.createProgram(this.flatShaders);
	};
	webGL.shutDown = function shutDown() {
		while (this.buffers.length != 0) {
			gl.deleteBuffer(this.buffers.pop().ref);
		}
		while (this.textures.length != 0) {
			gl.deleteTexture(this.textures.pop().texture);
		}
		gl.useProgram(null);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
	};
	webGL.onresize = function onresize() {
		
	};

	webGL.createBuffer = function createBuffer(target, source, usage) {
		var glBuffer = gl.createBuffer();
		if (source != undefined) {
			gl.bindBuffer(target, glBuffer);
			gl.bufferData(target, source, usage);
		}
		var buffer = { 'id': this.buffers.length, 'type':target, 'ref':glBuffer };
		this.buffers.push(buffer);
		return buffer;
	};
	webGL.deleteBuffer = function deleteBuffer(buf) {
		var ix = this.buffers.indexOf(buf);
		if (ix != -1) {
			gl.deleteBuffer(this.buffers[ix].ref);
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

	webGL.createTexture = function createTexture(data, type) {
		var texture = Buffer.create(data, type);
		this.textures.push(texture);
		return texture;
	};
	webGL.deleteTexture = function deleteTexture(tex) {
		var ix = this.textures.indexOf(tex);
		if (ix != -1) {
			gl.deleteTexture(tex.texture);
			this.textures.splice(ix, 1);
		}
	};

	webGL.useExtension = function useExtension(extensionName) {
		var ext = gl.getExtension(extensionName);
		if (ext) webGL.extensions[extensionName] = ext;
		return ext;
	};

	publish(webGL, 'webGL');

})();