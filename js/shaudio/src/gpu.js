include('/lib/webgl/compute-shader.js');

// ## GPU functions
// - create and runcompute shader

(function() {
    var gpu = {
        computeShader: null,
        vbo: null,
        uniforms: {
            u_offset: 0,
            u_size: new Float32Array(2)
        }
    };

    gpu.init = async function gpu_init(bufferSize) {
        if (!window.gl) {
            webGL.init(null, true);
        }
        webGL.useExtension('EXT_color_buffer_float');
        this.computeShader = new webGL.ComputeShader(bufferSize, gl.RG32F);
        this.uniforms.u_size[0] = gl.canvas.width;
        this.uniforms.u_size[1] = gl.canvas.height;
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);
    };

    gpu.setCode = async function setShaders(sound, visuals) {
        await this.computeShader.setShader(sound);
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = this.computeShader.shaders[gl.VERTEX_SHADER];
        shaders[gl.FRAGMENT_SHADER] = visuals;
        this.prg = webGL.createProgram(shaders);
    }

    gpu.compute = function gpu_compute(size) {
        this.computeShader.compute(size, null, this.uniforms);
        this.computeShader.feedback();
        this.uniforms.u_offset += size;
        this.render(size);
        return this.computeShader.results;
    };

    gpu.render = function render(size) {
        gl.viewport(0, 0, this.uniforms.u_size[0], this.uniforms.u_size[1]);
        gl.clearColor(0, 0, 0, 1);
        webGL.useProgram(this.prg, this.uniforms);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.ref);
        gl.bindTexture(gl.TEXTURE_2D, App.gpu.computeShader.output.texture);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };


    gpu.destroy = function gpu_destroy() {
        this.computeShader.destroy();
        webGL.deleteBuffer(this.vbo);
    };

    publish(gpu, 'Gpu');
})();
