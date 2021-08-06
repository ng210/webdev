include('/lib/base/dbg.js');
include('sequencer.js');
include('gpu-com.js');
include('pass.js');
include('/lib/math/m44.js');
include('/lib/webgl/compute-shader.js');
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

        var vertices = new Float32Array([
            -0.5, 0.0, -0.5,   0.5, 0.0, -0.5,   0.0,  0.7, 0.0,
             0.5, 0.0, -0.5,   0.5, 0.0,  0.5,   0.0,  0.7, 0.0,
             0.5, 0.0,  0.5,  -0.5, 0.0,  0.5,   0.0,  0.7, 0.0,
            -0.5, 0.0,  0.5,  -0.5, 0.0, -0.5,   0.0,  0.7, 0.0,
             0.5, 0.0, -0.5,  -0.5, 0.0, -0.5,   0.0, -0.7, 0.0,
             0.5, 0.0,  0.5,   0.5, 0.0, -0.5,   0.0, -0.7, 0.0,
            -0.5, 0.0,  0.5,   0.5, 0.0,  0.5,   0.0, -0.7, 0.0,
            -0.5, 0.0, -0.5,  -0.5, 0.0,  0.5,   0.0, -0.7, 0.0
        ]);
        // create Vertex Array Object
    //var vao = gl.createVertexArray();
        // work with the vao
    //gl.bindVertexArray(vao);
        // create Vertex Buffer Object to hold vertex coordinates
        var vbo = webGL.createBuffer(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // build shader program
        var shaders = {};
        var res = await load(['res/test.vs', 'res/test.fs']);
        shaders[gl.VERTEX_SHADER] = res[0].data;
        shaders[gl.FRAGMENT_SHADER] = res[1].data;
        var prg = webGL.createProgram(shaders);
        // set view-projection matrix
        var fov = Math.PI*60/180;
        var aspect = gl.canvas.width/gl.canvas.height;
        var zNear = 0;
        var zFar = 100;
        var viewProjection = new Float32Array(16);
        M44.perspective(fov, aspect, zNear, zFar, viewProjection);
        prg.setUniform('u_viewProjection', viewProjection);
        // set model matrix
        var model = new Float32Array(16);
        M44.rotateY(0.8).mul(M44.translate([0.0, 0.0, -2.0]), model);
        prg.setUniform('u_model', model);

        // render
        gl.clearColor(0.0625, 0.09375, 0.125, 1.0);
        gl.enable(gl.DEPTH_TEST);
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
                var model =
                    M44.rotateY(2.0*elapsed*Math.PI/4000)
                    .mul(M44.rotateX(Math.PI/12))
                    .mul(M44.translate([0.0, 0.1, -2.0]));
                prg.setUniform('u_model', model);
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
    //gl.deleteVertexArray(vao);
    };

    publish(App, 'App');
})();