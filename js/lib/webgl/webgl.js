import glBuffer from './glbuffer.js';
import glTexture from './gltexture.js';
import glProgram from './glprogram.js';

class WebGL {
	static VERTEX_ATTRIB_POSITION	= 0x01;
	static VERTEX_ATTRIB_NORMAL		= 0x02;
	static VERTEX_ATTRIB_COLOR		= 0x04;
	static VERTEX_ATTRIB_TEXTURE1	= 0x08;
	static VERTEX_ATTRIB_TEXTURE2	= 0x10;
	static #extensions = {};

	static FLOAT_ARR	= 0x2000;

	#buffers = [];
	#textures = [];

	screenVBO = null;
	gl = null;
	scale = null;

	static screenVShader =
        `#version 300 es
        out vec2 v_texcoord;

        void main() {
        // 6 vertices for two triangles forming a quad
        int id = gl_VertexID;
        vec2 pos = vec2((id == 0 || id == 2 || id == 4) ? -1.0 : 1.0,
                        (id == 0 || id == 1 || id == 3) ? -1.0 : 1.0);
        v_texcoord = pos * 0.5 + 0.5;
        gl_Position = vec4(pos, 0.0, 1.0);
        }`;

	static typeMap = {
		[WebGL2RenderingContext.FLOAT]: {
			size: 1,
			base: WebGL2RenderingContext.FLOAT,
			setter: (gl, location, value) => gl.uniform1f(location, value)
		},
		[WebGL.FLOAT_ARR]: {
			size: 0,
			base: WebGL2RenderingContext.FLOAT,
			setter: (gl, location, value) => gl.uniform1fv(location, value)
		},
		[WebGL2RenderingContext.FLOAT_VEC2]: {
			size: 2,
			base: WebGL2RenderingContext.FLOAT,
			setter: (gl, location, value) => gl.uniform2fv(location, value)
		},
		[WebGL2RenderingContext.FLOAT_VEC3]: {
			size: 3,
			base: WebGL2RenderingContext.FLOAT,
			setter: (gl, location, value) => gl.uniform3fv(location, value)
		},
		[WebGL2RenderingContext.FLOAT_VEC4]: {
			size: 4,
			base: WebGL2RenderingContext.FLOAT,
			setter: (gl, location, value) => gl.uniform4fv(location, value)
		},
		[WebGL2RenderingContext.FLOAT_MAT3]: {
			size: 9, // 3x3 matrix
			base: WebGL2RenderingContext.FLOAT,
			setter: (gl, location, value) => gl.uniformMatrix3fv(location, false, value)
		},
		[WebGL2RenderingContext.FLOAT_MAT4]: {
			size: 16, // 4x4 matrix
			base: WebGL2RenderingContext.FLOAT,
			setter: (gl, location, value) => gl.uniformMatrix4fv(location, false, value)
		},
		[WebGL2RenderingContext.INT]: {
			size: 1,
			base: WebGL2RenderingContext.INT,
			setter: (gl, location, value) => gl.uniform1i(location, value)
		},
		[WebGL2RenderingContext.INT_VEC2]: {
			size: 2,
			base: WebGL2RenderingContext.INT,
			setter: (gl, location, value) => gl.uniform2i(location, value)
		},
		[WebGL2RenderingContext.INT_VEC3]: {
			size: 3,
			base: WebGL2RenderingContext.INT,
			setter: (gl, location, value) => gl.uniform3i(location, value)
		},
		[WebGL2RenderingContext.INT_VEC4]: {
			size: 4,
			base: WebGL2RenderingContext.INT,
			setter: (gl, location, value) => gl.uniform4i(location, value)
		},
		[WebGL2RenderingContext.SAMPLER_2D]: {
			size: 1,
			setter: (gl, location, tex) => {
				tex.bind();
				gl.uniform1i(location, tex.unit);
			}
		},
		[WebGL2RenderingContext.INT_SAMPLER_2D]: {
			size: 1,
			setter: (gl, location, tex) => {
				tex.bind();
				gl.uniform1i(location, tex.unit);
			}
		},
		[WebGL2RenderingContext.UNSIGNED_INT_SAMPLER_2D]: {
			size: 1,
			setter: (gl, location, tex) => {
				gl.activeTexture(gl.TEXTURE0 + tex.unit);
				gl.bindTexture(gl.TEXTURE_2D, tex.texture);
				gl.uniform1i(location, tex.unit);
			}
		}
	};

    static #textureFormatMap = {
		"int8": {
			format: WebGL2RenderingContext.RG_INTEGER,
			internalFormat: WebGL2RenderingContext.R8I,
			type: WebGL2RenderingContext.BYTE,
			size: 1,
			bytes: 1
		},
		"int8[2]": {
			format: WebGL2RenderingContext.RG_INTEGER,
			internalFormat: WebGL2RenderingContext.RG8I,
			type: WebGL2RenderingContext.BYTE,
			size: 2,
			bytes: 2
		},
		"int8[3]": {
			format: WebGL2RenderingContext.RGB_INTEGER,
			internalFormat: WebGL2RenderingContext.RGB8I,
			type: WebGL2RenderingContext.BYTE,
			size: 3,
			bytes: 3
		},
		"int8[4]": {
			format: WebGL2RenderingContext.RGBA_INTEGER,
			internalFormat: WebGL2RenderingContext.RGBA8I,
			type: WebGL2RenderingContext.BYTE,
			size: 4,
			bytes: 4
		},
		"uint8": {
			format: WebGL2RenderingContext.RED_INTEGER,
			internalFormat: WebGL2RenderingContext.R8UI,
			type: WebGL2RenderingContext.UNSIGNED_BYTE,
			size: 1,
			bytes: 1
		},
		"uint8[2]": {
			format: WebGL2RenderingContext.RG_INTEGER,
			internalFormat: WebGL2RenderingContext.RG8UI,
			type: WebGL2RenderingContext.UNSIGNED_BYTE,
			size: 2,
			bytes: 2
		},
		"uint8[3]": {
			format: WebGL2RenderingContext.RGB_INTEGER,
			internalFormat: WebGL2RenderingContext.RGB8UI,
			type: WebGL2RenderingContext.UNSIGNED_BYTE,
			size: 3,
			bytes: 3
		},
		"uint8[4]": {
			format: WebGL2RenderingContext.RGBA_INTEGER,
			internalFormat: WebGL2RenderingContext.RGBA8UI,
			type: WebGL2RenderingContext.UNSIGNED_BYTE,
			size: 4,
			bytes: 4
		},
		"byte": {
			format: WebGL2RenderingContext.RED,
			internalFormat: WebGL2RenderingContext.R8,
			type: WebGL2RenderingContext.UNSIGNED_BYTE,
			size: 1,
			bytes: 1
		},
		"byte[2]": {
			format: WebGL2RenderingContext.RG,
			internalFormat: WebGL2RenderingContext.RG8,
			type: WebGL2RenderingContext.UNSIGNED_BYTE,
			size: 2,
			bytes: 2
		},
		"byte[3]": {
			format: WebGL2RenderingContext.RGB,
			internalFormat: WebGL2RenderingContext.RGB8,
			type: WebGL2RenderingContext.UNSIGNED_BYTE,
			size: 3,
			bytes: 3
		},
		"byte[4]": {
			format: WebGL2RenderingContext.RGBA,
			internalFormat: WebGL2RenderingContext.RGBA8,
			type: WebGL2RenderingContext.UNSIGNED_BYTE,
			size: 4,
			bytes: 4
		},
		"uint32": {
			format: WebGL2RenderingContext.RED_INTEGER,
			internalFormat: WebGL2RenderingContext.R32UI,
			type: WebGL2RenderingContext.UNSIGNED_INT,
			size: 1,
			bytes: 4
		},
		"uint32[2]": {
			format: WebGL2RenderingContext.RG_INTEGER,
			internalFormat: WebGL2RenderingContext.RG32UI,
			type: WebGL2RenderingContext.UNSIGNED_INT,
			size: 2,
			bytes: 8
		},
		"uint32[4]": {
			format: WebGL2RenderingContext.RGBA_INTEGER,
			internalFormat: WebGL2RenderingContext.RGBA32UI,
			type: WebGL2RenderingContext.UNSIGNED_INT,
			size: 4,
			bytes: 16
		},
		"float": {
			format: WebGL2RenderingContext.RED,
			internalFormat: WebGL2RenderingContext.R32F,
			type: WebGL2RenderingContext.FLOAT,
			size: 1,
			bytes: 4
		},
		"float[2]": {
			format: WebGL2RenderingContext.RG,
			internalFormat: WebGL2RenderingContext.RG32F,
			type: WebGL2RenderingContext.FLOAT,
			size: 2,
			bytes: 8
		},
		"float[3]": {
			format: WebGL2RenderingContext.RGB,
			internalFormat: WebGL2RenderingContext.RGB32F,
			type: WebGL2RenderingContext.FLOAT,
			size: 3,
			bytes: 12
		},
		"float[4]": {
			format: WebGL2RenderingContext.RGBA,
			internalFormat: WebGL2RenderingContext.RGBA32F,
			type: WebGL2RenderingContext.FLOAT,
			size: 4,
			bytes: 16
		}
    };
    get textureFormatMap() {
        return WebGL.#textureFormatMap;
	};

	// #getFormatAndTypeForTypedArray(data) {
	// 	const gl = this.gl;
    //     let format = gl.RGBA;
    //     let type = gl.UNSIGNED_BYTE;
    //     if (data instanceof Float32Array) {
    //         type = gl.FLOAT;
    //         format = gl.RGBA32F;
    //     } else if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
    //         type = gl.UNSIGNED_BYTE;
    //     } else if (data instanceof Uint16Array) {
    //         type = gl.UNSIGNED_SHORT;
    //     } else if (data instanceof Int32Array) {
    //         type = gl.INT;
    //     }
	// 	return [ format, type ];
	// };

	constructor(canvas, options) {
		this.scale = { x: 1, y: 1 };
		this.initialize(canvas, options || {});
	}

	initialize(canvas, options) {
		if (!(canvas instanceof HTMLCanvasElement)) {
			canvas = document.createElement('canvas');
			document.body.append(canvas);
		}
		this.canvas = canvas;
		this.gl = canvas.getContext('webgl2', { alpha: true });
		this.scale.x = options.scaleX || 1;
		this.scale.y = options.scaleY || 1;
		if (options.fullScreen) {
			canvas.style.position = 'absolute';
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			canvas.style.width = '100vw';
			canvas.style.height = '100vh';
		}
		canvas.width *= this.scale.x;
		canvas.height *= this.scale.y;
		this.gl.viewport(0, 0, canvas.width, canvas.height);
		this.screenVBO = this.createBuffer(this.gl.ARRAY_BUFFER, 'screenVBO');
		this.screenVBO.uploadData(
			new Float32Array(
				[
					-1.0,-1.0,  -1.0, 1.0,   1.0, 1.0,
					 1.0, 1.0,   1.0,-1.0,  -1.0,-1.0
				]), this.gl.STATIC_DRAW);
	}

	destroy() {
		this.#buffers.forEach(b => b.delete());
		this.#textures.forEach(t => t.delete());
		//this.gl.getExtension('WEBGL_lose_context').loseContext();
	}

	useExtension(extensionName) {
		if (WebGL.#extensions[extensionName] === undefined) {
			WebGL.#extensions[extensionName] = this.gl.getExtension(extensionName);	
		}
		return WebGL.#extensions[extensionName];
	}

	static getImageData(image) {
		// read pixel data from image
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = image.width;
		canvas.height = image.height;
		ctx.drawImage(image, 0, 0);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		// destroy canvas?
		return imageData;
	}

	//#region Texture handling
	getTexture(id) {
		return this.#textures[id];
	}

	getTextureByTag(tag) {
		return this.#textures.find(t => t.tag == tag);
	}

	#createTexture(width, height, options) {
        let texture = new glTexture(this, width, height, options);
		texture.id = this.#textures.push(texture) - 1;
		return texture;
	}

	calculateTextureSize(count) {
        let width = 1;
        while (width < count) width <<= 1;
        let height = 1;
        while (width > 2*height) {
            width >>= 1;
            height <<= 1;
        }
		return [width, height];
	}

    // Create a texture from an HTML image object
    createTextureFromImage(image, tag) {
		const {format, internalFormat, type, size} = this.textureFormatMap['byte[4]'];
		let options = {
			internalFormat: internalFormat,
			format: format,
			type: type,
			data: image,
			tag: tag
		};
		return this.#createTexture(image.width, image.height, options);
    }

    // Create a texture of type with optional data
    createTexture(typeName, width, height, options = {}) {
        if (options.data &&
			!(options.data instanceof ArrayBuffer || ArrayBuffer.isView(options.data))) {
            throw new Error("Data must be an ArrayBuffer or a TypedArray.");
        }
		const {format, internalFormat, type, size} = this.textureFormatMap[typeName];
		options.typeName = typeName;
		options.format = format;
		options.internalFormat = internalFormat;
		options.type = type;
		return this.#createTexture(width, height, options);
    }

	//#endregion

	//#region Buffer handling
	getBuffer(id) {
		return this.#buffers[id];
	}

	getBufferByTag(tag) {
		return this.#buffers.find(b => b.tag == tag);
	}

	createBuffer(type, tag) {
		let buffer = new glBuffer(this, type, tag);
		buffer.id = this.#buffers.push(buffer) - 1;
		return buffer;
	}

	createFramebuffer(tag) {
		return this.createBuffer(this.gl.FRAMEBUFFER, tag);
	}

    // Create a buffer from an image object
    createBufferfromImage(image, tag) {
		const gl = this.gl;
		let imageData = this.getImageData(image);
		// create buffer
		let buffer = this.createBuffer(gl.ARRAY_BUFFER, tag);
		buffer.uploadData(imageData.data, gl.STATIC_DRAW);
		return buffer;
    }

    // Create a buffer from an ArrayBuffer or typed array
    createBufferFromArrayBuffer(type, data, tag) {
        if (!(data instanceof ArrayBuffer || ArrayBuffer.isView(data))) {
            throw new Error("Data must be an ArrayBuffer or a TypedArray.");
        }
		const gl = this.gl;
		//const [format, dataType] = this.#getFormatAndTypeForTypedArray(data);
		// options = options || {};
		// options.format = format;
		// options.type = dataType;
		// create buffer
		let buffer = this.createBuffer(type, tag);
		buffer.uploadData(data, gl.STATIC_DRAW);
		return buffer;
    }
	//#endregion

	createProgram(options) {
		return new glProgram(this, options);
	}
};

export default WebGL;