include('glui/glui-lib.js');
include('webgl/sprite/sprite.js');

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

    async function setup(url, count) {
        url = url || 'webgl/sprite/fighter.spr.json';
        count = count || 100;
        glui.initialize();
        if (_sprMgr == null) {
            _sprMgr = new webGL.SpriteManager();
            await _sprMgr.initialize(url, count);
        }
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

    async function test_createSprites() {
        message('Create sprites', 1);
        await setup();
        var spr = _sprMgr.addSprite(0);
        var frameId = 1;
        var expectedFrame = _sprMgr.map.frames[frameId];
        spr.setFrame(frameId);
        spr.setPosition([0, 0, 0]);
        spr.setScale([0.1, 0.1, 1.0]);
        spr.setRotationZ(0.0);
        _sprMgr.update();
        test('Should create a sprite', context => {
            context.assert(spr.ix, '=', 0);
            var frame = _sprMgr.spriteAttributeData.slice(spr.ix*webGL.Sprite.AttributeSize + 16, spr.ix*webGL.Sprite.AttributeSize + 20);
            context.assert(frame, ':=', [
                expectedFrame[0]/_sprMgr.map.image.width,
                expectedFrame[1]/_sprMgr.map.image.height,
                expectedFrame[2]/_sprMgr.map.image.width,
                expectedFrame[3]/_sprMgr.map.image.height
            ]);
        });
        tearDown();
    }

    async function test_renderSprite() {
        message('Render a sprite', 1);
        await setup();
        var gap = 1.6/(_sprMgr.map.frames.length-1);
        for (var i=0; i<_sprMgr.map.frames.length; i++) {
            var spr = _sprMgr.addSprite();
            spr.setFrame(i);
            spr.setPosition([-0.8 + i*gap, 0, 0]);
            spr.setScale([0.4, 0.4, 1.0]);
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
            frame++;
        }
    };
    async function test_animateSprites1() {
        message('Animate sprites', 1);
        await setup();
        var gap = 1.6/(_sprMgr.map.frames.length-1);
        for (var i=0; i<_sprMgr.map.frames.length; i++) {
            var spr = _sprMgr.addSprite();
            spr.setFrame(i);
            spr.setPosition([-0.8 + i*gap, 0, 0]);
            spr.setScale([0.6, 0.6, 1.0]);
            spr.setRotationZ(0);
            spr.frameId = Math.floor(3*Math.random());
        }
        isRunning = true;

        animateSprites( spr => {
            if (frame % 8 == 7) {
                spr.setFrame(frames[spr.frameId]);
                spr.frameId = (spr.frameId + 1) % 3;
            }
        });
        await button('Next');
        isRunning = false;
        tearDown();
    }
    async function test_animateSprites2() {
        message('Animate sprites', 1);
        await setup('webgl/sprite/ball.spr.json', 2000);
        for (var i=0; i<_sprMgr.sprites.length; i++) {
            var spr = _sprMgr.addSprite();
            spr.setPosition([0, 0, 0]);
            spr.setScale([0.01, 0.01, 1.0]);
            spr.setRotationZ(2*Math.PI*Math.random());
            spr.velocity = V3.fromPolar(2*Math.random()*Math.PI, 0, 0.01*(0.9*Math.random() + 0.1));
        }
        isRunning = true;

        animateSprites(spr => {
            spr.setRotationZ(spr.rotationZ + 0.04);
            spr.position.add(spr.velocity);
            if (spr.position.x < -1 || spr.position.x > 1 || spr.position.y < -1 || spr.position.y > 1) {
                spr.setPosition([0, 0, 0]);
                spr.setScale([0.01, 0.01, 1.0]);
                spr.setRotationZ(2*Math.PI*Math.random());
                spr.velocity = V3.fromPolar(2*Math.random()*Math.PI, 0, 0.01*(0.9*Math.random() + 0.1));
            }
        });
        await button('Next');
        isRunning = false;
        tearDown();
    }

    var tests = () => [
        test_spriteManager,
        test_createSprites,
        test_renderSprite,
        test_animateSprites1,
        test_animateSprites2
    ];

    publish(tests, 'Sprite tests');

})();