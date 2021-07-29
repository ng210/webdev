include('webgl.js');

(function() {
    function ComputeShader(size, type, fill) {
        // type: Uint8, Uint32, Float32
        var log2 = Math.ceil(Math.log2(size));
        this.size = Math.pow(2, log2);
        var m = Math.ceil(log2/2);
        this.cols = Math.pow(2, m);
        this.rows = this.size/this.cols;
        this.type = type || gl.R32UI;
        this.input = this.createDataBuffer(fill);
        this.output = this.createDataBuffer();
        this.results = this.createBuffer();

        this.fbo = null;
        this.vbo = null;
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
            case gl.RGBA32UI:   internalFormat = gl.RGBA32UI;   format = gl.RGBA_INTEGER;   type = gl.UNSIGNED_INT; break;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, this.cols, this.rows, 0, format, type, buffer.data, 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };

    ComputeShader.prototype.createDataBuffer = function createDataBuffer(fill) {
        var buffer = {
            data: this.createBuffer(),
            texture: gl.createTexture()
        };
        if (typeof fill === 'function') {
            var k = 0;
            for (var i=0; i<this.cols; i++) {
                for (var j=0; j<this.rows; j++) {
                    buffer.data[k] = fill(k, i, j);
                    k++;
                }
            }
        }
        this.setTexture(buffer);
        return buffer;    
    };

    ComputeShader.prototype.setup = async function setup(shaderPath) {
        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);

        this.shaders = {};
        var res = await load(['res/flat.vs', shaderPath]);
        this.shaders[gl.VERTEX_SHADER] = res[0].data;
        this.shaders[gl.FRAGMENT_SHADER] = res[1].data;
        // TODO: pass constants as uniforms
        // process shader to extract uniforms
        //this.uniforms = webGL.extractUniforms(res[1].data);
        this.prg = webGL.createProgram(this.shaders);//, { a_position: { type:webGL.FLOAT, size:2, buffer:0 } }, this.uniforms);
    };

    ComputeShader.prototype.compute = function compute(fill, constants) {
        gl.viewport(0, 0, this.cols, this.rows);
        gl.clearColor(0, 0, 0, 1);
        webGL.useProgram(this.prg, constants);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindTexture(gl.TEXTURE_2D, this.input.texture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        switch (this.type) {
            case gl.R8UI:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RED_INTEGER, gl.UNSIGNED_BYTE, this.results);
                break;
            case gl.R32UI:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RED_INTEGER, gl.UNSIGNED_INT, this.results);
                break;
            case gl.R32F:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RED, gl.FLOAT, this.results);
                break;
            case gl.RGBA32UI:
                gl.readPixels(0, 0, this.cols, this.rows, gl.RGBA_INTEGER, gl.UNSIGNED_INT, this.results);
                break;
        }
        return this.results;
    };

    ComputeShader.prototype.feedback = function feedback() {
        var k = 0;
        for (var i=0; i<this.cols; i++) {
            for (var j=0; j<this.rows; j++) {
                this.input.data[k] = this.results[k];
                k++;
            }
        }
        this.setTexture(this.input);
    };

    ComputeShader.prototype.destroy = function destroy() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(null);
        this.prg.destroy();
        gl.deleteTexture(this.input.texture);
        gl.deleteTexture(this.output.texture);
        gl.deleteBuffer(this.vbo);
        gl.deleteFramebuffer(this.fbo);
    };

    publish(ComputeShader, 'ComputeShader', webGL);
})();