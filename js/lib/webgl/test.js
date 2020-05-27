(function() {
    include('math/v2.js');
    include('math/v3.js');
    include('math/m44.js');
    include('webgl/webgl.js');

    var _vbo = null;
    var _ibo = null;

    var _update = null;
    var _render = null;
    var _lastTick = 0;
    var _frames = 0;
    var _elapsedTime = 0;

    var _instances = [];

    function Instance() {
        this.time = 0;
        this.position = new V3(0.5, 0.5, 0.5).mul(_size);
        var arg1 = 2*Math.PI*Math.random();
        var arg2 = 2*Math.PI*Math.random();
        var length = 100*(0.3*Math.random() + 0.2);
        this.velocity = new V3(
            Math.cos(arg1),
            Math.sin(arg1),
            -0.9 //Math.cos(arg1)*Math.sin(arg2)
        ).scale(length);
        //this.velocity.z = 0;
        this.rotation = new V3();
        for (var i=0; i<3; i++) {
            var r = Math.random();
            this.rotation[i] = 20*(r < 0.5 ? r-1 : r);
        }
        this.rotation.x
        this.scale = new V3(0);
        this.color = new Float32Array([Math.random(), Math.random(), Math.random(), 1.0]);
        this.matrix = new Float32Array(16);

    }

    Instance.prototype.adjustPosition = function() {
        if (this.position.x < 0) {
            this.position.x = -this.position.x;
            this.velocity.x = -this.velocity.x;
        } else if (this.position.x > _size.x) {
            this.position.x = 2*_size.x - this.position.x;
            this.velocity.x = -this.velocity.x;
        }
        if (this.position.y < 0) {
            this.position.y = -this.position.y;
            this.velocity.y = -this.velocity.y;
        } else if (this.position.y > _size.y) {
            this.position.y = 2*_size.y - this.position.y;
            this.velocity.y = -this.velocity.y;
        }
        if (this.position.z < 0.3*_size.z) {
            this.position.z = 0.6*_size.z - this.position.z;
            this.velocity.z = -this.velocity.z;
         } else if (this.position.z > _size.z) {
             this.position.z = 2*_size.z - this.position.z;
             this.velocity.z = -this.velocity.z;
        }
    }

    function setGeometry2d() {
        var vertices = new Float32Array([0, 0, 0,  10, 0, 0,  0, 10, 0,  10, 10, 0]);
        _vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        var indices = new Uint16Array([0, 2, 3,  0, 3, 1]);
        _ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    function setGeometry3d() {
        var vertices = new Float32Array([0, 0, 0,  10, 0, 0,  0, 10, 0,  10, 10, 0,  0, 0, 10,  10, 0, 10,  0, 10, 10,  10, 10, 10]);
        _vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        var indices = new Uint16Array([0,2,3, 0,3,1, 1,3,7, 1,7,5, 5,7,6, 5,6,4, 4,6,2, 4,2,0, 2,6,7, 2,7,3, 4,0,1, 4,1,5]);
        _ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    function animate() {
        _frames++;
        _elapsedTime = new Date().getTime() - _startTime;
        if (_frames % 20 == 0) {
            _fps.innerHTML = (''+_frames*1000/_elapsedTime).slice(0, 4);
        }
        var t = new Date().getTime();
        var dt = 0.0005*(t - _lastTick);
        _update(dt);
        _render(dt);
        _lastTick = t;
        
        requestAnimationFrame(animate);
    }

    function start(update, render, shader) {
        _update = update;
        _render = dt => {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            //gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA);
            gl.clearColor(0.02, 0.1, 0.2, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            webGL.useProgram(shader);
            render(dt);
        };
        _lastTick = new Date().getTime();
        _startTime = _lastTick;
        requestAnimationFrame(animate);
    }

    function setup(count) {
        var canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.width = window.innerWidth/2;
        canvas.height = window.innerHeight/2;
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        document.body.appendChild(canvas);
        Dbg.prln([canvas.width, canvas.height]);
        _fps = document.createElement('div');
        _fps.style.position = 'absolute';
        _fps.style.left = (window.innerWidth - 50) + 'px';
        _fps.style.top = '0px'; _fps.style.width = '40px';
        _fps.style.color = '#80ffa0';
        _fps.style.fontFamily = 'Consolas'; _fps.style.fontSize = '14pt';
        document.body.appendChild(_fps);
        window.gl = canvas.getContext('webgl2');
        _size = new V3(canvas.width, canvas.height, 500);
        setGeometry3d();
        for (var i=0; i<count; i++) {
            _instances.push(new Instance());
        }
        window.onresize = () => {
            _size = new V3(canvas.width, canvas.height, 500);
            _fps.style.left = (window.innerWidth - 50) + 'px';
        };
    }

    function test_simple_rendering() {
        const count = 20;
        setup(count);

        // create program
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = 
           `attribute vec4 a_position;
            uniform vec4 u_color;
            uniform mat4 u_matrix;
            varying vec4 v_color;
            varying vec4 v_pos;
            void main() {
                gl_Position = u_matrix*a_position;
                v_color = u_color;
                v_pos = gl_Position;
            }`;
        shaders[gl.FRAGMENT_SHADER] =
           `precision mediump float;
            varying vec4 v_color;
            varying vec4 v_pos;
            void main() {
                float z = 1.0 - (v_pos.z - 150.0)/(500.0 - 150.0);
                gl_FragColor = vec4(mix(vec3(0.02, 0.1, 0.2), v_color.rgb, z), 1.0);
            }`
        var shader = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 }
        }, {
            u_matrix: { type: webGL.FLOAT4x4M },
            u_color: { type: webGL.FLOAT4V }
        });

        start(
            dt => {
                for (var i=0; i<count; i++) {
                    var instance = _instances[i];
                    instance.time += dt;
                    instance.position.add(instance.velocity.prodC(dt));
                    //instance.velocity.scale(0.998);
                    instance.adjustPosition();
                    // instance.scale.x = 1.0 + 0.01*Math.cos(instance.rotation.x + 10*instance.time);
                    // instance.scale.y = 1.0 + 0.01*Math.sin(instance.rotation.y + 11*instance.time);
                    // instance.scale.z = 1.0 + 0.01*Math.sin(instance.rotation.z + 13*instance.time);

                    var matrix = null;
                    var pos = null;
                    if (0) {
                        matrix = M44.projection(gl.canvas.width, gl.canvas.height, _size.z);
                        pos = instance.position;
                    } else {
                        var fov = Math.PI*60/180;
                        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
                        var zNear = 1;
                        var zFar = _size.z;
                        matrix = M44.perspective(fov, aspect, zNear, zFar);
                        pos = [instance.position.x-0.5*_size.x, instance.position.y-0.5*_size.y, -instance.position.z];
                    }
                    var center = [-5, -5, -5];
                    matrix = matrix.mul(M44.translate(pos));
                    //matrix = matrix.mul(M44.scale(instance.scale));
                    matrix = matrix.mul(M44.rotateX(instance.rotation.x*instance.time));
                    matrix = matrix.mul(M44.rotateY(instance.rotation.y*instance.time));
                    //matrix = matrix.mul(M44.rotateZ(instance.rotation.z*instance.time));
                    instance.rotation.scale(0.998);
                    matrix.mul(M44.translate(center), instance.matrix);
                }
            },
            dt => {
                for (var i=0; i<count; i++) {
                    var instance = _instances[i];
                    shader.uniforms.u_color.value = instance.color;
                    shader.updateUniform('u_color');
                    shader.uniforms.u_matrix.value = instance.matrix;
                    shader.updateUniform('u_matrix');
                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                }
            },
            shader
        );
    }

    function test_instanced_rendering() {
        const count = 10;
        setup(count);

        // create program
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = 'attribute vec4 a_position; attribute vec4 a_color; attribute mat4 a_matrix; varying vec4 v_color; void main() { gl_Position = a_matrix*a_position; v_color = a_color; }';
        shaders[gl.FRAGMENT_SHADER] = 'precision mediump float; varying vec4 v_color; void main() { gl_FragColor = v_color;}';
        var shader = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 },
            a_matrix: { type:gl.FLOAT, size:4 },
            a_color: { type:gl.FLOAT, size:3 }
        }, null);
        const matrices = new Float32Array(count * 16);
        start(
            dt => {
                for (var i=0; i<count; i++) {
                    var instance = _instances[i];
                    instance.position.add(instance.velocity.prodC(dt));
                    instance.adjustPosition();
                    instance.rotation += 10*instance.velocity.x*dt;
                    instance.scale.x = 1.5 + Math.cos(instance.velocity.x);
                    instance.scale.y = 1.5 + Math.sin(instance.velocity.y);
                    var matrix = M44.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
                    var pos = new V3(instance.position.prod(_size));
                    matrix.mul(M44.translate(pos)).mul(M44.rotateZ(instance.rotation)).mul(M44.scale(new V4(instance.scale)));
                }
            },
            dt => {
                for (var i=0; i<count; i++) {
                    var instance = _instances[i];
                    shader.uniforms.u_color.value = instance.color.data;
                    shader.updateUniform('u_color');
                    shader.uniforms.u_matrix.value = instance.matrix.data;
                    shader.updateUniform('u_matrix');
                    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                }
            },
            shader
        );
    }

    var tests = () => [test_simple_rendering];

    public(tests, 'WebGL tests');

})();