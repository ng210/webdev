(function() {
    include('math/v2.js');
    include('math/v3.js');
    include('math/quaternion.js');
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
    var _world = new V3(500, 500, 1000);
    var BOX = { min: new V3(), max: new V3() };

    var _controls = {
        fps: { value: 0, control: null },
        count: { value: 300, control: null },
        mode: { value: true, control: null },
        start: { value: true, control: null }
    };

    var _viewProjection2D = new Float32Array(16);
    var _viewProjection3D = new Float32Array(16);

    var _controlsElem = null;

    function Instance() {
        this.time = 0;
        this.velocity = V3.fromPolar(2*Math.PI*Math.random(), 2*Math.PI*Math.random(), 20*(0.4*Math.random() + 0.6));
        this.position = new V3(0, 0, -450).add(this.velocity.prodC(0.1));
        this.scale = new V3(Math.random()+0.5);
        var rot = [0, 0, 0];
        for (var i=0; i<3; i++) {
            var r = 0.3*(Math.random() - 0.5);
            rot[i] = r < 0 ? -1-r : 1-r;
        }
        this.rot = [
            Quaternion.fromAxisAngle([1, 0, 0, 0], 2*Math.PI*rot[0]),
            Quaternion.fromAxisAngle([0, 1, 0, 0], 2*Math.PI*rot[1]),
            Quaternion.fromAxisAngle([0, 0, 1, 0], 2*Math.PI*rot[2]),
            new Quaternion(0, 0, 0, 1)
        ];
        this.color = new Float32Array([Math.random(), Math.random(), Math.random(), 1.0]);
        
        this.model = new Float32Array(16);
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

        var dRot = this.rot[2].prodC(dt);
        dRot[3] /= dt;
        this.rot[3] = this.rot[3].mul(dRot);
        this.rot[3].norm().toMatrix()
            .mul(M44.scale(this.scale))
            .mul(M44.translate(this.position), this.model);

        this.rot[2].w *= 1.001;
        //this.velocity.scale(0.998);
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

        var matrix = M44.scale(this.scale).mul(M44.translate(this.position));
        var dRot = this.rot[0].mul(this.rot[1]).mul(this.rot[2]);
        dRot[3] /= dt;
        this.rot[3] = this.rot[3].mul(dRot).norm();
        this.rot[3].toMatrix().mul(matrix, this.model);
        this.rot[0].w *= 1.001;
        this.rot[1].w *= 1.001;
        this.rot[2].w *= 1.001;
        //this.velocity.scale(0.998);
    };

    Instance.prototype.render2D = function render2D() {
        _program.uniforms.u_color.value = this.color;
        _program.updateUniform('u_color');
        _program.uniforms.u_model.value = this.model;
        _program.updateUniform('u_model');
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    };

    Instance.prototype.render3D = function render3D() {
        _program.uniforms.u_color.value = this.color;
        _program.updateUniform('u_color');
        _program.uniforms.u_translationScale.value = this.model;
        _program.updateUniform('u_translationScale');
        // _program.uniforms.u_rotation.value = this.rotation;
        // _program.updateUniform('u_rotation');
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
    };

    function setGeometry3D() {
        var vb = new Float32Array(6*4*2*3);
        var p = new V4(-1, -1, 1, 0);
        var n = new V4(0, 0, 1, 0);
        var rotX = Quaternion.fromAxisAngle([1, 0, 0], Math.PI/2);
        var rotY = Quaternion.fromAxisAngle([0, 1, 0], Math.PI/2);
        var rotZ = Quaternion.fromAxisAngle([0, 0, 1], Math.PI/2);
        var rot = new Quaternion([0, 0, 0, 1]);
        var ix = 0;
        for (var j=0; j<6; j++) {
            for (var i=0; i<4; i++) {
                p.x = Math.round(p.x); p.y = Math.round(p.y); p.z = Math.round(p.z);
                vb[ix++] = p.x; vb[ix++] = p.y; vb[ix++] = p.z;
                vb[ix++] = n.x; vb[ix++] = n.y; vb[ix++] = n.z;
                rot = rot.mul(rotZ);
                p = rot.rotate([-1,-1,1,0]);
            }
            if (j % 2 == 1) {
                rot = rot.mul(rotX);
            } else {
                rot = rot.mul(rotY);
            }
            p = rot.rotate([-1,-1,1,0]);
            n = rot.rotate([0,0,1,0]);
            n.x = Math.round(n.x); n.y = Math.round(n.y); n.z = Math.round(n.z);
        }
        _vbo = webGL.createBuffer(gl.ARRAY_BUFFER, vb, gl.STATIC_DRAW);
        var ib = new Uint8Array(36);
        ix = 0;
        for (var i=0; i<6; i++) {
            ib[ix++] = i*4; ib[ix++] = i*4+1; ib[ix++] = i*4+2;
            ib[ix++] = i*4; ib[ix++] = i*4+2; ib[ix++] = i*4+3;
        }
        _ibo = webGL.createBuffer(gl.ELEMENT_ARRAY_BUFFER, ib, gl.STATIC_DRAW);

        var ix = 0;
        for (var i=0; i<6; i++) {
            //console.log(`Side #${i}`);
            for (var j=0; j<6; j++) {
                var ix = ib[6*i+j];
                var p = new V3(vb, 6*ix);
                var n = new V3(vb, 6*ix+3);
                //console.log(` ${ix}: p=${p.toString()}, n=${n}`);
            }
        }
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
        //update projection*view
        if (_controls.mode.value) {
            _program.uniforms.u_viewProjection.value = _viewProjection3D;
            // _program.uniforms.u_lightPos.value[0] = 100;
            // _program.uniforms.u_lightPos.value[1] = Math.sin(0.03*_frames)*_world.y;
            // _program.uniforms.u_lightPos.value[2] = Math.cos(0.03*_frames)*_world.z;
            _program.updateUniform('u_lightPos');
        } else {
            _program.uniforms.u_viewProjection.value = _viewProjection2D;    
        }
        _program.updateUniform('u_viewProjection');

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
            uniform vec4 u_color;
            void main() {
                gl_FragColor = u_color;
            }`;
        shaders[gl.VERTEX_SHADER] = 
           `attribute vec4 a_position;

            uniform mat4 u_viewProjection;
            uniform mat4 u_model;

            void main() {
                gl_Position = u_viewProjection*u_model*a_position;
            }`;

        _programs['2D'] = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 },
            a_normal: { type:gl.FLOAT, size:3 }
        }, {
            u_viewProjection: { type: webGL.FLOAT4x4M },
            u_model: { type: webGL.FLOAT4x4M },
            u_color: { type: webGL.FLOAT4V }
        });
    
        shaders[gl.VERTEX_SHADER] = 
           `attribute vec4 a_position;
            attribute vec4 a_normal;

            uniform vec4 u_color;
            uniform mat4 u_viewProjection;
            uniform mat4 u_translationScale;
            uniform mat4 u_rotation;

            varying vec3 v_pos;
            varying vec3 v_normal;
            varying vec3 v_color;            

            mat3 extract3x3(mat4 m) {
                return mat3(m[0].xyz, m[1].xyz, m[2].xyz);
            }

            void main() {
                // mat4 model = u_translationScale*u_rotation;
                // vec4 worldPos = model*a_position;
                // v_normal = (u_rotation*a_normal).xyz;
                vec4 worldPos = u_translationScale*a_position;
                v_normal = extract3x3(u_translationScale)*a_normal.xyz;
                v_pos = worldPos.xyz;
                gl_Position = u_viewProjection*worldPos;
                v_color = u_color.rgb;
            }`;

        shaders[gl.FRAGMENT_SHADER] =
           `precision mediump float;

            uniform vec3 u_lightPos;

            varying vec3 v_pos;
            varying vec3 v_color;
            varying vec3 v_normal;

            void main() {
                vec3 ambient = vec3(0.1, 0.2, 0.4);
                float z = 1.0 - (v_pos.z - 10.0)/500.0;
                vec3 norm = normalize(v_normal);
                vec3 lightDir = normalize(u_lightPos - v_pos);
                float diff = max(dot(norm, lightDir), 0.0);
                vec3 diffuse = diff*vec3(1.0)*(1.0 - distance(u_lightPos, v_pos)/1000.0);
                vec3 color = (ambient + diffuse)*v_color;
                gl_FragColor = vec4(mix(vec3(0.02, 0.1, 0.2), color, z), 1.0);
            }`;

        _programs['3D'] = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 },
            a_normal: { type:gl.FLOAT, size:3 }
        }, {
            u_viewProjection: { type: webGL.FLOAT4x4M },
            u_translationScale: { type: webGL.FLOAT4x4M },
            u_rotation: { type: webGL.FLOAT4x4M },
            u_color: { type: webGL.FLOAT4V },
            u_lightPos: { type: webGL.FLOAT3V }
        });
        _programs['3D'].uniforms.u_lightPos.value = new Float32Array([0, 0, 1]);
        _programs['3D'].uniforms.u_translationScale.value = new Float32Array(16);
        _programs['3D'].uniforms.u_rotation.value = new Float32Array(16);
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

        canvas.onmousemove = function(e) {
            // _program.uniforms.u_lightPos.value[0] = _world.x*(2*e.clientX/gl.canvas.clientWidth - 1);
            // _program.uniforms.u_lightPos.value[1] = -_world.y*(2*e.clientY/gl.canvas.clientHeight - 1);
        };

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
        var aspect = canvas.width/canvas.height;
        _controlsElem.style.left = (window.innerWidth - _controlsElem.clientWidth - 10) + 'px';
        
        new M44([
            1/_world.x, 0.0, 0.0, 0.0,
            0.0, aspect/_world.y, 0.0, 0.0,
            0, 0, 1/_world.z, 0.0,
            0.0, 0.0, 0.0, 1.0
        ]).put(_viewProjection2D);
        //M44.projection(_world.x, aspect*_world.y, _world.z, _viewProjection2D);

        var fov = Math.PI*60/180;
        var zNear = 1;
        var zFar = 2000;    //_world.z;
        M44.perspective(fov, aspect, zNear, zFar, _viewProjection3D);

        BOX.min.set([-_world.x, -_world.y/aspect, _world.z]);
        BOX.max.set([_world.x, _world.y/aspect, -_world.z]);
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

    publish(tests, 'WebGL tests');

})();