include('webgl.js');

(function() {
    function ComputeShader(size, type) {
        // type: Uint8, Uint32, Float32
        var log2 = Math.ceil(Math.log2(size));
        this.size = Math.pow(2, log2);
        var m = Math.ceil(log2/2);
        this.cols = Math.pow(2, m);
        this.rows = this.size/this.cols;
        this.type = type || gl.R32UI;
        this.input = this.createDataBuffer();
        this.output = this.createDataBuffer();
        this.results = this.createBuffer();

        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);

        this.prg = null;
    }

    ComputeShader.prototype.createBuffer = function createBuffer() {
        var buffer = null;
        switch (this.type) {
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
        }
        return buffer;
    };

    ComputeShader.prototype.setTexture = function setTexture(buffer) {
        gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
        var internalFormat = 0, format = 0, type = 0;
        switch (this.type) {
            case gl.R8UI:       internalFormat = gl.R8UI;       format = gl.RED_INTEGER;    type = gl.UNSIGNED_BYTE; break;
            case gl.R32UI:      internalFormat = gl.R32UI;      format = gl.RED_INTEGER;    type = gl.UNSIGNED_INT; break;
            case gl.R32F:       internalFormat = gl.R32F;       format = gl.RED;            type = gl.FLOAT; break;
            case gl.RG32F:      internalFormat = gl.RG32F;      format = gl.RG;             type = gl.FLOAT; break;
            case gl.RGBA32UI:   internalFormat = gl.RGBA32UI;   format = gl.RGBA_INTEGER;   type = gl.UNSIGNED_INT; break;
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

    publish(ComputeShader, 'ComputeShader', webGL);
})();