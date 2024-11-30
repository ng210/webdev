include('/lib/webgl/compute-shader.js');
(function() {
    function Scope() {
        this.refreshRate = 10;
        this.buffer = null;
        this.prg = null;
        this.vbo = null;
        this.uniforms = {
            'u_length': 0,
            'u_shade': 0.0
        };
        this.shaders = {
            'vs':
                `#version 300 es
                in float a_position;
                uniform float u_length;

                void main(void) {
                    vec2 pos = vec2(2.*float(gl_VertexID)/u_length - 1.0, 2.0*a_position);
                    gl_Position = vec4(pos, 0., 1.);
                }`,

            'fs':
                `#version 300 es
                precision highp float;
                out vec4 color;

                void main(void) {
                    color = vec4(1.0);
                }`
        };

        this.size = 0;
        this.scale = 1/8;
        this.length = 0;
        this.dataBuffers = [
            new Float32Array(SCOPE_MAX_SIZE),
            new Float32Array(SCOPE_MAX_SIZE)
        ];
        this.dataBuffer = null;
        this.dataBufferIndex = 0;
        this.dataReadPosition = 0;
        this.dataWritePosition = 0;
        this.samplingStep = 0;
    }
    Scope.prototype.setSize = function setSize(timeWindowSize) {
        this.size = timeWindowSize * SAMPLE_RATE;
        this.resize();
    };
    Scope.prototype.setData = function setData(left, right, bufferSize) {
        this.dataBuffer = this.dataBuffers[this.dataBufferIndex];
        while (this.dataReadPosition < bufferSize) {
            var pos = Math.floor(this.dataReadPosition);
            this.dataBuffer[this.dataWritePosition++] = 0.5*(left[pos] + right[pos]);
            if (this.dataWritePosition == this.length) {
                this.dataWritePosition = 0;
                this.dataBufferIndex = 1 - this.dataBufferIndex;
            }
            this.dataReadPosition += this.samplingStep;
        }
        this.dataReadPosition -= bufferSize;
    };
    Scope.prototype.initialize = function initialize() {
        this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Array(SCOPE_MAX_SIZE), gl.DYNAMIC_DRAW);
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = this.shaders.vs;
        shaders[gl.FRAGMENT_SHADER] = this.shaders.fs;
        this.prg = webGL.createProgram(shaders, { 'a_position': { 'buffer': 1 }});

        this.buffer = webGL.Buffer.create(null, 'byte[4]');
        this.buffer.createArrayBuffer();
    };
    Scope.prototype.resize = function resize() {
        this.dataWritePosition = 0;
        if (this.size < gl.canvas.width) {
            this.samplingStep = 1;
            this.length = Math.floor(this.size);
        } else {
            this.samplingStep = this.size/gl.canvas.width;
            this.length = gl.canvas.width;
        }
        this.uniforms.u_length = this.length;
    };
    Scope.prototype.update = function update(frames) {
    };
    Scope.prototype.render = function render(frames) {
        // draw scope
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.ref);
        gl.bufferData(gl.ARRAY_BUFFER, this.dataBuffers[1 - this.dataBufferIndex], gl.DYNAMIC_DRAW);
        webGL.useProgram(this.prg, this.uniforms);
        gl.drawArrays(gl.LINE_STRIP, 0, this.length);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        // feedback
        gl.readPixels(0, 0, this.buffer.width, this.buffer.height, gl.RGBA, gl.UNSIGNED_BYTE, this.buffer.data);
    };

    publish(Scope, 'Scope');

})();