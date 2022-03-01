include('/lib/glui/glui-lib.js');
include('/lib/player/player-ext.js');
include('./sprite-adapter-ext.js');

(function() {

    var _sprMgr = null;

    function update() {
        _sprMgr.update();
    }

    var totalTime = 0;
    var totalFrame = 0;
    var frame = 0;
    var isRunning = false;
    var fpsRange = 20;
    var fpsDisplay = null;
    var rafId = null;

    async function initFpsDisplay() {
        glui.initialize();
        fpsDisplay = await glui.create('fps', {
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
        fpsDisplay.setValue('00.0 fps');
    }

    function updateFpsDisplay() {
        if (frame == fpsRange) {
            var time = new Date().getTime();
            var fps = frame*1000/(time - totalTime);
            totalTime = time;
            fpsDisplay.setValue(fps.toFixed(2) + ' fps');
            fpsDisplay.render();
            frame = 0;
        }
        frame++;
        glui.repaint();
    }

    async function setup(url, count) {
        url = url || './res/fighter.spr.json';
        count = count || 100;
        if (_sprMgr == null) {
            _sprMgr = new webGL.SpriteManager();
            await _sprMgr.initialize(url, count);
        }
        await initFpsDisplay();
    }

    var _fps = 25;
    var _delta = 0;
    var _isDone = false;
    var _isStopped = false;
    var _ts = 0;
    async function run(player) {
        function _loop(ts) {
            if (!_isDone) {
                if (_ts == 0) _ts = ts;
                var fr = 1;
                var dt = (ts - _ts)/1000;
                _ts = ts;
                _delta += dt * _fps;
                if (_delta >= 1) {
                    fr = Math.trunc(_delta);
                    _delta -= fr;
                    _isDone = !player.run(fr);
                }
                _sprMgr.update(dt);
                _sprMgr.render();
            }
            totalFrame += fr;
            updateFpsDisplay();
            rafId = requestAnimationFrame(_loop);
        }
        _isStopped = false;
        _isDone = false;
        _loop(0);
        addButton('Stop', e => _isStopped = true);
        await poll( () => _isDone || _isStopped);
    }

    var frames = [0, 1, 2, 3, 2, 1];
    function animateSprites(callback) {
        if (isRunning) {
            for (var i=0; i<_sprMgr.count; i++) {
                var spr = _sprMgr.sprites[i];
                callback(spr);
            }
            _sprMgr.update();
            _sprMgr.render();
            totalFrame++;
            updateFpsDisplay();
            rafId = requestAnimationFrame(() => animateSprites(callback));
        }
    }

    async function tearDown() {
        if (rafId) cancelAnimationFrame(rafId);
        _sprMgr.destroy();
        delete _sprMgr;
        _sprMgr = null;
        glui.shutdown();
    }

    async function test_spriteManager() {
        header('Create sprite manager');
        await setup();
        test('Should have a map', context => context.assert(_sprMgr.map, '!=', null));
        test('Should have a texture', context => context.assert(_sprMgr.map.texture, '!=', null));
        tearDown();
    }

    async function test_createSprite() {
        header('Create 1 sprite');
        await setup(null, 1);
        var spr = _sprMgr.addSprite();
        var frameId = 1;
        var expectedFrame = _sprMgr.map.data.slice(6*frameId, 6*frameId+6);
        spr.setFrame(frameId);
        spr.setPosition([1, 1, 0]);
        spr.setScale([1.0, 1.0, 1.0]);
        spr.setRotationZ(0.0);
        _sprMgr.update();
        test('Should create a sprite', context => {
            context.assert(spr.ix, '=', 0);
            var data = _sprMgr.spriteAttributeData.slice(spr.ix*webGL.Sprite.AttributeSize, (spr.ix+1)*webGL.Sprite.AttributeSize);
            var expected = new Float32Array([
                spr.position.x,
                spr.position.y,
                spr.position.z,
                spr.scale.x * expectedFrame[4],
                spr.scale.y * expectedFrame[5],
                spr.rotationZ,
                spr.color[0],
                spr.color[1],
                spr.color[2],
                spr.color[3],
                expectedFrame[0],
                expectedFrame[1],
                expectedFrame[2],
                expectedFrame[3]
            ]);
            context.assert(data, ':=', expected);
        });
        tearDown();
    }

    async function test_renderSprites() {
        header('Render sprites');
        await setup(null, 20);
        var unit = (gl.canvas.width - 20)/_sprMgr.map.frames.length;
        var y = (gl.canvas.height - _sprMgr.map.frames[0][3])/2;
        for (var i=0; i<_sprMgr.map.frames.length; i++) {
            var spr = _sprMgr.addSprite();
            spr.setFrame(i);
            spr.setPosition([unit/2 + i*unit, y, 0]);
            spr.setRotationZ(0);
            spr.setScale([4.0, 4.0]);
        }
        _sprMgr.update();
        _sprMgr.render();
        await button('Next');
        tearDown();
    }
    
    async function test_transformSprites() {
        header('Transform sprites');
        await setup(null, 20);
        for (var i=0; i<_sprMgr.sprites.length; i++) {
            var spr = _sprMgr.addSprite();
            spr.setFrame(0);
            spr.setPosition(V3.fromPolar(2*Math.PI*Math.random(0), 0, Math.min(gl.canvas.width, gl.canvas.height)/10 * (Math.random() + 1.0)).add([gl.canvas.width/2, gl.canvas.height/2]));
            spr.setRotationZ(0);
            spr.setScale([1.0, 1.0]);
        }
        _sprMgr.update();
        _sprMgr.render();
        totalFrame = 0;
        
        message('translate');
        var transforms = [
            () => _sprMgr.translate(new V3(0.25*Math.sin(0.02*totalFrame), 0.2*Math.sin(0.1 + 0.03*totalFrame), 0))
        ];
        var callback = function() {
            _sprMgr.resetView();
            for (var i=0; i<transforms.length; i++) {
                transforms[i]();
            }
            _sprMgr.update();
            _sprMgr.render();
            updateFpsDisplay();
            rafId = requestAnimationFrame(callback);
            totalFrame++;
        }

        isRunning = true;
        callback();
        await button('Next');
        isRunning = false;
        cancelAnimationFrame(rafId);

        message('scale');
        transforms.push(
            () => _sprMgr.scale(new V3(1.5 * (1.1 + Math.sin(0.01*totalFrame)), 1.2*(1.2 + Math.sin(0.5 + 0.02*totalFrame)), 1))
        );

        isRunning = true;
        callback();
        await button('Next');
        isRunning = false;
        cancelAnimationFrame(rafId);

        message('rotateZ');
        transforms.push(
            () => _sprMgr.rotateZ(0.01*Math.PI*totalFrame)
        );

        isRunning = true;
        callback();
        await button('Next');
        isRunning = false;
        cancelAnimationFrame(rafId);

        tearDown();

    }

    async function test_animateSprites1() {
        header('Animate sprites #1');
        await setup();
        var unit = (gl.canvas.width - 20)/_sprMgr.map.frames.length;
        var y = (gl.canvas.height - _sprMgr.map.frames[0][3])/2;
        for (var i=0; i<_sprMgr.map.frames.length; i++) {
            var spr = _sprMgr.addSprite();
            spr.setFrame(i);
            spr.setPosition([unit/2 + i*unit, y, 0]);
            spr.setScale([2.5, 2.5, 1.0]);
            spr.setRotationZ(0);
            spr.frameId = Math.floor(3*Math.random());
        }
        isRunning = true;

        animateSprites( spr => {
            if (totalFrame % 8 == 7) {
                spr.setFrame(frames[spr.frameId]);
                spr.frameId = (spr.frameId + 1) % 3;
            }
        });
        await button('Next');
        isRunning = false;
        tearDown();
    }
    function setBall(spr) {
        spr.setFrame(Math.round(Math.random()*(_sprMgr.map.frames.length - 1)));
        spr.setPosition([gl.canvas.width/2, gl.canvas.height/2, 0]);
        var scale = 0.4*(0.4*Math.random() + 0.6);
        spr.setScale([scale, scale, 1.0]);
        spr.setRotationZ(2*Math.PI*Math.random());
        spr.velocity = V3.fromPolar(2*Math.PI*Math.random(), 0, 5*(0.6*Math.random() + 0.4));
        spr.alpha = 0.3 + 0.7*Math.random();
    }
    async function test_animateSprites2() {
        header('Animate sprites #2');
        await setup('./res/stone.spr.json', 20000);
        for (var i=0; i<_sprMgr.sprites.length; i++) {
            var spr = _sprMgr.addSprite();
            setBall(spr);
        }
        isRunning = true;
        totalIndex = 0;

        animateSprites(spr => {
            spr.setRotationZ(spr.rotationZ + 0.1);
            spr.position.add(spr.velocity);
            if (spr.position.x < 0 || spr.position.x > gl.canvas.width || spr.position.y < 0 || spr.position.y > gl.canvas.height) {
                setBall(spr);
            }
        });
        await button('Next');
        isRunning = false;
        tearDown();
    }
    async function test_animateWithPlayer() {
        header('Animate sprites with player');
        await initFpsDisplay();
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
            _sprMgr = player.adapters.find( a => a.adapter.getInfo().name == 'SpriteManager').adapter;
            _fps = 24;
            _sprMgr.updateRefreshRate(_fps);
            await run(player);
        }
        
        tearDown();
    }

    //window.onresize = () => _sprMgr.onresize();

    var tests = () => [
        // test_spriteManager,
        // test_createSprite,
        // test_renderSprites,
        // test_transformSprites,
        // test_animateSprites1,
        // test_animateSprites2,
        test_animateWithPlayer
    ];

    publish(tests, 'Sprite tests');

})();