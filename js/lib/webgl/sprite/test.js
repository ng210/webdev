include('/lib/glui/glui-lib.js');
include('./sprite.js');
include('./sprite-manager.js');

(function() {

    var _sprMgr = null;
    var _screen = new glui.Buffer(window.innerWidth, window.innerHeight, true);
    document.body.appendChild(_screen.canvas);
    _screen.canvas.style.position = 'absolute';
    _screen.canvas.style.left = '0px';
    _screen.canvas.style.top = '0px';
    gl = _screen.canvas.getContext('webgl');
    if (gl == null) throw new Error('webGL not supported!');

    function update() {
        _sprMgr.update();
    }

    var totalTime = 0;
    var totalFrame = 0;
    var fpsRange = 20;
    var fpsDisplay = null;
    async function setup(url, count) {
        url = url || './res/fighter.spr.json';
        count = count || 100;
        glui.initialize();
        glui.canvas.style.position = 'absolute';
        glui.canvas.style.width = '10vw';
        glui.canvas.style.height = '10vh';
        glui.canvas.style.left = '90vw';
        glui.canvas.style.top = '0px';
        glui.canvas.style.opacity = 0.5;
        if (_sprMgr == null) {
            _sprMgr = new webGL.SpriteManager();
            await _sprMgr.initialize(url, count);
        }
        fpsDisplay = await glui.create('fps', {
            'type':'Label',
            'style': {
                'font': 'Arial 24',
                'background-color': '#406050',
                'border': 'none',
                'color': '#80c0a0',
                'width':'8em', 'height': '1.4em',
                'top': '1em', 'left': '0px',
                'align': 'center middle'
            }
        });
        fpsDisplay.setValue('00.0 fps');
    }

    async function tearDown() {
        _sprMgr.destroy();
        delete _sprMgr;
        _sprMgr = null;
        glui.shutdown();
    }

    async function test_spriteManager() {
        message('Create sprite manager', 1);
        await setup();
        test('Should have a map', context => context.assert(_sprMgr.map, '!=', null));
        test('Should have a texture', context => context.assert(_sprMgr.map.texture, '!=', null));
    }

    async function test_createSprite() {
        message('Create 1 sprite', 1);
        await setup();
        var spr = _sprMgr.addSprite(0);
        var frameId = 1;
        var expectedFrame = _sprMgr.map.data.slice(6*frameId, 6*frameId+6);
        spr.setFrame(frameId);
        spr.setPosition([10, 20, 1.0]);
        spr.setScale([0.5, 0.5, 1.0]);
        spr.setRotationZ(1.57);
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
        message('Render sprites', 1);
        await setup();
        var unit = (gl.canvas.width - 20)/_sprMgr.map.frames.length;
        var y = (gl.canvas.height - _sprMgr.map.frames[0][3])/2;
        for (var i=0; i<_sprMgr.map.frames.length; i++) {
            var spr = _sprMgr.addSprite();
            spr.setFrame(i);
            spr.setPosition([unit/2 + i*unit, y, 0]);
            spr.setRotationZ(0);
        }
        _sprMgr.update();
        _sprMgr.render();
        await button('Next');
        tearDown();
    }

    var frame = 0;
    var isRunning = false;
    var frames = [0, 1, 2, 3, 2, 1];
    function animateSprites(callback) {
        if (isRunning) {
            for (var i=0; i<_sprMgr.count; i++) {
                var spr = _sprMgr.sprites[i];
                callback(spr);
            }
            _sprMgr.update();
            _sprMgr.render();

            requestAnimationFrame(() => animateSprites(callback));

            totalFrame++;
            // update fps
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
    };
    async function test_animateSprites1() {
        message('Animate sprites #1', 1);
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
        var scale = 0.1*(0.4*Math.random() + 0.6);
        spr.setScale([scale, scale, 1.0]);
        spr.setRotationZ(2*Math.PI*Math.random());
        spr.velocity = V3.fromPolar(2*Math.PI*Math.random(), 0, 5*(0.6*Math.random() + 0.4));
        spr.alpha = 0.3 + 0.7*Math.random();
    }
    async function test_animateSprites2() {
        message('Animate sprites #2', 1);
        await setup('./res/stone.spr.json', 50000);
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
        message('Animate sprites with player', 1);
        await setup('./res/dexter.spr.json', 10);

        tearDown();
    }

    window.onresize = () => _sprMgr.onresize();

    var tests = () => [
        test_spriteManager,
        test_createSprite,
        test_renderSprites,
        test_animateSprites1,
        test_animateSprites2,
        // test_animateWithPlayer
    ];

    publish(tests, 'Sprite tests');

})();