import WebGL from './webgl.js';
import glTexture from './gltexture.js';

export default class ComputeShader {
	#webgl = null;
    program = null;

	constructor(webgl, tag) {
        webgl.useExtension('EXT_color_buffer_float');
		this.#webgl = webgl;
		//this.inputTypeName = '';

        this.textures = [null, null];
        this.frameBuffers = [null, null];
        this.index = 0;

		this.program = null;
		this.tag = tag;
	}

    get input() {
        return this.textures[this.index];
    }

    get output() {
        return this.textures[1 - this.index];
    }

	static #vertexShader =
    `#version 300 es
    out vec2 v_texcoord;
    void main() {
        if (gl_VertexID < 3) {
            if (gl_VertexID == 0) {
                gl_Position = vec4(-1.0, -1.0, 0.0, 1.);
                v_texcoord = vec2(0., 0.);
                return;
            }
            if (gl_VertexID == 1) {
                v_texcoord = vec2(0., 1.);
                gl_Position = vec4(-1.0, 1.0, 0.0, 1.);
                return;
            }
            if (gl_VertexID == 2) {
                v_texcoord = vec2(1., 1.);
                gl_Position = vec4(1.0, 1.0, 0.0, 1.);
                return;
            }   
        } else {
            if (gl_VertexID == 3) {
                v_texcoord = vec2(1., 1.);
                gl_Position = vec4(1.0, 1.0, 0.0, 1.);
                return;
            }
            if (gl_VertexID == 4) {
                v_texcoord = vec2(1., 0.);
                gl_Position = vec4(1.0, -1.0, 0.0, 1.);
                return;
            }
            if (gl_VertexID == 5) {
                v_texcoord = vec2(0., 0.);
                gl_Position = vec4(-1.0, -1.0, 0.0, 1.);
                return;
            }
        }
    }`;

    #createTexture(source, width, height, typeName) {
        const gl = this.#webgl.gl;

        let options = {
            minFilter: gl.NEAREST,
            magFilter: gl.NEAREST,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            useMipmaps: false,
            tag: this.tag + '_' + this.index,
            data: source
        };
        return this.#webgl.createTexture(typeName, width, height, options);
    }

    #setTexture(texture, ix) {
        const gl = this.#webgl.gl;
        this.textures[ix] = texture;
        //if (!this.frameBuffers[ix]) {
            this.frameBuffers[ix] = this.#webgl.createFramebuffer(`${this.tag}_fb${ix}`);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[ix].buffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[ix].texture, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //}
    }

    setInput(data, size = 1) {
        if (data instanceof glTexture) {
            this.#setTexture(data, this.index);
        } else {
            // specify type
            let typeName = '';
            if (data instanceof Uint8Array) typeName = 'byte';
            //else if (data instanceof Uint16Array) typeName = 'uint16';
            else if (data instanceof Uint32Array) typeName = 'uint32';
            else if (data instanceof Int8Array) typeName = 'int8';
            // else if (data instanceof Int16Array) typeName = 'int16';
            // else if (data instanceof Int32Array) typeName = 'int32';
            else if (data instanceof Float32Array) typeName = 'float';
            else throw new Error("Data must be a valid TypedArray.");
            if (size > 1) {
                typeName = `${typeName}[${size}]`;
            }
            //this.inputTypeName = typeName;

            // specify size
            const [width, height] = this.#webgl.calculateTextureSize(data.length / size);

            let source = Reflect.construct(data.constructor, [width * height * size]);
            source.set(data);

            let input = this.#createTexture(source, width, height, typeName);
            this.#setTexture(input, this.index);
        }
        return this.textures[this.index];
    }

    setOutput(arg = null) {
        if (arg instanceof glTexture) {
            this.#setTexture(arg, 1 - this.index);
        } else {
            let input = this.textures[this.index];
            let source = Reflect.construct(input.data.constructor, [input.data.length]);
            let output = this.#createTexture(source, input.width, input.height, input.typeName);
            this.#setTexture(output, 1 - this.index);
        }
        return this.textures[1 - this.index];
    }

    setProgram(shader) {
		const gl = this.#webgl.gl;
        this.program = this.#webgl.createProgram(
            {
                vertexSrc: WebGL.screenVShader,
                //vertexSrc: ComputeShader.#vertexShader,
                fragmentSrc: shader
            });
    }

	run(uniforms = {}) {
        const gl = this.#webgl.gl;
        this.program.use();
        let input = this.textures[this.index];
        let output = this.textures[1 - this.index];
        input.bind(0);
        this.program.setUniform('u_texture', input);
        for (let key in uniforms) {
            this.program.setUniform(key, uniforms[key]);
        }
        //this.program.setUniform('u_time', dt/1000.0);
        gl.viewport(0, 0, output.width, output.height);
        gl.disable(gl.BLEND);
        // gl.clearColor(0, 0, 0, 1);
        // gl.clear(gl.COLOR_BUFFER_BIT);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[1 - this.index].buffer);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

    feedback() {
        this.index = 1 - this.index;
    }

	readOutput(target = null) {
        const gl = this.#webgl.gl;
        const output = this.textures[1 - this.index];
        target = target || output.data;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[1 - this.index].buffer);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.readPixels(
            0, 0,
            output.width, output.height,
            output.format,
            output.type,
            target);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return target;
	}

    destroy() {
        delete this.textures[0].data;
        delete this.textures[1].data;
        this.frameBuffers[0].delete();
        this.frameBuffers[1].delete();
        this.textures[0].delete();
        this.textures[1].delete();
    }
}

// (function() {
//     function ComputeShader() {
//         this.input = null;
//         this.output = null;
//         //this.result = null;
//         this.prg = null;
//         this.fbo = gl.createFramebuffer();
//         this.vbo = webGL.screenVBO;
//         // this.bufferId = webGL.buffers.length;
//         // this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);
//     }
    
//     ComputeShader.prototype.setInput = function setInput(data, type) {
//         this.input = webGL.createTexture(data, type);
//     };

//     ComputeShader.prototype.setOutput = function setOutput(data, type) {
//         if (!data) data = this.input.originalLength;    //[this.input.width, this.input.height];
//         if (!type) type = this.input.type;
//         this.output = webGL.createTexture(data, type);
//         // this.output.createArrayBuffer();
//         // this.output.setTexture();
//         gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
//         gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
//         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//         //this.result = Reflect.construct(this.output.data.constructor, [this.output.originalLength]);
//     };

//     ComputeShader.prototype.setShader = async function setShader(shader) {
//         this.shaders = {};
//         this.shaders[gl.VERTEX_SHADER] = webGL.flatShaders[gl.VERTEX_SHADER];
//         this.shaders[gl.FRAGMENT_SHADER] = shader;
//         this.prg = webGL.createProgram(this.shaders, { 'a_position': { 'buffer': this.vbo.id }});
//     };

//     ComputeShader.prototype.compute = function compute(fill, constants) {
//         gl.viewport(0, 0, this.output.width, this.output.height);
//         gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
//         webGL.useProgram(this.prg, constants);
//         gl.activeTexture(gl.TEXTURE0);
//         gl.bindTexture(gl.TEXTURE_2D, this.input.texture);
//         if (typeof fill === 'function') {
//             var size = this.input.type.length;
//             for (var n=0; n<this.input.originalLength; n++) {
//                 var k = n % size;
//                 var m = Math.floor(n/size);
//                 var i = m % this.input.width;
//                 var j = Math.floor(m/this.input.width);
//                 this.input.data[n] = fill(n, i, j, k);
//             }
//             if (this.input.data.buffer instanceof ArrayBuffer) {
//                 gl.texImage2D(gl.TEXTURE_2D, 0, this.input.type.id, this.input.width, this.input.height, 0, this.input.format, gl[this.input.type.type], this.input.data, 0);
//             } else {
//                 gl.texImage2D(gl.TEXTURE_2D, 0, this.input.type.id, this.input.format, gl[this.input.type.type], this.input.data);
//             }
//         }
//         // gl.clearColor(0, 0, 0, 1);
//         // gl.clear(gl.COLOR_BUFFER_BIT);
//         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
//         gl.readPixels(0, 0, this.output.width, this.output.height, this.output.format, gl[this.output.type.type], this.output.data);
//         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//         return this.output.data;
//     };

//     ComputeShader.prototype.feedback = function feedback() {
//         for (var i=0; i<this.output.data.length; i++) {
//             this.input.data[i] = this.output.data[i];
//         }
//     };

//     ComputeShader.prototype.destroy = function destroy() {
//         gl.bindFramebuffer(gl.FRAMEBUFFER, null);
//         gl.useProgram(null);
//         this.prg.destroy();
//         webGL.deleteTexture(this.input);
//         webGL.deleteTexture(this.output);
//         webGL.deleteBuffer(this.vbo);
//         gl.deleteFramebuffer(this.fbo);
//     };

//     publish(ComputeShader, 'ComputeShader', webGL);
// })();