(function() {

    include('math/m44.js');
    include('webgl/webgl.js');

    function test_simple_rendering() {
        // set up webGL
        var canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.width = 320; canvas.height = 240;
        document.body.appendChild(canvas);
        window.gl = canvas.getContext('webgl');
        
        // set buffers
        var vertices = new Float32Array([0, 0, 0,  20, 0, 0,  0, 20, 0,  20, 20, 0]);
        var vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        var indices = new Uint16Array([0, 1, 2,  2, 1, 3]);
        var ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // create program
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = 'attribute vec4 a_position; uniform mat4 u_matrix; void main() { gl_Position = u_matrix*a_position; }';
        shaders[gl.FRAGMENT_SHADER] = 'precision mediump float; void main() { gl_FragColor = vec4(1.0);}';
        var shader = webGL.createProgram(shaders, { a_position: { type:gl.FLOAT, size:3 } }, { u_matrix: { type: webGL.FLOAT4x4M }});

        // render
        var pos = new V4(0, 0, 0);
        var v = new V4(1, 0, 0);
        var frames = 0;
        var updateAndDraw = () => {
            clearTimeout(timer);

            if (frames++ < 100) {
                pos.add(v);
                gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
                gl.clearColor(0.02, 0.1, 0.2, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                var matrix = M44.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
                matrix = matrix.mul(M44.translate(pos));
                webGL.useProgram(shader, { u_matrix: matrix.data });
                gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                timer = setTimeout(updateAndDraw, 100);
            }
        };
        var timer = setTimeout(updateAndDraw, 100);
    }

    var tests = () => [test_simple_rendering];

    public(tests, 'WebGL tests');

})();