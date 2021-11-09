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
        //if (!window.gl) {
            webGL.init(null, true);
        //}
    }

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
                        'diffuse': 0.8,
                        'specular1': 4.8,
                        'specular2': 100
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
        webGL.shutDown();   
    }

    function setMaterial(mat, shaderArgs) {
        // set texture
        for (var i=0; i<mat.textures.length; i++) {
            shaderArgs['u_texture'+i] = i;
            gl.activeTexture(gl['TEXTURE'+i]);
            gl.bindTexture(gl.TEXTURE_2D, mat.textures[i].texture);
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
            webGL.useExtension('EXT_color_buffer_float');
            //gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
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
            // document.addEventListener('mouseup', onevent);
            // document.addEventListener('mousedown', onevent);
            // document.addEventListener('mousemove', onevent);
            // document.addEventListener('dragging', onevent);

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
                    setMaterial(scene.materials[3], shaderArgs);
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

    async function test_buffer() {
        header('Test buffer');
        initWebGL();
        var buffer = webGL.Buffer.create([32, 16], 'byte[4]');
        var k = 0;
        for (var j=0; j<buffer.height; j++) {
            var cy = Math.floor(j*255/buffer.height);
            for (var i=0; i<buffer.width; i++) {
                var cx = Math.floor(i*255/buffer.width);
                buffer.data[k++] = cx;
                buffer.data[k++] = cx < 128 ? 2*cx : 255 - 2*cx;
                buffer.data[k++] = cy;
                buffer.data[k++] = 255;
            }
        }
        buffer.updateTexture();
        gl.clearColor(0.0, 0.02, 0.10, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        buffer.setShader(
`#version 300 es
precision highp float;

uniform mediump usampler2D u_texture0;
in vec2 v_texcoord;
out vec4 color;

void main(void) {
    color = vec4(texture(u_texture0, v_texcoord))/255.;
}`
        );
        buffer.render(null);
        await button('Next', null, true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    async function createImage(data, width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        var imgData = ctx.createImageData(width, height);
        for (var i=0; i<imgData.data.length; i++) {
            imgData.data[i] = data[i];
        }
        ctx.putImageData(imgData, 0, 0);
        var img = new Image(width, height);
        var isLoaded = false;
        img.onload = () => isLoaded = true;
        img.src = canvas.toDataURL();
        await poll(() => isLoaded);
        delete canvas;
        return img;
    }

    async function test_compute_shader_inputs() {
        initWebGL();
        webGL.useExtension('EXT_color_buffer_float');
        var imgSize = [32, 32];
        var imgBuffer = new Uint8Array(4 * imgSize[0] * imgSize[1]);
        var k = 0;
        for (var j=0; j<imgSize[1]; j++) {
            for (var i=0; i<imgSize[0]; i++) {
                var c = 0.25*(j*255/(imgSize[1]-1) + i*255/(imgSize[0]-1));
                imgBuffer[k++] = c;
                imgBuffer[k++] = c;
                imgBuffer[k++] = c;
                imgBuffer[k++] = 255;
            }
        }
        var img = await createImage(imgBuffer, imgSize[0], imgSize[1]);
        document.body.appendChild(img);
        var tests = {
            'length(byte)':             { input: [8*4, 'byte'],                         output: [null, undefined],  expected: { length: 8*4,        type:gl.R8UI }},
            'length(long)':             { input: [3*3, 'long'],                         output: [null, undefined],  expected: { length: 12,         type:gl.R32UI }},
            'float32array':             { input: [new Float32Array(10)],                output: [null, undefined],  expected: { length: 12,         type:gl.R32F} },
            'length(byte[2])':          { input: [30, 'byte[2]'],                       output: [null, undefined],  expected: { length: 2*4*4,      type:gl.RG8UI }},
            'length(byte[4])':          { input: [64, 'byte[4]'],                       output: [null, undefined],  expected: { length: 4*4*4,      type:gl.RGBA8UI }},
            'length(uint32[4])':        { input: [132, 'uint32[4]'],                    output: [null, undefined],  expected: { length: 4*8*5,      type:gl.RGBA32UI }},
            'length(float[2])':         { input: [14, 'float[2]'],                      output: [null, undefined],  expected: { length: 2*4*2,      type:gl.RG32F }},
            'float32array(float[4])':   { input: [new Float32Array(160), 'float[4]'],   output: [null, undefined],  expected: { length: 160,        type:gl.RGBA32F} },
            'image':                    { input: [img, 'byte[4]'],                      output: [null, undefined],  expected: { length: 4 * imgSize[0] * imgSize[1],  type:gl.RGBA8UI }},
            // 'fbo':                      { input: [null, 'float[4]'],                    output: [null, undefined],  expected: { length: 0,          type:gl.RGBA32F }}
        };
        var cs = new webGL.ComputeShader();
        for (var ti in tests) {
            var data = tests[ti].input[0];
            // create compute-shader
            cs.setInput(...tests[ti].input);
            test(`Should create a buffer from '${ti}'`, ctx => {
                if (data != null) {
                    ctx.assert(cs.input.texture, '!null');
                    ctx.assert(cs.input.length, '=', tests[ti].expected.length);
                    if (cs.input.data && cs.input.data.buffer instanceof ArrayBuffer) {
                        ctx.assert(cs.input.data.length, '=', tests[ti].expected.length);
                    }
                }
                ctx.assert(cs.input.type.id, '=', tests[ti].expected.type);
            });
            var output = tests[ti].output;
            cs.setOutput(...output);

            var samplerType = '', outputType = 'float', inputs = 'x', constant = '2', renderInputs = '.x';
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
                case gl.R8UI:       outputType = 'uint';    constant = '2u'; renderInputs = '.xxx, 255';     break;
                case gl.R32UI:      outputType = 'uint';    constant = '2u'; renderInputs = '.xxx, 255';     break;
                case gl.R32F:       outputType = 'float';   constant = '2.'; renderInputs = '.xxx, 1.';      break;
                case gl.RG8UI:      outputType = 'uvec2';   constant = '2u'; renderInputs = '.xy, 0, 255';   break;
                case gl.RG32UI:     outputType = 'uvec2';   constant = '2u'; renderInputs = '.xy, 0, 255';   break;
                case gl.RG32F:      outputType = 'vec2';    constant = '2.'; renderInputs = '.xy, .0, 1.';   break;
                case gl.RGBA8UI:    outputType = 'uvec4';   constant = '2u'; renderInputs = '';              break;
                case gl.RGBA32UI:   outputType = 'uvec4';   constant = '2u'; renderInputs = '';              break;
                case gl.RGBA32F:    outputType = 'vec4';    constant = '2.'; renderInputs = '';              break;
            }
            await cs.setShader(
`#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform ${samplerType}sampler2D u_texture;
out ${outputType} color;

void main(void) {
    color = ${outputType}(${constant}*texture(u_texture, v_texcoord)${inputs});
}`
            );
            var result = cs.compute(ti != 'fbo' && ti != 'image' ? (n, i, j, k) => 0.25*(j*255/(cs.input.height-1) + i*255/(cs.input.width-1)) : null);
            var expected = Reflect.construct(result.constructor, [cs.output.length]);
            var getValues = function(n) {
                var m = Math.floor(n/cs.input.type.length);
                var j = Math.floor(m/cs.input.width);
                var i = m%cs.input.width;
                var v = 0.25*(j*255/(cs.input.height-1) + i*255/(cs.input.width-1));
                if (cs.input.type.base == 'UINT') v = Math.floor(v);
                v *= 2;
                if (ti == 'image' && n % 4 == 3) v = 255;
                return v;
            };
            for (var j=0; j<cs.input.originalLength; j++) {
                expected[j] = getValues(j);
            }
            test('Should return the correct values', ctx => ctx.assert(result, ':=', expected));
            cs.output.setShader(
`#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform ${samplerType}sampler2D u_texture;
out vec4 color;

void main(void) {
    color = vec4(texture(u_texture, v_texcoord)${renderInputs})/255.;
}`
            );
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            cs.output.render();
            await sleep(500);
        }        
        cs.destroy();
        webGL.shutDown();
        document.body.removeChild(img);
    }

    async function test_image_processing() {
        header('Test image processing via compute shader');
        initWebGL();
        webGL.useExtension('EXT_color_buffer_float');

        var img = (await load('./res/worldmap3.png')).node;
        var cs = new webGL.ComputeShader();
        cs.setInput(img);
        var f = 0.5;
        var shaderScript =
`#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform mediump sampler2D u_texture;
out vec4 color;

// sharpen
vec3 mf1[10] = vec3[](
    vec3( 0.0), vec3( 1.0), vec3( 1.7),
    vec3(-1.0), vec3(${f}), vec3( 1.0),
    vec3(-1.7), vec3(-1.0), vec3( 0.0),
    vec3(1.0/${f})
);

// smoothen
vec3 mf2[10] = vec3[](
    vec3( 0.7), vec3( 1.0), vec3( 0.7),
    vec3( 1.0), vec3(${f}), vec3( 1.0),
    vec3( 0.7), vec3( 1.0), vec3( 0.7),
    vec3(1.0/(${f}+6.8))
);

void main(void) {
    ivec2 texSize = textureSize(u_texture, 0);
    vec2 tc = vec2(v_texcoord.x, 1.-v_texcoord.y);
    vec2 d = 1./vec2(texSize);
    vec2 dij = vec2(-d);
    vec3 c;
    int k = 0;
    for (int j=-1; j<2; j++)
    {
        dij.x = -d.x;
        for (int i=-1; i<2; i++)
        {
           c += texture(u_texture, tc + dij).xyz * mf1[k++];
           dij.x += d.x;
        }
        dij.y += d.y;
    }
    color = vec4(c*mf1[9], 1.);
    // // invert
    // vec2 tc = vec2(v_texcoord.x, 1.-v_texcoord.y);
    // vec4 c = texture(u_texture, tc);
    // color = vec4(vec3(1.) - c.xyz, 1.);
}`;
        cs.setOutput(null);
        await cs.setShader(shaderScript);
        var result = cs.compute(null);

        gl.clearColor(0.10, 0.12, 0.20, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        await animate(
            time => {
                time % 1000 < 500 ? cs.input.render() : cs.output.render();
            }
        );
        cs.destroy();
    }

    var tests = () => [
        test_compute_shader_inputs,
        test_buffer,
        test_image_processing,
        test_simple_render        
    ];

    publish(tests, 'WebGL tests');

})();