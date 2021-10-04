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

    function onevent(e) {
        switch (e.type) {
            case 'mousemove': break
        }
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
            scene.models = [createCube(), createSphere(150)];
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
                },
                { // earth3
                    'shader': scene.shaders[0],
                    'textures': [
                        scene.textures[8],
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

            // setup controls
            document.addEventListener('mouseup', onevent);
            document.addEventListener('mousedown', onevent);
            document.addEventListener('mousemove', onevent);
            document.addEventListener('dragging', onevent);

            await animate(
                time => {
                    // select model
                    var model = scene.models[1];

                    // #region update
                    var rotZ = //time*Math.PI/24000;
                               -22/180*Math.PI
                    var rotY = time*Math.PI/12000;
                    var pos = new V3(0.0, 0.0, -3.5);
                    var posInv = new V3(0.0).sub(pos);
                    var modelMat = M44.rotateY(rotY).mul(M44.rotateZ(rotZ)).mul(M44.translate(pos));
                    var normalMat = M44.translate(posInv).mul(M44.rotateZ(-rotZ)).mul(M44.rotateY(-rotY)).transpose();
                    // #endregion

                    // set material
                    setMaterial(scene.materials[4], shaderArgs);
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
        }
        for (var i=0; i<errors.length; i++) error(errors[i]);
        teardown();
    }

    async function test_compute_shader_inputs() {
        initWebGL();
        webGL.useExtension('EXT_color_buffer_float');
        var image = await load('./res/box.png');
        var tests = {
            'length(byte)': { arguments: [4*3, 'byte'], expected:{ length: 4*3, type:gl.R8UI }},
            'length(long)': { arguments: [3*3, 'long'], expected:{ length: 4*3, type:gl.R32UI }},
            'float32array': { arguments: [new Float32Array(10)], expected: { length: 4*3, type:gl.R32F} },
            'length(byte[2])': { arguments: [3*5, 'byte[2]'], expected:{ length: 2*4*4, type:gl.RG8UI }},
            'length(uint32[4])': { arguments: [5*6, 'uint32[4]'], expected:{ length: 4*4*8, type:gl.RGBA32UI }},
            'float32array(float[4])': { arguments: [new Float32Array([0,1,2,3,4,5,6,7]), 'float[4]'], expected: { length: 4*8, type:gl.RGBA32F} },
            // 'image': { arguments: [image.node], expected:{ length: 4*512*512, type:gl.RGBA8UI }},
            // 'fbo': { arguments: [null], expected:{ length: 4*gl.canvas.width*gl.canvas.height, type:gl.RGBA8UI }}
        };

        var cs = new webGL.ComputeShader2();
        for (var i in tests) {
            var data = tests[i].arguments[0];
            // create compute-shader
            cs.setInput.apply(cs, tests[i].arguments);
            test(`Should create a buffer from '${i}'`, ctx => {
                if (data != null) {
                    ctx.assert(cs.input.data, '!null');
                    ctx.assert(cs.input.length, '=', tests[i].expected.length);
                    if (cs.input.data.buffer instanceof ArrayBuffer) {
                        ctx.assert(cs.input.data.length, '=', tests[i].expected.length);
                    }
                }
                ctx.assert(cs.input.type.id, '=', tests[i].expected.type);
            });
            cs.setOutput.apply(cs, tests[i].arguments);

            var samplerType = '', outputType = 'float', inputs = 'x', constant = '2';
            switch (cs.input.type.id) {
                case gl.R8UI:       samplerType = 'mediump u'; inputs = '.x';   break;
                case gl.R32UI:      samplerType = 'highp u';   inputs = '.x';   break;
                case gl.R32F:       samplerType = '';          inputs = '.x';   break;
                case gl.RG8UI:      samplerType = 'mediump u'; inputs = '.xy';  break;
                case gl.RG32UI:     samplerType = 'highp u';   inputs = '.xy';  break;
                case gl.RG32F:      samplerType = '';          inputs = '.xy';  break;
                case gl.RGBA8UI:    samplerType = 'mediump u'; inputs = '';     break;
                case gl.RGBA32UI:   samplerType = 'highp u';   inputs = '';     break;
                case gl.RGBA32F:    samplerType = '';          inputs = '';     break;
            }
            switch (cs.output.type.id) {
                case gl.R8UI:       outputType = 'uint';    constant = '2u';                    break;
                case gl.R32UI:      outputType = 'uint';    constant = '2u';                    break;
                case gl.R32F:       outputType = 'float';   constant = '2.';                    break;
                case gl.RG8UI:      outputType = 'uvec2';   constant = 'uvec2(2, 4)';           break;
                case gl.RG32UI:     outputType = 'uvec2';   constant = 'uvec2(2, 4)';           break;
                case gl.RG32F:      outputType = 'vec2';    constant = 'vec2(2., 4.)';          break;
                case gl.RGBA8UI:    outputType = 'uvec4';   constant = 'uvec4(2, 4, 6, 8)';     break;
                case gl.RGBA32UI:   outputType = 'uvec4';   constant = 'uvec4(2, 4, 6, 8)';     break;
                case gl.RGBA32F:    outputType = 'vec4';    constant = 'vec4(2., 4., 6., 8.)';  break;
            }
            var shaderScript =
`#version 300 es
precision highp float;

in vec2 v_position;
uniform ${samplerType}sampler2D u_texture;
out ${outputType} color;

void main(void) {
    color = ${outputType}(${constant}*texture(u_texture, v_position)${inputs});
}`;
            await cs.setShader(shaderScript);
            var result = cs.compute((n, i, j, k) => n);
            var expected = Reflect.construct(result.constructor, [tests[i].expected.length]);
            var length = tests[i].arguments[0].buffer instanceof ArrayBuffer ? tests[i].arguments[0].length : tests[i].arguments[0];
            var size = cs.input.type.length;
            for (var j=0; j<size*length; j++) expected[j] = 2 * (j%size + 1) * Math.floor(j/size);
            test('Should return the correct values', ctx => ctx.assert(result, ':=', expected));
        }
    }

    async function test_compute_shader() {
        header('Test compute shader single call');
        initWebGL();
        webGL.useExtension('EXT_color_buffer_float');
        var tests = {
            'RGBA':     `uniform highp sampler2D u_texture; out vec4 color; void main(void) { color = texture(u_texture, v_position); }`,
            //'R8UI':     `uniform highp usampler2D u_texture; out uint color; void main(void) { color = 2u*texture(u_texture, v_position).x; }`,
            'R8':       `uniform highp sampler2D u_texture; out int color; void main(void) { color = int(texture(u_texture, v_position).x); }`,
            'R32UI':    `uniform isampler2D u_texture; out uint32 color; void main(void) { color = 2.*texture(u_texture, v_position).x; }`,
            'R32F':     `uniform sampler2D u_texture; out float color; void main(void) { color = 2.*texture(u_texture, v_position).x; }`,
            'RG32F':    `uniform sampler2D u_texture; out vec2 color; void main(void) { color = 2.*texture(u_texture, v_position).x; }`,
            'RGBA32UI': `uniform usampler2D u_texture; out uivec4 color; void main(void) { color = 2.*texture(u_texture, v_position).x; }`,
        };

        var shaderBase =
        `#version 300 es
         precision highp float;
         in vec2 v_position;`;
        var expected = [0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30];
        for (var type in tests) {
            var cs = new webGL.ComputeShader(expected);
            // await cs.setShader(shaderBase + tests[type]);
            // cs.fillBuffer((k, i, j) => k);
            // cs.compute();
            // message(type + ': ' + cs.results);
            // test(`Should return '${expected}'`, context => context.assert(cs.results, ':=', expected));
            cs.destroy();
            break;
        }
        // var cs = new webGL.ComputeShader(16, gl.R8UI);
        // await cs.loadShader('res/compute1.fs');
        // cs.setShader(
        //    `#version 300 es
        //     precision highp float;
        //     in vec2 v_position;
        //     uniform sampler2D u_texture;
        //     out uint8 color; void main(void) { color = 2.*texture(u_texture, v_position).x; }
        //     `
        // );
    }

    async function test_compute_shader_multiple() {
        header('Test compute shader multiple calls');
        initWebGL();
        webGL.useExtension('EXT_color_buffer_float');

        var cs = new webGL.ComputeShader(16, gl.R32F);
        await cs.loadShader('res/compute2.fs');
        var base = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
        var offset = 0;
        for (var i=0; i<4; i++) {
            cs.fillBuffer((k, i, j) => k);
            cs.compute(null, null, { 'u_offset': offset } );
            Dbg.prln(cs.results);
            var expected = base.map(x => offset + 2*x);
            test(`Should compute '${cs.input.data}' into ${expected}`, context => context.assert(cs.results, ':=', expected));
            offset += 16;
        }
        cs.destroy();
    }

    var tests = () => [
        test_compute_shader_inputs,
        //test_compute_shader_multiple,
        //test_simple_render
    ];

    publish(tests, 'WebGL tests');

})();