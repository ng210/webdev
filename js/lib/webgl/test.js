(function() {
    // include('/lib/math/v2.js');
    include('/lib/math/v3.js');
    include('/lib/math/m44.js');
    // include('/lib/math/quaternion.js');
    include('webgl.js');
    include('compute-shader.js');

    async function animate(callback) {
        var start = 0;
        var elapsed = 0;
        var hraf = 0;
        var isDone = false;
        function loop(time) {
            if (start == 0) {
                start = time;
            } else {
                elapsed = time - start;
            }
            callback(elapsed);
            if (!isDone) hraf = requestAnimationFrame(loop);
        }

        message('Start.');
        hraf = requestAnimationFrame(loop);
        await button('Stop');
        isDone = true;
        cancelAnimationFrame(hraf);
        message('Done.');
    }

    function initWebGL() {
        if (!window.gl) {
            webGL.init(null, true);
        }
    }

    // function Actor(id, type) {
    //     this.id = id;
    //     this.mesh = null;
    //     this.materials = [];
    // }

    function createCube() {
        var cube = {};
        // create cube
        //   7-+- *----------* 6++-
        //       /|         /|
        // 3-++ *-+--------* | 2+++
        //      | |        | |
        //      | |        | |
        // 4--- | *--------+-* 5+--
        //      |/         |/
        // 0--+ *----------* 1+-+
        cube.vertices = [
            -1,-1, 1, 0,0, 0.0, 0.0, 0.0,  0,0,1,    1,-1, 1, 1,0, 0.0, 0.0, 0.0,  0,0,1,    1, 1, 1, 1,1, 0.0, 0.0, 0.0,  0,0,1,  -1, 1, 1, 0,1, 0.0, 0.0, 0.0,  0,0,1,
             1,-1, 1, 1,0, 0.0, 0.0, 0.0,  1,0,0,    1,-1,-1, 0,0, 0.0, 0.0, 0.0,  1,0,0,    1, 1,-1, 0,1, 0.0, 0.0, 0.0,  1,0,0,   1, 1, 1, 1,1, 0.0, 0.0, 0.0,  1,0,0,
             1,-1,-1, 0,0, 0.0, 0.0, 0.0,  0,0,-1,  -1,-1,-1, 1,0, 0.0, 0.0, 0.0,  0,0,-1,  -1, 1,-1, 1,1, 0.0, 0.0, 0.0,  0,0,-1,  1, 1,-1, 0,1, 0.0, 0.0, 0.0,  0,0,-1,
            -1,-1,-1, 1,0, 0.0, 0.0, 0.0, -1,0,0,   -1,-1, 1, 0,0, 0.0, 0.0, 0.0, -1,0,0,   -1, 1, 1, 0,1, 0.0, 0.0, 0.0, -1,0,0,  -1, 1,-1, 1,1, 0.0, 0.0, 0.0, -1,0,0,
            -1, 1, 1, 1,0, 0.0, 0.0, 0.0,  0,1,0,    1, 1, 1, 0,0, 0.0, 0.0, 0.0,  0,1,0,    1, 1,-1, 0,1, 0.0, 0.0, 0.0,  0,1,0,  -1, 1,-1, 1,1, 0.0, 0.0, 0.0,  0,1,0,
            -1,-1,-1, 1,0, 0.0, 0.0, 0.0,  0,-1,0,   1,-1,-1, 0,0, 0.0, 0.0, 0.0,  0,-1,0,   1,-1, 1, 0,1, 0.0, 0.0, 0.0,  0,-1,0, -1,-1, 1, 1,1, 0.0, 0.0, 0.0,  0,-1,0
        ];
        cube.vertexCount = 0;
        // set color from position
        for (var i=0; i<cube.vertices.length; i+=11) {
            cube.vertices[i+5] = 0.5*(cube.vertices[i]+1);
            cube.vertices[i+6] = 0.5*(cube.vertices[i+1]+1);
            cube.vertices[i+7] = 0.5*(cube.vertices[i+2]+1);
            cube.vertexCount++;
        }

        cube.indices = [
            0,1,2, 2,3,0,  4,5,6, 6,7,4,
            8,9,10, 10,11,8,  12,13,14, 14,15,12,
            16,17,18, 18,19,16,  20,21,22, 22,23,20
        ];
        cube.indexCount = cube.indices.length;
        
        
        return cube;
    }

    function createSphere(n) {
        n = n || 6;
        var sphere = {
            vertices: [],
            vertexCount: 0,
            indices: [],
            indexCount: 0
        };
        var da = 2.0*Math.PI/n;
        var a = Math.PI/2, b = 0;
        for (var i=0; i<=n/2; i++) {
            var r = Math.cos(a);
            var y = Math.sin(a);
            b = 0;
            for (var j=0; j<=n; j++) {
                var x = r*Math.cos(b);
                var z = r*Math.sin(b);
                // position
                sphere.vertices.push(x, y, z);
                // texcoord
                var u = 1-j/n, v = 2*i/n;
                sphere.vertices.push(u, v);
                // color
                //sphere.vertices.push(0.5*(x + r), 0.5*(y + r), 0.5*(z + r));
                sphere.vertices.push(1,1,1);
                // normal
                var normal = new V3(x, y, z).norm();
                sphere.vertices.push(normal.x, normal.y, normal.z);
                sphere.vertexCount++;
                b += da;
                if (b > 2*Math.PI) b = 0;
                if (i > 0 && j > 0) {
                    var m = n+1;
                    var k1 = (i-1)*m + (j-1)%(m+1);
                    var k2 = (i-1)*m + j;
                    var k3 = i*m + (j-1)%(m+1);
                    var k4 = i*m + j;
                    sphere.indices.push(k1,k2,k3, k3,k2,k4);
                }
            }
            a -= da;
        }
        sphere.indexCount = sphere.indices.length;
        return sphere;
    }

    async function setup(scene) {
        // create a simple scene containing
        // - 1 model: a cube 
        // - 1 material: a shader and texture
        // - 2 lights: sun (direct), lamp (point)
        var errors = null;
        initWebGL();

        // load resources
        var res = await load([
            'res/simple.vs',
            'res/simple.fs',
            'res/blank.png',
            'res/checkered.png',
            'res/box.png',
            'res/box_heightmap.png',
            'res/world_heightmap.png',
            'res/world_heightmap2.jpg',
            'res/worldmap.jpg',
            'res/worldmap2.png',
            'res/worldmap3.png'
        ]);

        var errors = res.select(x => x.error instanceof Error).map(x => x.error);
        if (errors.length == 0) {
            // #region create geometry
            scene.models = [createCube(), createSphere(60)];
            // combine vertices into 1 buffer
            // combine indices into 1 buffer
            var vb = [];
            var ib = [];
            var vertexCount = 0;
            for (var i=0; i<scene.models.length; i++) {
                var model = scene.models[i];
                model.vertexOffset = vb.length;
                for (var vi=0; vi<model.vertices.length; vi++) {
                    vb.push(model.vertices[vi]);
                }
                model.indexOffset = ib.length;
                for (var ii=0; ii<model.indices.length; ii++) {
                    ib.push(model.indices[ii] + vertexCount);
                }
                vertexCount += model.vertexCount;
            }
            scene.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array(vb), gl.STATIC_DRAW);
            scene.ibo = webGL.createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ib), gl.STATIC_DRAW);
            //#endregion

            // #region create material
            var shaders = {};
            shaders[gl.VERTEX_SHADER] = res[0].data;
            shaders[gl.FRAGMENT_SHADER] = res[1].data;
            scene.shaders = [
                webGL.createProgram(shaders)
            ];
            scene.textures = [
                webGL.createTexture(res[2].node), // 0: blank
                webGL.createTexture(res[3].node), // 1: checkered
                webGL.createTexture(res[4].node), // 2: box
                webGL.createTexture(res[5].node), // 3: box heightmap
                webGL.createTexture(res[6].node), // 4: earth height1
                webGL.createTexture(res[7].node), // 5: earth height2
                webGL.createTexture(res[8].node), // 6: earth color1
                webGL.createTexture(res[9].node), // 7: earth color2
                webGL.createTexture(res[10].node) // 8: earth color3
            ];

            scene.materials = [
                { // blank
                    'shader': scene.shaders[0],
                    'textures': [
                        scene.textures[0]
                    ],
                    'args': {
                        'color': new V3(1.0, 1.0, 1.0),
                        'diffuse': 1.0,
                        'specular1': 2.5,
                        'specular2': 300
                    }
                },
                { // checkered
                    'shader': scene.shaders[0],
                    'textures': [
                        scene.textures[1],
                        scene.textures[1]
                    ],
                    'args': {
                        'color': new V3(0.8, 0.9, 1.0),
                        'diffuse': 1.0,
                        'specular1': 2.2,
                        'specular2': 240
                    }
                },
                { // metal box
                    'shader': scene.shaders[0],
                    'textures': [
                        scene.textures[2],
                        scene.textures[3]
                    ],
                    'args': {
                        'color': new V3(0.8, 0.7, 0.4),
                        'diffuse': 1.0,
                        'specular1': 5.8,
                        'specular2': 40
                    }
                },
                { // earth1
                    'shader': scene.shaders[0],
                    'textures': [
                        scene.textures[6],
                        scene.textures[4]
                    ],
                    'args': {
                        'color': new V3(1.0, 1.0, 1.0),
                        'diffuse': 0.8,
                        'specular1': 2.0,
                        'specular2': 30.0
                    }
                },
                { // earth2
                    'shader': scene.shaders[0],
                    'textures': [
                        scene.textures[7],
                        scene.textures[5]
                    ],
                    'args': {
                        'color': new V3(1.0, 1.0, 1.0),
                        'diffuse': 0.8,
                        'specular1': 2.0,
                        'specular2': 30.0
                    }
                }
            ];
            //#endregion

            scene.lights = [
                { 'id':'sun',   'type':'diffuse', 'color': [1.00, 0.95, 0.80], 'direction': new V3( 2.0, 1.0, 1.0) },
                { 'id':'lamp1', 'type':'point',   'color': [0.50, 0.60, 1.00], 'position':  new V3(-3.0, 0.0, -3.0) },
                { 'id':'lamp2', 'type':'point',   'color': [1.00, 0.95, 0.90], 'position':  new V3( 4.0, 0.0, 0.0) }
            ];

            // set view-projection matrix
            var fov = Math.PI*60/180;
            var aspect = gl.canvas.width/gl.canvas.height;
            var zNear = 1, zFar = -100;
            scene.viewProjection = M44.perspective(fov, aspect, zNear, zFar);
            scene.camera = new V3(0.0, 0.0, 0.0);
            scene.lookAt = new V3(0.0, 0.0, -1.0);
        }
        return errors;
    }

    function teardown() {
    }

    function setMaterial(mat, shaderArgs) {
        // set texture
        for (var i=0; i<mat.textures.length; i++) {
            shaderArgs['u_texture'+i] = i;
            gl.activeTexture(gl['TEXTURE'+i]);
            gl.bindTexture(gl.TEXTURE_2D, mat.textures[i]);
        }

        // set shader and uniforms
        for (var i in mat.args) {
            shaderArgs['u_' + i] = mat.args[i]
        }
        webGL.useProgram(mat.shader, shaderArgs);
    }

    async function test_simple_render() {
        // Includes
        // - geometry
        // - material: shader and texture
        // - vertex color
        // - directional and point lights
        header('Test simple rendering');
        var scene = {};
        var errors = await setup(scene);
        test('Should setup the scene', ctx => ctx.assert(errors.length, '=', 0));
        if (errors.length == 0) {

            // #region prepare rendering
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0.01, 0.02, 0.04, 1.0);
            gl.frontFace(gl.CCW);
            gl.cullFace(gl.BACK);
            gl.enable(gl.CULL_FACE);
            gl.enable(gl.DEPTH_TEST);
            // bind vertex and index buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, scene.vbo);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scene.ibo);
            // #endregion

            // set basic uniforms
            var shaderArgs = {
                'u_viewProjectionMat4': scene.viewProjection,
                'u_camera_position': new V3(0.0, 0.0, 0.0)
            };
            // set lights
            for (var i=0; i<scene.lights.length; i++) {
                var li = scene.lights[i];
                var lid = li.id;
                shaderArgs[`u_${lid}_color`] = new Float32Array(li.color);
                switch (li.type) {
                    case 'diffuse': shaderArgs[`u_${lid}_direction`] = li.direction.norm(); break;
                    case 'point': shaderArgs[`u_${lid}_position`] = li.position; break;
                }
            }

            await animate(
                time => {
                    // select model
                    var model = scene.models[0];

                    // #region update
                    var rotZ = 0//time*Math.PI/24000;
                               //-22/180*Math.PI
                               ;
                    var rotY = time*Math.PI/12000;
                    var pos = new V3(0.0, 0.0, -3.5);
                    var posInv = new V3(0.0).sub(pos);
                    var modelMat = M44.rotateY(rotY).mul(M44.rotateZ(rotZ)).mul(M44.translate(pos));
                    var normalMat = M44.translate(posInv).mul(M44.rotateZ(-rotZ)).mul(M44.rotateY(-rotY)).transpose();
                    // #endregion

                    // set material
                    setMaterial(scene.materials[2], shaderArgs);
                    // #region render
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                    //gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA);
                    scene.shaders[0].setUniform('u_normalMat4', normalMat);
                    scene.shaders[0].updateUniform('u_normalMat4');
                    scene.shaders[0].setUniform('u_modelMat4', modelMat);
                    scene.shaders[0].updateUniform('u_modelMat4');
                    // render
                    gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 2*model.indexOffset);
                    //setMaterial(scene.materials[0], shaderArgs);
                    //gl.drawElements(gl.LINES, model.indexCount, gl.UNSIGNED_SHORT, 2*model.indexOffset);
                }
            );
            // setup controls
            document.addEventListener('mouseup', glui.onevent);
            document.addEventListener('mousedown', glui.onevent);
            document.addEventListener('mousemove', glui.onevent);
            document.addEventListener('dragging', glui.onevent);


        }
        for (var i=0; i<errors.length; i++) error(errors[i]);
        teardown();
    }

    async function test_compute_shader() {
        initWebGL();
        webGL.useExtension('EXT_color_buffer_float');

        var cs = new webGL.ComputeShader(16, gl.R32F, (k, i, j) => k);
        await cs.setup('res/compute1.fs');
        cs.compute();
        Dbg.prln(cs.results);
        test(`Should compute '${cs.input.data}' into ${cs.results}`, context => context.assert(cs.results, ':=', [0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30]));
        cs.feedback();
        cs.compute();
        Dbg.prln(cs.results);
        test(`Should compute '${cs.input.data}' into ${cs.results}`, context => context.assert(cs.results, ':=', [0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60]));
        cs.destroy();
    }

    var tests = () => [
        test_compute_shader,
        test_simple_render
    ];

    publish(tests, 'WebGL tests');

})();