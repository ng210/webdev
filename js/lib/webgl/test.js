(function() {
    include('math/v2.js');
    include('math/v3.js');
    include('math/m44.js');
    include('webgl/webgl.js');

    var _vbo = null;
    var _ibo = null;
    var _program = null;
    var _programs = {};

    var _lastTick = 0;
    var _frames = 0;
    var _elapsedTime = 0;

    var _instances = [];

    var _size = new V3();
    var _world = new V3(100, 100, 500);
    var BOX = { min: new V3(), max: new V3() };

    var _controls = {
        fps: { value: 0, control: null },
        count: { value: 100, control: null },
        mode: { value: false, control: null },
        start: { value: true, control: null }
    };

    var _controlsElem = null;

    var _projection = null;

    function Instance() {
        this.time = 0;
        this.velocity = V3.fromPolar(2*Math.PI*Math.random(), 2*Math.PI*Math.random(), 20*(0.4*Math.random() + 0.6));
        this.position = new V3(0, 0, -1000).add(this.velocity).scale(0.1);
        this.rotation = new V3(0, 0, 0);
        this.scale = new V3();
        for (var i=0; i<3; i++) {
            var r = Math.random();
            this.rotation[i] = 20*(r < 0.5 ? r-1 : r);
            this.scale[i] = 1.0;    //*(0.6 + 0.4*Math.random());
        }
        this.color = new Float32Array([Math.random(), Math.random(), Math.random(), 1.0]);
        this.matrix = new Float32Array(16);
    }

    Instance.prototype.setMode = function setMode(is3D) {
        if (is3D) {
            this.update = this.update3D;
            this.render = this.render3D;
        } else {
            this.update = this.update2D;
            this.render = this.render2D;
        }
    };

    Instance.prototype.update2D = function update2D(dt) {
        this.time += dt;
        this.position.add(this.velocity.prodC(dt));
        // adjustPosition
        var min = this.position.diff(BOX.min);
        var max = this.position.diff(BOX.max);
        if (min.x < 0) {
            this.velocity.x = -this.velocity.x;
            this.position.x = BOX.min.x;
        } else if (max.x > 0) {
            this.velocity.x = -this.velocity.x;
            this.position.x = BOX.max.x;
        }
        if (min.y < 0) {
            this.velocity.y = -this.velocity.y;
            this.position.y = BOX.min.y;
        } else if (max.y > 0) {
            this.velocity.y = -this.velocity.y;
            this.position.y = BOX.max.y;
        }
        // if (min.z < 0) {
        //     this.velocity.z = -this.velocity.z;
        //     this.position.z = BOX.min.z;
        // } else if (max.z > 0) {
        //     this.velocity.z = -this.velocity.z;
        //     this.position.z = BOX.max.z;
        // }

        var matrix = _projection.mul(M44.translate(this.position));
        matrix = matrix.mul(M44.scale(this.scale));
        matrix = matrix.mul(M44.rotateZ(this.rotation.z*this.time));
        var center = [-0.5, -0.5, -0.5];
        matrix.mul(M44.translate(center), this.matrix);

        this.rotation.scale(0.998);
        this.velocity.scale(0.998);
    };

    Instance.prototype.update3D = function update3D(dt) {
        this.time += dt;
        this.position.add(this.velocity.prodC(dt));
        // adjustPosition
        var min = this.position.diff(BOX.min);
        var max = this.position.diff(BOX.max);
        if (min.x < 0) {
            this.velocity.x = -this.velocity.x;
            this.position.x = BOX.min.x;
        } else if (max.x > 0) {
            this.velocity.x = -this.velocity.x;
            this.position.x = BOX.max.x;
        }
        if (min.y < 0) {
            this.velocity.y = -this.velocity.y;
            this.position.y = BOX.min.y;
        } else if (max.y > 0) {
            this.velocity.y = -this.velocity.y;
            this.position.y = BOX.max.y;
        }
        if (min.z > 0) {
            this.velocity.z = -this.velocity.z;
            this.position.z = BOX.min.z;
        } else if (max.z < 0) {
            this.velocity.z = -this.velocity.z;
            this.position.z = BOX.max.z;
        }

        var fov = Math.PI*72/180;
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var zNear = 1;
        var zFar = -_world.z;
        var matrix = M44.perspective(fov, aspect, zNear, zFar).mul(M44.translate(this.position));
        matrix = matrix.mul(M44.rotateX(this.rotation.x*this.time));
        matrix = matrix.mul(M44.rotateY(this.rotation.y*this.time));
        matrix = matrix.mul(M44.rotateZ(this.rotation.z*this.time));
        //matrix = matrix.mul(M44.scale(this.scale));
        var center = [-0.5, -0.5, -0.5];
        matrix.mul(M44.translate(center), this.matrix);

        this.rotation.scale(0.998);
        this.velocity.scale(0.998);
    };

    Instance.prototype.render2D = function render2D() {
        _program.uniforms.u_color.value = this.color;
        _program.updateUniform('u_color');
        _program.uniforms.u_matrix.value = this.matrix;
        _program.updateUniform('u_matrix');
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    };

    Instance.prototype.render3D = function render3D() {
        _program.uniforms.u_color.value = this.color;
        _program.updateUniform('u_color');
        _program.uniforms.u_matrix.value = this.matrix;
        _program.updateUniform('u_matrix');
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
    };

    // function setGeometry2D() {
    //     var vertices = new Float32Array([0, 0, 0,  1, 0, 0,  0, 1, 0,  1, 1, 0]);
    //     _vbo = gl.createBuffer();
    //     gl.bindBuffer(gl.ARRAY_BUFFER, _vbo);
    //     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    //     var indices = new Uint16Array([0, 2, 3,  0, 3, 1]);
    //     _ibo = gl.createBuffer();
    //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ibo);
    //     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    // }

    function setGeometry3D() {
        var vertices = new Float32Array([0, 0, 0,  1, 0, 0,  0, 1, 0,  1, 1, 0,  0, 0, 1,  1, 0, 1,  0, 1, 1,  1, 1, 1]);
        _vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        var indices = new Uint8Array([0,3,2, 0,1,3, 5,6,7, 5,4,6, 1,7,3, 1,5,7, 4,2,6, 4,0,2, 2,7,6, 2,3,7, 4,1,0, 4,5,1]);
        _ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    function run() {
        _frames++;
        _elapsedTime = new Date().getTime() - _startTime;
        if (_frames % 20 == 0) {
            _controls.fps.control.innerHTML = (''+_frames*1000/_elapsedTime).slice(0, 4);
        }
        var t = new Date().getTime();
        var dt = 0.0005*(t - _lastTick);

        // update
        for (var i=0; i<_controls.count.value; i++) {
            _instances[i].update(dt);
        }

        // render
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        //gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA);
        gl.clearColor(0.02, 0.1, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        gl.enable(gl.CULL_FACE);
        webGL.useProgram(_program);
        for (var i=0; i<_controls.count.value; i++) {
            _instances[i].render();
        }
        _lastTick = t;
        
        if (_controls.start.value) requestAnimationFrame(run);
        else {
            gl.clearColor(0.0625, 0.09375, 0.125, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }

    function start() {
        _lastTick = new Date().getTime();
        _startTime = _lastTick;
        _frames = 0;
        requestAnimationFrame(run);
    }

    function createShaders() {
        var shaders = {};
        shaders[gl.FRAGMENT_SHADER] =
           `precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }`;
        shaders[gl.VERTEX_SHADER] = 
           `attribute vec4 a_position;
            uniform vec4 u_color;
            uniform mat4 u_matrix;
            varying vec4 v_color;

            void main() {
                gl_Position = u_matrix*a_position;
                v_color = u_color;
            }`;

        _programs['2D'] = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 }
        }, {
            u_matrix: { type: webGL.FLOAT4x4M },
            u_color: { type: webGL.FLOAT4V }
        });
    
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
            }`;

        _programs['3D'] = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 }
        }, {
            u_matrix: { type: webGL.FLOAT4x4M },
            u_color: { type: webGL.FLOAT4V }
        });
    }

    function createUI() {
        _controlsElem = document.createElement('div');
        _controlsElem.id = "controls";
        _controlsElem.innerHTML =
        `<table width="100%">
            <tr><th colspan="2">Settings</th></tr>
            <tr><td>FPS</td><td id="fps">00.00</td></tr>
            <tr><td>Count</td><td><input id="count" type="text" value="${_controls.count.value}"/></td></tr>
            <tr><td>3D</td><td><input id="mode" type="checkbox"${_controls.mode.value ? ' CHECKED' : ''}/></td></tr>
            <tr><td colspan="2"align="center"><button id="start">${_controls.start.value ? 'Stop' : 'Start'}</button></td></tr>
        </table>`;
        document.body.appendChild(_controlsElem);
        for (var k in _controls) {
            var el = document.getElementById(k);
            if (el != null) _controls[k].control = el;
        }
        _controls.count.control.onchange = setCount;
        _controls.mode.control.onclick = setMode;
        _controls.start.control.onclick = startStop;
        if (_controls.start.value == true) {
            start();
        }
    }

    function setup() {
        var canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.width = window.innerWidth/2;
        canvas.height = window.innerHeight/2;
        document.body.appendChild(canvas);
        window.gl = canvas.getContext('webgl2');

        createUI();

        createShaders();

        window.onresize = onResize;

        onResize();

        for (var i=0; i<_controls.count.value; i++) {
            var instance = new Instance();
            instance.setMode(_controls.mode.value);
            _instances.push(instance);
        }

        setGeometry3D();

        setMode();
    }

    function onResize() {
        _size.set([canvas.width, canvas.height, 200]).scale(0.5);
        _controlsElem.style.left = (window.innerWidth - _controlsElem.clientWidth - 10) + 'px';
        var aspect = _size.x/_size.y;
        _projection = new M44([
            1/_world.x, 0.0, 0.0, 0.0,
            0.0, aspect/_world.y, 0.0, 0.0,
            0, 0, 1/_world.z, 0.0,
            0.0, 0.0, 0.0, 1.0
        ]);
        BOX.min.set([-_world.x, -_world.y/aspect, -10]);
        BOX.max.set([_world.x, _world.y/aspect, -210]);
        console.log(BOX.min)
        console.log(BOX.max)
    }

    function setCount(e) {
        var oldCount = _controls.count.value;
        var newCount = parseInt(this.value);
        for (var i=oldCount; i<newCount; i++) {
            var instance = new Instance();
            instance.setMode(_controls.mode.value);
            _instances.push(instance);
        }
        if (oldCount > newCount) {
            _instances.splice(newCount, oldCount-newCount);
        }
        _controls.count.value = newCount;
        Dbg.prln(`New count is ${_instances.length}.`);
    }

    function setMode() {
        var mode = this.checked != undefined ? this.checked : _controls.mode.value;
        _controls.mode.value = mode;
        for (var i=0; i<_controls.count.value; i++) {
            _instances[i].setMode(mode);
        }
        _program = mode ? _programs['3D'] : _programs['2D'];
        Dbg.prln(`Mode set to ${mode ? '3D' : '2D'}.`);
    }

    function startStop() {
        if (_controls.start.value) {
            this.innerHTML = 'Start';
            _controls.start.value = false;
        } else {
            this.innerHTML = 'Stop';
            _controls.start.value = true;
            start();
        }
    }

    function test_simple_rendering() {
        setup();
    }

    function test_instanced_rendering() {
        setup();
    }

    var tests = () => [test_simple_rendering];

    public(tests, 'WebGL tests');

})();