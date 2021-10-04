include('webgl.js');

(function() {
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
    };

    Buffer.prototype.setSize = function setSize(length) {
        this.originalLength = length;
        var r = Math.ceil(Math.sqrt(length));
        var p = Math.ceil(Math.log2(r));
        this.width = Math.pow(2, p);
        this.height = Math.ceil(length/this.width);
        this.length = this.width*this.height * this.type.length;
    };

    Buffer.prototype.createArrayBuffer = function createArrayBuffer(data) {
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
    };

    Buffer.prototype.setData = function setData(data) {
        if (data instanceof Image) {
            this.data = data;
        } else {
            // create data buffer
            if (!data || !(data.buffer instanceof ArrayBuffer)) this.createArrayBuffer(data);
            else this.data = data;
            if (data && data.length != this.length) {
                // resize buffer
                var buffer = Reflect.construct(this.data.constructor, [this.length]);
                buffer.set(this.data, 0);
                this.data = buffer;
            }
        }
        this.setTexture();
    };

    Buffer.prototype.setTexture = function setTexture(data) {
        data = data || this.data;
        if (data) {
            this.internalFormat = 0, this.format = 0;
            switch (this.type.id) {
                case gl.R8UI:       this.internalFormat = gl.R8UI;       this.format = gl.RED_INTEGER;   break;
                case gl.R32UI:      this.internalFormat = gl.R32UI;      this.format = gl.RED_INTEGER;   break;
                case gl.R32F:       this.internalFormat = gl.R32F;       this.format = gl.RED;           break;

                case gl.RG8UI:      this.internalFormat = gl.RG8UI;      this.format = gl.RG_INTEGER;    break;
                case gl.RG32UI:     this.internalFormat = gl.RG32UI;     this.format = gl.RG_INTEGER;    break;
                case gl.RG32F:      this.internalFormat = gl.RG32F;      this.format = gl.RG_INTEGER;    break;

                case gl.RGBA8UI:    this.internalFormat = gl.RGBA8UI;    this.format = gl.RGBA_INTEGER;  break;
                case gl.RGBA32UI:   this.internalFormat = gl.RGBA32UI;   this.format = gl.RGBA_INTEGER;  break;
                case gl.RGBA32F:    this.internalFormat = gl.RGBA32F;    this.format = gl.RGBA;          break;

                default: throw new Error('Invalid type!');
            }

            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            if (data.buffer instanceof ArrayBuffer) {
                gl.texImage2D(gl.TEXTURE_2D, 0, this.type.id, this.width, this.height, 0, this.format, gl[this.type.type], data, 0);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, this.type.id, this.format, gl[this.type.type], data);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }
    };

    Buffer.fromLength = function fromLength(length, type) {
        var buffer = new Buffer();
        buffer.setType(type);
        buffer.setSize(length);
        //buffer.setData(null);
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
        //buffer.setData(arrayBuffer);
        return buffer;
    };

    Buffer.fromImage = function fromImage(img) {
        var buffer = new Buffer();
        buffer.setType('byte[4]');
        // set size
        buffer.width = img.naturalWidth;
        buffer.height = img.naturalHeight;
        buffer.length = buffer.width*buffer.height * buffer.type.length;
        //buffer.setData(img);
        return buffer;
    };

    Buffer.fromFramebuffer = function fromFramebuffer() {
        var buffer = new Buffer();
        buffer.setType('byte[4]');
        buffer.width = gl.drawingBufferWidth;
        buffer.height = gl.drawingBufferHeight;
        buffer.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, buffer.width, buffer.height, 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        buffer.length = buffer.width*buffer.height * buffer.type.length;
        return buffer;
    };

    Buffer.create = function create(data, type) {
        var buffer = null;
        if (!data) buffer = Buffer.fromFramebuffer();
        else if (typeof data === 'number') buffer = Buffer.fromLength(data, type);
        else if (Array.isArray(data)) buffer = Buffer.fromSize(data[0], data[1], type);
        else if (data.buffer && data.buffer instanceof ArrayBuffer) buffer = Buffer.fromArrayBuffer(data, type);
        else if (data instanceof Image) buffer = Buffer.fromImage(data);
        return buffer;
    };

    function ComputeShader2() {
        this.input = null;
        this.output = null;
        this.result = null;
        this.prg = null;
        this.fbo = gl.createFramebuffer();
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);
    }
    
    ComputeShader2.prototype.setInput = function setInput(data, type) {
        this.input = Buffer.create(data, type);
        if (data) {
            this.input.setData(data);
        }
    };

    ComputeShader2.prototype.setOutput = function setOutput(data, type) {
        if (data == null) {
            // TODO: get FBO size
            data = gl.drawingBufferWidth * gl.drawingBufferHeight;
        }
        this.output = Buffer.create(data, type);
        this.output.createArrayBuffer();
        this.output.setTexture();
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        this.result = Reflect.construct(this.output.data.constructor, [this.output.length]);
    };

    ComputeShader2.prototype.setShader = async function setShader(shader) {
        var res = await load('/lib/webgl/res/flat.vs');
        if (!res.error) {
            this.shaders = {};
            this.shaders[gl.VERTEX_SHADER] = res.data;
            this.shaders[gl.FRAGMENT_SHADER] = shader;
            this.prg = webGL.createProgram(this.shaders);
        }
    };

    ComputeShader2.prototype.compute = function compute(fill, constants) {
        gl.viewport(0, 0, this.output.width, this.output.height);
        webGL.useProgram(this.prg, constants);
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
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        // gl.clearColor(0, 0, 0, 1);
        // gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.readPixels(0, 0, this.output.width, this.output.height, this.output.format, gl[this.output.type.type], this.result);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        return this.result;
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
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);

        this.prg = null;
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }

    ComputeShader.prototype.resize = function resize(size) {
        
    };

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
console.log('SETTEXTURE', internalFormat, this.cols, this.rows, 0, format, type, buffer.data);
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