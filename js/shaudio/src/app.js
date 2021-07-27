include('/lib/base/dbg.js');
include('sequencer.js');
include('gpu-com.js');
include('pass.js');
include('/lib/math/m44.js');
//include('gui.js');

//include('/lib/utils/syntax.js');
//include('./compiler.js');
//include('./grammar.js');


//self.DBGLVL = 2;

(function() {

    function AppState() {
        this.gpu = {
            buffers: [],
            shaders: {
                'vs': null,
                'fs': null
            }
        };
        this.sequencer = {
            sequence: null,
            position: 0
        };
        this.controls = {
            // add controls dynamically: (key=id, value=value)
        };
    }

    function App() {
        this.afHandler = null;

        this.state = new AppState();
        this.passes = [];
        this.time = 0.0;
        this.frame = 0;
    }

    App.prototype.init = async function init() {
        this.sequencer = await Sequencer.create(this);
        this.gpuCom = await GpuCom.create(this);
        //this.gui = await Gui.create(this);
        this.testSetup();
    };

    App.prototype.run = function run() {
        this.mainloop();
    };

    App.prototype.stop = function stop() {
        cancelAnimationFrame(this.afHandler);
    };

    App.prototype.mainloop = function mainloop() {
        var now = new Date().getTime();
        var delta = now - this.time;
        // inputs

        // update
        this.sequencer.update(delta);
        for (var i=0; i<this.passes.length; i++) {
            this.passes[i].update(delta);
        }

        // render
        for (var i=0; i<this.passes.length; i++) {
            this.passes[i].render(delta);
        }

        this.afHandler = requestAnimationFrame(App.mainloop);
        this.time = now;
    };

    App.prototype.test = async function test() {
        webGL.init(null, true);

        var r22 = 0.5*Math.sqrt(2);
        var vertices = new Float32Array([
            -0.5, 0.0, -0.5,   0.5, 0.0, -0.5,   0.0,  r22, 0.0,
             0.5, 0.0, -0.5,   0.5, 0.0,  0.5,   0.0,  r22, 0.0,
             0.5, 0.0,  0.5,  -0.5, 0.0,  0.5,   0.0,  r22, 0.0,
            -0.5, 0.0,  0.5,  -0.5, 0.0, -0.5,   0.0,  r22, 0.0,
             0.5, 0.0, -0.5,  -0.5, 0.0, -0.5,   0.0, -r22, 0.0,
             0.5, 0.0,  0.5,   0.5, 0.0, -0.5,   0.0, -r22, 0.0,
            -0.5, 0.0,  0.5,   0.5, 0.0,  0.5,   0.0, -r22, 0.0,
            -0.5, 0.0, -0.5,  -0.5, 0.0,  0.5,   0.0, -r22, 0.0

        ]);

        // create Vertex Array Object
        var vao = gl.createVertexArray();
        // work with the vao
        gl.bindVertexArray(vao);
        // create Vertex Buffer Object to hold vertex coordinates
        var vbo = webGL.createBuffer(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // build shader program
        var shaders = {};
        var res = await load(['res/test.vs', 'res/test.fs']);
        shaders[gl.VERTEX_SHADER] = res[0].data;
        shaders[gl.FRAGMENT_SHADER] = res[1].data;
        var uniforms = {
            u_viewProjection: { type:webGL.FLOAT4x4M, size:16, value:new Float32Array(16) },
            u_model: { type:webGL.FLOAT4x4M, size:16, value:new Float32Array(16) }
        };
        var prg = webGL.createProgram(shaders,
            { a_position: { type:webGL.FLOAT, size:3, buffer:0 } },
            uniforms
        );

        var fov = Math.PI*60/180;
        var aspect = gl.canvas.width/gl.canvas.height;
        var zNear = 0;
        var zFar = 100;
        M44.perspective(fov, aspect, zNear, zFar, uniforms.u_viewProjection.value);
        var m44 = M44.rotateY(0.8)
            .mul(M44.translate([0.0, 0.0, -2.0]));
        m44.put(uniforms.u_model.value);

        // render
        gl.clearColor(0.0625, 0.09375, 0.125, 1.0);
        //gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CW);
        gl.cullFace(gl.BACK);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        webGL.useProgram(prg);
        prg.updateUniform('u_viewProjection');

        var isDone = false;
        var frames = 0;
        var start = 0;
        var elapsed = 0;
        var lastTime = 0;
        var hraf = null;
        var animate = time => {
            if (start == 0) {
                lastTime = start = time;
            }
            else {
                elapsed = time - start;
                //var dt = time - lastTime;
                //lastTime = time;
                //M44.perspective(fov, aspect, zNear, zFar, uniforms.u_viewProjection.value);
                var rotY = M44.rotateY(2.0*elapsed*Math.PI/4000);
                var rotX = M44.rotateX(Math.PI/12); 
                var m44 = rotY.mul(rotX)
                    .mul(M44.translate([0.0, 0.1, -2.0]));
                m44.put(uniforms.u_model.value);
                prg.updateUniform('u_model');
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 32);
                frames++;
            }
            if (elapsed < 8000) hraf = requestAnimationFrame(animate);
            else isDone = true;
        };

        hraf = requestAnimationFrame(animate);

        await poll( () => isDone);
        cancelAnimationFrame(hraf);
        console.log('Done: ' + frames);
        
        // cleanup
        gl.useProgram(null);
        gl.disableVertexAttribArray(0);
        //gl.disableVertexAttribArray(1);
        prg.destroy();
        gl.deleteBuffer(vbo);
        gl.deleteVertexArray(vao);
    };

    App.prototype.testCompute = async function testCompute() {
        webGL.init(null, true);
        webGL.useExtension('EXT_color_buffer_float');

        function createDataBuffer(cols, rows) {
            var buffer = {
                data: new Float32Array(cols*rows),
                texture: gl.createTexture()
            };
            gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
            //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, dataSize[0], dataSize[1], 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, input.data, 0);
            //gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, dataSize[0], dataSize[1], 0, gl.RED_INTEGER, gl.UNSIGNED_INT, input.data, 0);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, cols, rows, 0, gl.RED, gl.FLOAT, buffer.data, 0);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            return buffer;    
        }

        //#region setup data
        var cols = 4, rows = 4;
        var input = createDataBuffer(cols, rows);
        for (var i=0; i<input.data.length; i++) {
            input.data[i] = i;
        }
        var output = createDataBuffer(cols, rows);
        //#endregion

        //#region setup framebuffer, vertex buffer and program
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output.texture, 0);

        // create 2 triangle "canvas" 
        var vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,   1.0, 1.0,  -1.0, 1.0 ]), gl.STATIC_DRAW);
        //var vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ 0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  0.0, 1.0 ]), gl.STATIC_DRAW);

        // build shader program
        var shaders = {};
        var res = await load(['res/flat.vs', 'res/compute1.fs']);
        shaders[gl.VERTEX_SHADER] = res[0].data;
        shaders[gl.FRAGMENT_SHADER] = res[1].data;
        var uniforms = {};
        var prg = webGL.createProgram(shaders,
            {
                a_position: { type:webGL.FLOAT, size:2, buffer:0 }
            },
            uniforms
        );
        //#endregion

        //#region render to do calculations
        gl.viewport(0, 0, cols, rows);
        gl.clearColor(2, 2, 3, 1);
        webGL.useProgram(prg);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindTexture(gl.TEXTURE_2D, input.texture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        //#endregion

        // read data
        var results = new Float32Array(cols*rows);
        //gl.readPixels(0, 0, dataSize[0], dataSize[1], gl.RGBA_INTEGER, gl.UNSIGNED_INT, result.data);
        //gl.readPixels(0, 0, dataSize[0], dataSize[1], gl.RED_INTEGER, gl.UNSIGNED_INT, result.data);
        gl.readPixels(0, 0, cols, rows, gl.RED, gl.FLOAT, results);
console.log(results)

        for (var i=0; i<input.data.length; i++) {
            if (input.data[i] != results[i]) console.log(`Mismatch at ${i}: expected ${input.data[i]}, received ${results[i]}`)
        }

        //#region clean up
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(null);
        prg.destroy();
        gl.deleteTexture(input.texture);
        gl.deleteTexture(output.texture);
        gl.deleteBuffer(vbo);
        gl.deleteFramebuffer(fbo);
        //#endregion
    };

    publish(App, 'App');
})();