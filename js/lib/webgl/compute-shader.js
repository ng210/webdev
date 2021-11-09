include('webgl.js');

(function() {
    function ComputeShader() {
        this.input = null;
        this.output = null;
        //this.result = null;
        this.prg = null;
        this.fbo = gl.createFramebuffer();
        this.vbo = webGL.screenVBO;
        // this.bufferId = webGL.buffers.length;
        // this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);
    }
    
    ComputeShader.prototype.setInput = function setInput(data, type) {
        this.input = webGL.createTexture(data, type);
    };

    ComputeShader.prototype.setOutput = function setOutput(data, type) {
        if (!data) data = this.input.originalLength;    //[this.input.width, this.input.height];
        if (!type) type = this.input.type;
        this.output = webGL.createTexture(data, type);
        // this.output.createArrayBuffer();
        // this.output.setTexture();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output.texture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //this.result = Reflect.construct(this.output.data.constructor, [this.output.originalLength]);
    };

    ComputeShader.prototype.setShader = async function setShader(shader) {
        this.shaders = {};
        this.shaders[gl.VERTEX_SHADER] = webGL.flatShaders[gl.VERTEX_SHADER];
        this.shaders[gl.FRAGMENT_SHADER] = shader;
        this.prg = webGL.createProgram(this.shaders, { 'a_position': { 'buffer': this.vbo.id }});
    };

    ComputeShader.prototype.compute = function compute(fill, constants) {
        gl.viewport(0, 0, this.output.width, this.output.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        webGL.useProgram(this.prg, constants);
        gl.bindTexture(gl.TEXTURE_2D, this.input.texture);
        if (typeof fill === 'function') {
            var size = this.input.type.length;
            for (var n=0; n<this.input.originalLength; n++) {
                var k = n % size;
                var m = Math.floor(n/size);
                var i = m % this.input.width;
                var j = Math.floor(m/this.input.width);
                this.input.data[n] = fill(n, i, j, k);
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
        gl.readPixels(0, 0, this.output.width, this.output.height, this.output.format, gl[this.output.type.type], this.output.data);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return this.output.data;
    };

    ComputeShader.prototype.feedback = function feedback() {
        for (var i=0; i<this.output.data.length; i++) {
            this.input.data[i] = this.output.data[i];
        }
    };

    ComputeShader.prototype.destroy = function destroy() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(null);
        this.prg.destroy();
        webGL.deleteTexture(this.input);
        webGL.deleteTexture(this.output);
        webGL.deleteBuffer(this.vbo);
        gl.deleteFramebuffer(this.fbo);
    };

    publish(ComputeShader, 'ComputeShader', webGL);
})();