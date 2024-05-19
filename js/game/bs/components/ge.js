include('/lib/data/map.js');
include('/lib/math/v2.js');
include('/lib/math/v3.js');
(function() {
    function Component(file, factory) {
        this.file = file;
        this.factory = factory;
        this.instances = new Map();
    }

    var ge = {
        path: '',
        factories: {},
        components: {},
        instances: {},

        resolution: new V2(),
        ratio: new V3(),
        settings: {},

        renderers: [],
        inputHandlers: [],
        actors: [],

        time: 0,
        game: null,

        frame: 0,
        fps: 0.0,
        fpsTime: 0,
        fpsHandler: () => null,

        config: {
            maxRecursion: 3
        },

        defaultComponents: {
            'SpriteManager': {
                'source': 'actor/sprite-manager.js'
            },
            'SegmentManager': {
                'source': 'actor/segment-manager.js'
            },
            'BasicMechanics': {
                'source': 'mechanics/basic-mechanics.js'
            },
            'KeyboardHandler': {
                'source': 'input/input-handler.js'
            },
            'MouseHandler': {
                'source': 'input/input-handler.js'
            }
        }
    };

    //#region Component management
    ge.loadComponent = async function loadComponent(fileName) {
        var factories = null;
        if (Object.values(this.components).find(x => x.file == fileName) == null) {
            var url = this.path + '/' + fileName;
            var res = await include(url);
            if (res.error) throw res.error;
            for (var i in res.symbols) {
                if (inherits(res.symbols[i], ge.IComponentFactory)) {
                    if (factories == null) factories = {};
                    factories[i] = this.factories[i] = Reflect.construct(res.symbols[i], []);
                    var deps = factories[i].getDependencies();
                    if (deps) {
                        for (var j=0; j<deps.length; j++) {
                            await ge.loadComponent(deps[j]);
                        }
                    }
                    var types = factories[i].getTypes();
                    for (var j=0; j<types.length; j++) {
                        this.components[types[j].name] = new Component(fileName, factories[i]);
                    }
                }
            }
        }
        return factories;
    };
    ge.getComponent = function getComponent(componentName) {
        return this.components[componentName];
    };

    ge.createInstance = async function createInstance(componentName, instanceId) {
        var res = null;
        var c = this.components[componentName];
        if (!c) {
            await this.loadComponent(this.defaultComponents[componentName].source);
            c = this.components[componentName]
        }
        if (c != undefined) {
            res = await c.factory.instantiate(this, componentName, instanceId);
            if (res != null) {
                this.instances[instanceId] = res;
                c.instances.add(instanceId, res);
                if (inherits(res, ge.Renderer)) this.renderers.push(res);
                if (inherits(res, ge.InputHandler)) this.inputHandlers.push(res);
                var args = []; for (var i=2; i<arguments.length; i++) args.push(arguments[i]);
                await res.initialize.apply(res, args);
            }
        } else throw new Error(`Component '${componentName}' does not exist!`);
        return res;
    };

    ge.getInstance = function getInstance(instanceId) {
        return this.instances[instanceId];
    };
    //#endregion

    //#region Utilities
    ge.setFpsHandler = function setFpsHandler(handler) {
        ge.fpsHandler = handler;
    };

    ge.setResolution = function setResolution(width, height) {
        this.resolution.set(width, height);
        gl.canvas.width = this.resolution.x;
        gl.canvas.height = this.resolution.y;
        this.ratio.set(width/gl.canvas.clientWidth, height/gl.canvas.clientHeight, 1);
        for (var i=0; i<this.renderers.length; i++) {
            this.renderers[i].resize();
        }
    };

    ge.onresize = function onresize(e) {
        // if fullscreen...
        ge.setResolution(gl.canvas.width, gl.canvas.height);
    };

    ge.addActor = function addActor(id) {
        var a = new ge.Actor(this, id);
        this.actors.push(a);
        return a;
    };
    //#endregion

    //#region Main loop
    ge.begin = function begin() {
        ;
    };

    ge.update = function update(dt) {
        // update actors
        for (var i=0; i<this.actors.length; i++) {
            var a = this.actors[i];
            a.ttl = 3;
            a.update(dt);
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
        if (ge.frame++ == 100) {
            ge.fpsHandler(100000/(now - ge.fpsTime));
            ge.frame = 0;
            ge.fpsTime = now;
        }
    };

    ge.run = function run(game) {
        this.time = Date.now();
        this.game = game;
        this.fpsTime = this.time;
        this.frame = 0;
        this.mainloop();
    };
    //#endregion

    // ge.onresize = function onresize(e) {
    //     Dbg.prln(gl.canvas.width);
    //     Dbg.prln(gl.canvas.height);
    // };

    var url = new Url(document.currentScript.url);
    ge.path = Url.relative(baseUrl.path, url.getPath());

    window.addEventListener('resize', ge.onresize);

    publish(ge, 'ge');
})();