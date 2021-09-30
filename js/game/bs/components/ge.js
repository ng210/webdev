include('/lib/math/v2.js');
(function() {
    var ge = {
        // repository
        components: {},
        resolution: new V2(),
        ratio: new V2(),
        settings: {},
        renderers: [],
        actors: [],
        inputHandlers: [],

        time: 0,
        game: null
    };

    ge.loadComponent = async function loadComponent(id, args) {
        if (this.components[id] == undefined) {
            var fn = ge[id];
            var c = Reflect.construct(fn, [this]);
            args = args || [];
            if (c && typeof c.initialize === 'function') {
                await c.initialize.call(c, this, ...args);
            }
            if (inherits(c, ge.Renderer)) this.renderers.push(c);
            if (inherits(c, ge.InputHandler)) this.inputHandlers.push(c);
            c.engine = ge;
            this.components[id] = c;
        }
        return this.components[id];
    };

    ge.getComponent = function getComponent(id) {
        return this.components[id];
    };

    ge.addActor = function addActor(id) {
        var a = new ge.Actor(id);
        this.actors.push(a);
        return a;
    };

    ge.setResolution = function setResolution(width, height) {
        this.resolution.set(width, height);
        gl.canvas.width = this.resolution.x;
        gl.canvas.height = this.resolution.y;
        this.ratio.set(width/gl.canvas.clientWidth, height/gl.canvas.clientHeight);
        for (var i=0; i<this.renderers.length; i++) {
            this.renderers[i].resize();
        }
    };

    ge.onresize = function onresize(e) {
        // if fullscreen...
        ge.setResolution(gl.canvas.width, gl.canvas.height);
    };

    ge.begin = function begin() {
        ;
    };

    ge.update = function update(dt) {
        // update actors
        for (var i=0; i<this.actors.length; i++) {
            this.actors[i].update(dt);
        }
    };

    ge.prerender = function prerender() {
        for (var i=0; i<this.renderers.length; i++) {
            this.renderers[i].prerender();
        }
    };

    ge.render = function render() {
        gl.viewport(0, 0, this.resolution.x, this.resolution.y);
        if (this.settings.backgroundColor) {
            gl.clearColor(...this.settings.backgroundColor);
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (var i=0; i<this.renderers.length; i++) {
            this.renderers[i].render();
        }
    };

    ge.end = function end() {
        // update input handlers
        for (var i=0; i<this.inputHandlers.length; i++) {
            this.inputHandlers[i].update();
        }
    };

    ge.mainloop = function mainloop() {
        var now = Date.now();
        var dt = now - ge.time;
        if (dt > 20) dt = 20;
        ge.begin();
        ge.game.handleInputs();
        ge.game.update();
        ge.update(dt);
        ge.render(dt);
        ge.end();
        ge.time = now;
        requestAnimationFrame(ge.mainloop);
        ge.end();
    };

    ge.run = function run(game) {
        this.time = Date.now();
        this.game = game;
        this.mainloop();
    };

    // ge.onresize = function onresize(e) {
    //     Dbg.prln(gl.canvas.width);
    //     Dbg.prln(gl.canvas.height);
    // };

    window.addEventListener('resize', ge.onresize);

    publish(ge, 'ge');
})();