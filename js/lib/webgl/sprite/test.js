include('/lib/glui/glui-lib.js');
include('/lib/player/player-ext.js');
include('./sprite-adapter-ext.js');

(function() {

    var _sprMgr = null;

    function update() {
        _sprMgr.update();
    }

    //#region FPS Display
    function FpsDisplay() {
        this.fpsDisplay = null;
        this.fpsRange = 20;
        this.time = 0;
        this.frameCount = 0;
    }
    FpsDisplay.prototype.initialize = async function initialize() {
        this.fpsDisplay = await glui.create('fps', {
            'type':'Label',
            'style': {
                'font': 'Arial 24',
                'background-color': '#406050',
                'border': 'none',
                'color': '#80c0a0',
                'width':'8em', 'height': '1.4em',
                'top': '1em', 'left': '8em',
                'align': 'center middle'
            }
        });
        this.fpsDisplay.setValue('00.0 fps');
    };
    
    FpsDisplay.prototype.update = function update(dt) {
        if (this.frameCount == this.fpsRange) {
            var time = new Date().getTime();
            var fps = this.frameCount*1000/(time - this.time);
            this.time = time;
            this.fpsDisplay.setValue(fps.toFixed(2) + ' fps');
            this.fpsDisplay.render();
            this.frameCount = 0;
        }
        this.frameCount++;
    };

    FpsDisplay.prototype.render = function render() {
        this.fpsDisplay.render();
        glui.repaint();
    };
    //#endregion

    //#region Playback
    function Playback() {
        this.fps = 0;
        this.rfps = 0;
        this.frame = 0;
        this.isDone = false;
        this.isStopped = false;

        this.updaters = [];
        this.renderers = [];

        this.player = null;

        this.delta = 0;
        this.ts = 0;

        this.setFps(25);
    }

    Playback.prototype.destroy = function destroy() {
        cancelAnimationFrame(this.rafId);
    };

    Playback.prototype.setFps = function setFps(fps) {
        this.fps = fps;
        this.rfps = 1/fps;
        if (this.player) {
            this.player.setRefreshRate(fps);
        }
    };

    Playback.prototype.loop = function loop(ts) {
        if (!this.isDone && !this.isStopped) {
            if (this.ts == 0) this.ts = ts;
            var fr = 1;
            var dt = (ts - this.ts)/1000;
            if (dt > this.rfps) dt = 0;
            this.ts = ts;
            this.delta += dt * this.fps;
            if (this.delta >= 1) {
                fr = Math.trunc(this.delta);
                this.delta -= fr;
                if (this.player) {
                    this.isDone = !this.player.run(fr);
                }
            }
            for (var i=0; i<this.updaters.length; i+=2) {
                var ui = this.updaters[i];
                var args = this.updaters[i+1];
                ui.update.call(ui, dt, args);
            }
            for (var i=0; i<this.renderers.length; i+=2) {
                var ri = this.renderers[i];
                var args = this.renderers[i+1];
                ri.render.call(ri, args);
            }
        }
        this.frame += fr;
        this.rafId = requestAnimationFrame(ts => this.loop(ts));
    };

    Playback.prototype.run = function run() {
        this.isStopped = false;
        this.isDone = false;
        this.loop(0);
    };

    Playback.prototype.stop = function stop() {
        this.isStopped = true;
    };

    Playback.prototype.setPlayer = function setPlayer(player) {
        this.player = player;
        for (var i=0; i<player.adapters.length; i++) {
            var ai = player.adapters[i].adapter;
            if (typeof ai.update === 'function') this.addUpdater(ai);
            if (typeof ai.render === 'function') this.addRenderer(ai);
        }
    };

    Playback.prototype.addUpdater = function addUpdater(updater, args) {
        this.updaters.push(updater, args);
    };

    Playback.prototype.addRenderer = function addRenderer(renderer, args) {
        this.renderers.push(renderer, args);
    };
    //#endregion

    async function setup(url, count) {
        url = url || './res/fighter.spr.json';
        count = count || 100;
        var sprMgr = new webGL.SpriteManager();
        await sprMgr.initialize(url, count);
        return sprMgr;
    }

    async function tearDown(sprMgr) {
        if (sprMgr) {
            sprMgr.destroy();
            delete sprMgr;
        }
        if (glui.screen) glui.shutdown();
    }


    //#region Tests
    async function test_spriteManager() {
        header('Create sprite manager');
        var sprMgr = await setup();
        test('Should have a map', context => context.assert(sprMgr.map, '!=', null));
        test('Should have a texture', context => context.assert(sprMgr.map.texture, '!=', null));
        tearDown();
    }

    async function test_createSprite() {
        header('Create 1 sprite');
        var sprMgr = await setup(null, 1);
        var spr = sprMgr.addSprite();
        spr.show(true);
        var frameId = 1;
        var expectedFrame = sprMgr.map.data.slice(6*frameId, 6*frameId+6);
        spr.setFrame(frameId);
        spr.setPosition([1, 2, 0]);
        spr.setScale([1.0, 1.0, 1.0]);
        spr.setRotationZ(0.0);
        sprMgr.update();
        test('Should create a sprite', context => {
            context.assert(spr.ix, '=', 0);
            var data = sprMgr.spriteAttributeData.slice(spr.ix*webGL.Sprite.AttributeSize, (spr.ix+1)*webGL.Sprite.AttributeSize);
            var pos = spr.getPosition();
            var sca = spr.getScale();
            var col = spr.getColor();
            var expected = new Float32Array([
                pos.x,
                pos.y,
                pos.z,
                sca.x * expectedFrame[4],
                sca.y * expectedFrame[5],
                spr.getRotationZ(),
                col.x,
                col.y,
                col.z,
                col.w,
                expectedFrame[0],
                expectedFrame[1],
                expectedFrame[2],
                expectedFrame[3]
            ]);
            context.assert(data, ':=', expected);
        });
        tearDown(sprMgr);
    }

    async function test_renderSprites() {
        header('Render sprites');
        var sprMgr = await setup(null, 20);
        var unit = (gl.canvas.width - 20)/sprMgr.map.frames.length;
        var y = (gl.canvas.height - sprMgr.map.frames[0][3])/2;
        for (var i=0; i<sprMgr.map.frames.length; i++) {
            var spr = sprMgr.addSprite();
            spr.show(true);
            spr.setFrame(i);
            spr.setPosition([unit/2 + i*unit, y, 0]);
            spr.setRotationZ(0);
            spr.setScale([4.0, 4.0]);
            spr.setColor([1,1,1,1]);
        }
        sprMgr.update();
        sprMgr.render();
        await button('Next');
        tearDown(sprMgr);
    }
    
    async function test_transformSprites() {
        header('Transform sprites');
        var sprMgr = await setup('./res/test.spr.json', 20);
        for (var i=0; i<sprMgr.sprites.length; i++) {
            var spr = sprMgr.addSprite();
            spr.setFrame(0);
            spr.setPosition(V3.fromPolar(2*Math.PI*Math.random(0), 0, Math.min(gl.canvas.width, gl.canvas.height)/10 * (Math.random() + 1.0)).add([gl.canvas.width/2, gl.canvas.height/2, 0]));
            spr.setRotationZ(0);
            spr.setScale([1.0, 1.0]);
            spr.setColor([1,1,1,1]);
            spr.show(true);
        }
        sprMgr.update();
        sprMgr.render();

        var transforms = [ frame => sprMgr.translate(new V3(0.25*Math.sin(0.02*frame), 0.2*Math.sin(0.1 + 0.05*frame), 0)) ];

        glui.initialize();
        var fpsDisplay = new FpsDisplay();
        await fpsDisplay.initialize();
        var playback = new Playback();
        playback.setFps(24);
        playback.addUpdater( {
            'update': function(dt, args) {
                sprMgr.resetView();
                for (var i=0; i<transforms.length; i++) {
                    transforms[i](playback.frame);
                }
            }
        }, playback);
        playback.addUpdater(sprMgr, playback);
        playback.addRenderer(sprMgr);
        playback.addUpdater(fpsDisplay, playback);
        playback.addRenderer(fpsDisplay);
        playback.run();

        message('translate');
        await button('Next');

        transforms.push( frame => sprMgr.scale(new V3(1.5 * (1.1 + Math.sin(0.01*frame)), 1.2*(1.2 + Math.sin(0.5 + 0.02*frame)), 1)) );
        message('scale');
        await button('Next');

        transforms.push( frame => sprMgr.rotateZ(0.01*Math.PI*frame) );
        message('rotate');
        await button('Stop');
        playback.stop();
        playback.destroy();
        tearDown(sprMgr);
    }

    async function test_animateSprites1() {
        header('Animate sprites #1');
        var sprMgr = await setup();
        var unit = (gl.canvas.width - 20)/sprMgr.map.frames.length;
        var y = (gl.canvas.height - sprMgr.map.frames[0][3])/2;
        for (var i=0; i<sprMgr.map.frames.length; i++) {
            var spr = sprMgr.addSprite();
            spr.setFrame(i);
            spr.setPosition([unit/2 + i*unit, y, 0]);
            spr.setScale([8.0, 8.0, 1.0]);
            spr.setRotationZ(0);
            spr.setColor([1,1,1,1]);
            spr.show(true);
            spr.frameId = Math.floor(3*Math.random());
        }

        glui.initialize();
        var fpsDisplay = new FpsDisplay();
        await fpsDisplay.initialize();
        var playback = new Playback();
        playback.setFps(24);
        sprMgr.updateSprite = function(spr) {
            if (playback.frame % 8 == 7) {
                spr.setFrame((spr.frame + 1) % 3);
            }
            webGL.SpriteManager.prototype.updateSprite.call(sprMgr, spr);
        };
        playback.addUpdater(sprMgr, playback);
        playback.addRenderer(sprMgr);
        playback.addUpdater(fpsDisplay, playback);
        playback.addRenderer(fpsDisplay);

        playback.run();
        await button('Stop');
        playback.stop();
        playback.destroy();
        tearDown(sprMgr);
    }

    function Ball(sprMgr) {
        Ball.base.constructor.call(this, sprMgr);
        this.reset();
    }
    extend(webGL.Sprite, Ball);

    Ball.prototype.reset = function reset() {
        this.setFrame(Math.round(Math.random()*(this.sprMgr.map.frames.length - 1)));
        this.setPosition([gl.canvas.width/2, gl.canvas.height/2, 0]);
        var scale = 0.01;
        this.setScale([scale, scale, 1.0]);
        this.setRotationZ(2*Math.PI*Math.random());
        this.linearVelocity = V3.fromPolar(2*Math.PI*Math.random(), 0, 5*(0.6*Math.random() + 0.4));
        this.angularVelocity = 0.1*2*Math.PI*Math.random();
        var col = V3.fromPolar(2*Math.PI*Math.random(), 2*Math.PI*Math.random(), 0.5*(1+Math.random()));
        var sh = 0.2*(1 + Math.random());
        this.setColor([col.x+sh, col.y+sh, col.z+sh, 1]);
        this.show(true)
    }

    async function test_animateSprites2() {
        header('Animate sprites #2');
        var sprMgr = await setup('./res/test.spr.json', 10000);
        for (var i=0; i<sprMgr.sprites.length; i++) {
            var spr = sprMgr.addSprite(Ball);
            spr.reset(sprMgr);
        }

        glui.initialize();
        var fpsDisplay = new FpsDisplay();
        await fpsDisplay.initialize();
        var playback = new Playback();
        playback.setFps(24);
        var screenSize = new V3([gl.canvas.width, gl.canvas.height, 0]);
        var center = screenSize.prodC(0.5);
        sprMgr.updateSprite = function(spr) {
            spr.setRotationZ(spr.getRotationZ() + spr.angularVelocity);
            var p = spr.getPosition().add(spr.linearVelocity);
            if (p.x < 0 || p.x > screenSize.x || p.y < 0 || p.y > screenSize.y) {
                spr.reset(sprMgr);
            } else {
                spr.setPosition(p);
                var d = p.diff(center);
                var f = d.len/center.len;
                spr.setAlpha(1.0 - f);
                f += 0.1;
                var s = 2*f*f;
                spr.setScale([s, s, 1]);
            }
            webGL.SpriteManager.prototype.updateSprite.call(sprMgr, spr);
        };
        playback.addUpdater(sprMgr, playback);
        playback.addRenderer(sprMgr);
        playback.addUpdater(fpsDisplay, playback);
        playback.addRenderer(fpsDisplay);

        playback.run();
        await button('Stop');
        playback.stop();
        playback.destroy();
        tearDown(sprMgr);
    }
    async function test_animateWithPlayer() {
        header('Animate sprites with player');
        Ps.Player.registerAdapter(Ps.Player);
        Ps.Player.registerAdapter(webGL.SpriteManager);
        var res = await load('./res/dexter.ssng')
        if (res.error) throw res.error;
        var player = await Ps.Player.create();
        var results = null;
        await measure('import script', async function() { results = await player.importScript(res.data) }, 1);
        test('Should load script successfully', ctx => {
            ctx.assert(results, '!null');
            if (results != null) {
                ctx.assert(results, 'empty');
                for (var i=0; i<results.length; i++) {
                    message(results[i]);
                }
                if (player.sequences.length > 0) {
                    ctx.assert(player.adapters.length, '=', 2);
                    ctx.assert(player.sequences.length, '=', 8);
                    ctx.assert(player.datablocks.length, '=', 2);
                }
            }
        });
        if (results.length == 0) {
            glui.initialize();
            var fpsDisplay = new FpsDisplay();
            await fpsDisplay.initialize();
            var playback = new Playback();
            playback.setPlayer(player);
            playback.setFps(24);
            playback.addUpdater(fpsDisplay, playback);
            playback.addRenderer(fpsDisplay);
            playback.run();
            var btn = addButton('Stop', e => playback.stop());
            await poll( () => playback.isDone || playback.isStopped);
            btn.parentNode.removeChild(btn);
            playback.destroy();
        }

        var sprMgr = player.adapters.find(a => a.adapter.getInfo().id == webGL.SpriteManager.getInfo().id).adapter;
        tearDown(sprMgr);
    }
    //#endregion

    //window.onresize = () => _sprMgr.onresize();

    var tests = () => [
        test_spriteManager,
        test_createSprite,
        test_renderSprites,
        test_transformSprites,
        test_animateSprites1,
        test_animateSprites2,
        test_animateWithPlayer
    ];

    publish(tests, 'Sprite tests');

})();