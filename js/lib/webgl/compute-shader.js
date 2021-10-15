include('webgl.js');

(function() {
    function ComputeShader2() {
        this.input = null;
        this.output = null;
        this.result = null;
        this.prg = null;
        this.fbo = gl.createFramebuffer();
        this.bufferId = webGL.buffers.length;
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);
    }
    
    ComputeShader2.prototype.setInput = function setInput(data, type) {
        this.input = webGL.createTexture(data, type);
        if (data) {
            this.input.setData(data);
        }
    };

    ComputeShader2.prototype.setOutput = function setOutput(data, type) {
        if (data == null) {
            // TODO: get FBO size
            data = gl.drawingBufferWidth * gl.drawingBufferHeight;
        }
        this.output = webGL.createTexture(data, type);
        this.output.createArrayBuffer();
        this.output.setTexture();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.result = Reflect.construct(this.output.data.constructor, [this.output.length]);
    };

    ComputeShader2.prototype.setShader = async function setShader(shader) {
        var res = await load('/lib/webgl/res/flat.vs');
        if (!res.error) {
            this.shaders = {};
            this.shaders[gl.VERTEX_SHADER] = res.data;
            this.shaders[gl.FRAGMENT_SHADER] = shader;
            this.prg = webGL.createProgram(this.shaders, { 'a_position': { 'buffer': this.bufferId }});
        }
    };

    ComputeShader2.prototype.compute = function compute(fill, constants) {
        gl.viewport(0, 0, this.output.width, this.output.height);
        webGL.useProgram(this.prg, constants);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.bindTexture(gl.TEXTURE_2D, this.input.texture);
        if (typeof fill === 'function') {
            var i = 0;
            var size = this.input.type.length;
            for (var n=0; n<this.input.originalLength; n++) {
                for (var k=0; k<size; k++) {
                    this.input.data[i++] = fill(n, Math.floor(n/this.input.width), n%this.input.width, k);
                }
            }
            if (this.input.data.buffer instanceof ArrayBuffer) {
                gl.texImage2D(gl.TEXTURE_2D, 0, this.input.type.id, this.input.width, this.input.height, 0, this.input.format, gl[this.input.type.type], this.input.data, 0);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, this.input.type.id, this.input.format, gl[this.input.type.type], this.input.data);
            }
        }
        // gl.clearColor(0, 0, 0, 1);
        // gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.readPixels(0, 0, this.output.width, this.output.height, this.output.format, gl[this.output.type.type], this.result);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return this.result;
    };

    ComputeShader2.prototype.destroy = function destroy() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(null);
        this.prg.destroy();
        webGL.deleteTexture(this.input);
        webGL.deleteTexture(this.output);
        webGL.deleteBuffer(this.vbo);
        gl.deleteFramebuffer(this.fbo);
    };

//#region Compute shader old
    function ComputeShader(size, type) {
        if (typeof size === 'number') {
            var log2 = Math.ceil(Math.log2(size));
            this.size = Math.pow(2, log2);
            var m = Math.ceil(log2/2);
            this.cols = Math.pow(2, m);
            this.rows = this.size/this.cols;
        } else if (Array.isArray(size) || size instanceof Float32Array) {
            this.size = size[0]*size[1];
            this.rows = size[0];
            this.cols = size[1];
        }
        // type: gl.R8UI, gl.R32UI, gl.R32F, gl.RG32F, gl.RGBA32UI
        this.type = type || gl.R32UI;
        this.input = this.createDataBuffer();
        this.output = this.createDataBuffer();
        this.results = this.createBuffer();

        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);

        this.prg = null;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    ComputeShader.prototype.createBuffer = function createBuffer() {
        var buffer = null;
        switch (this.type) {
            case gl.RGBA:
                buffer = new Int8Array(4*this.size);
                break;
            case gl.R8:
                buffer = new Uint8Array(this.size);
                break;
            case gl.R8UI:
                buffer = new Uint8Array(this.size);
                break;
            case gl.R32UI:
                buffer = new Uint32Array(this.size);
                break;
            case gl.R32F:
                buffer = new Float32Array(this.size);
                break;
            case gl.RG32F:
                buffer = new Float32Array(2*this.size);
                break;
            case gl.RGBA32UI:
                buffer = new Uint32Array(4*this.size);
                break;
            case gl.RGBA32F:
                buffer = new Float32Array(4*this.size);
                break;
        }
        return buffer;
    };

    ComputeShader.prototype.setTexture = function setTexture(buffer) {
        gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
        var internalFormat = 0, format = 0, type = 0;
        switch (this.type) {
            case gl.RGBA:       internalFormat = gl.RGBA;       format = gl.RGBA;           type = gl.UNSIGNED_BYTE; break;
            case gl.R8:         internalFormat = gl.R8;         format = gl.RED;            type = gl.UNSIGNED_BYTE; break;
            case gl.R8UI:       internalFormat = gl.R8UI;       format = gl.RED_INTEGER;    type = gl.UNSIGNED_BYTE; break;
            case gl.R32UI:      internalFormat = gl.R32UI;      format = gl.RED_INTEGER;    type = gl.UNSIGNED_INT; break;
            case gl.R32F:       internalFormat = gl.R32F;       format = gl.RED;            type = gl.FLOAT; break;
            case gl.RG32F:      internalFormat = gl.RG32F;      format = gl.RG;             type = gl.FLOAT; break;
            case gl.RGBA32UI:   internalFormat = gl.RGBA32UI;   format = gl.RGBA_INTEGER;   type = gl.UNSIGNED_INT; break;
            case gl.RGBA32F:    internalFormat = gl.RGBA32F;    format = gl.RGBA;           type = gl.FLOAT; break;
            default: throw new Error('INvalid type!');
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, this.cols, this.rows, 0, format, type, buffer.data, 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    ComputeShader.prototype.createDataBuffer = function createDataBuffer(fill) {
        var buffer = {
            data: this.createBuffer(),
            texture: gl.createTexture()
        };
        fill = fill || function() { return 0; };
        this.fillBuffer(fill, buffer);
        return buffer;
    };

    ComputeShader.prototype.fillBuffer = function fillBuffer(fill, buffer) {
        if (typeof fill === 'function') {
            buffer  = buffer || this.input;
            var k = 0;
            for (var i=0; i<this.cols; i++) {
                for (var j=0; j<this.rows; j++) {
                    buffer.data[k] = fill(k, i, j);
                    k++;
                }
            }
            this.setTexture(buffer);            
        }
    };

    ComputeShader.prototype.setShader = async function setShader(shader) {
        var res = await load('/lib/webgl/res/flat.vs');
        if (!res.error) {
            this.shaders = {};
            this.shaders[gl.VERTEX_SHADER] = res.data;
            this.shaders[gl.FRAGMENT_SHADER] = shader;
            this.prg = webGL.createProgram(this.shaders);
        }
    };

    ComputeShader.prototype.loadShader = async function loadShader(shaderPath) {
        var res = await load(shaderPath);
        if (!res.error) {
            await this.setShader(res.data);
        }
    };

    ComputeShader.prototype.compute = function compute(size, target, constants) {
        size = size || this.size;
        target = target || this.results;
        gl.viewport(0, 0, this.cols, this.rows);
        gl.clearColor(0, 0, 0, 1);
        webGL.useProgram(this.prg, constants);
        gl.bindTexture(gl.TEXTURE_2D, this.input.texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        switch (this.type) {
            case gl.RGBA:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RGBA, gl.UNSIGNED_BYTE, target);
            case gl.R8:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RED, gl.BYTE, target);
                break;
            case gl.R8UI:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RED_INTEGER, gl.UNSIGNED_BYTE, target);
                break;
            case gl.R32UI:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RED_INTEGER, gl.UNSIGNED_INT, target);
                break;
            case gl.R32F:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RED, gl.FLOAT, target);
                break;
            case gl.RG32F:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RG, gl.FLOAT, target);
                break;
            case gl.RGBA32UI:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RGBA_INTEGER, gl.UNSIGNED_INT, target);
                break;
            case gl.RGBA32F:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RGBA, gl.FLOAT, target);
                break;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return target;
    };

    ComputeShader.prototype.feedback = function feedback() {
        this.fillBuffer( k => this.results[k], this.input);
    };

    ComputeShader.prototype.destroy = function destroy() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(null);
        this.prg.destroy();
        gl.deleteTexture(this.input.texture);
        gl.deleteTexture(this.output.texture);
        webGL.deleteBuffer(this.vbo);
        gl.deleteFramebuffer(this.fbo);
    };
//#endregion

    publish(ComputeShader, 'ComputeShader', webGL);
    publish(ComputeShader2, 'ComputeShader2', webGL);
})();