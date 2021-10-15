include('/lib/base/dbg.js');
include('/lib/math/noise.js');
include('./components/ge.js');

const MAX_BALL_COUNT = 2000;

var game = null;

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function Game() {
    this.spriteManager = null;
    this.segmentManager = null;

    this.time = 0;
    this.borders = [0, 0, 0, 0];
    this.center = null;
    this.noise = null;

    this.frame = 100;
    this.segments = [];
    this.selectedBall = null;

    this.isAddingBall = false;

    this.ballId = 0;
}

Game.prototype.init = async function init() {
    Dbg.prln('Initialization');

    //#region Components and instances
    await ge.loadComponent('sprite-manager.js');
    this.spriteManager = await ge.createInstance('SpriteManager', 'sprmgr1', './res/balls.spr.json', MAX_BALL_COUNT);

    await ge.loadComponent('segment-manager.js');
    this.segmentManager = await ge.createInstance('SegmentManager', 'segmgr1');

    await ge.loadComponent('simple-mechanics.js');
    await ge.createInstance('SimpleMechanics', 'sm1');

    await ge.loadComponent('input-handler.js');
    this.keyboardHandler = await ge.createInstance('KeyboardHandler', 'kbhandler1');
    this.mouseHandler = await ge.createInstance('MouseHandler', 'mousehandler1');

    await ge.loadComponent('actor.js');
    Dbg.prln('Components loaded.');
    //#endregion

    this.noise = new Noise(20081028);

    // setup screen
    var fpsDisplay = document.getElementById('fps');
    ge.setFpsHandler(fps => fpsDisplay.innerHTML = ('    '+fps.toFixed(2)).slice(-6));
    this.setResolution(1920, 1080);
    ge.settings.backgroundColor = [0.85, 0.90, 1.0, 1.0];
    ge.prerender();
};

Game.prototype.createCircleSegments = function createCircleSegments(center, w, h, count, isOutside) {
    var segments = [];
    var d = 2*Math.PI/count;
    var a = 0;
    var p0 = p1 = null;
    for (var i=0; i<count; i++) {
        var n = this.noise.fbm1d(a, 3, 1.0, 1.5, 0.37, 2.91);
        var p = V2.fromPolar(a, Fn.lerp(1, n, 0.5)).mul([w, h]).add(center);    //new V2(w*Math.cos(a), h*Math.sin(a)).add(center);
        if (p1 != null) {
            var p2 = p;
            if (isOutside) {
                segments.push(new Segment(p2, p1))
            } else {
                segments.push(new Segment(p1, p2))
            }
            p1 = p2;
        } else {
            p0 = p1 = p;
        }
        a += d;
    }
    if (isOutside) {
        segments.push(new Segment(p0, p1));
    } else {
        segments.push(new Segment(p1, p0));
    }
    return segments;
};

Game.prototype.createSegments = function createSegments(w, h) {
    var segments = [];
    this.center = new V2(w/2, h/2);
    var bl = new V2(this.frame, this.frame);
    var tl = new V2(this.frame, h-this.frame);
    var tr = new V2(w-this.frame, h-this.frame);
    var br = new V2(w-this.frame, this.frame);
    this.borders[0] = bl.x; this.borders[1] = bl.y;
    this.borders[2] = tr.x; this.borders[3] = tr.y;
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.2, 0.3]), 0.05*w, 0.08*h, 3, true));
    //this.segments.push(...this.createCircleSegments(this.center, 0.2*w, 0.2*h, 24, true));
    segments.push(...this.createCircleSegments(this.center, 0.3*w, 0.3*h, 36, true));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.8, 0.3]), 0.05*w, 0.08*h, 5, true));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.2, 0.7]), 0.02*w, 0.08*h, 12, true));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.8, 0.7]), 0.10*w, 0.10*h, 6, true));
    segments.push(
        new Segment(bl, br),        // bottom
        new Segment(br, tr),        // right
        new Segment(tr, tl),        // top
        new Segment(tl, bl)         // left
    );

    this.segmentManager.clearSegments();
    this.segmentManager.addSegments(segments);
};

Game.prototype.setResolution = function setResolution(w, h) {
    ge.setResolution(w, h);
    this.createSegments(w, h);
};

//#region Callbacks for the GE framework
Game.prototype.handleInputs = function handleInputs() {

    function toggleBall(spr) {
        var a = spr.actor;
        this.selectedBall = a;
        a.isActive = !a.isActive;
    }

    var mpos = this.mouseHandler.position;
    if (mpos.x > this.borders[0] && mpos.x < this.borders[2] && mpos.y > this.borders[1] && mpos.y < this.borders[3]) {
        // place ball
        if (!this.isAddingBall && (this.keyboardHandler.isPressed(32) || this.mouseHandler.isLeftDown())) {
            if (this.spriteManager.sprMgr.selectRadius(mpos.x, mpos.y, 10, toggleBall) == 0) {
                this.isAddingBall = true;
                this.selectedBall = this.addBall(mpos, [0, 0]);
                this.selectedBall.isActive = false;
            }
        }

        // shoot ball
        if (this.isAddingBall && (this.keyboardHandler.isReleased(32) || this.mouseHandler.isLeftReleased())) {
            var v = this.selectedBall.current.position.diff(mpos).scale(0.004);
            this.selectedBall.setCurrent('velocity', v);
            this.selectedBall.isActive = true;
            this.isAddingBall = false;
        }
    }
};

Game.prototype.update = function update() {
};
//#endregion

//#region Ball management
Game.prototype.setBall = function setBall(ball, p, v) {
    var spr = ball.sprite;
    spr.setFrame(0);
    var s = rand(0.3, 0.5);
    spr.setScale([s, s, 1]);
    var color = new V3([rand(0.5, 1.0), rand(0.5, 1.0), rand(0.5, 1.0)]);
    spr.setColor(color);
    // calculate velocity
    //v.scale(rand(0.8, 1.0));
    //var p = new V2([this.center.x, ge.resolution.y - this.frame]);
    ball.setCurrent('velocity', v);
    ball.setCurrent('position', p);
    ball.setCurrent('acceleration', new V3(0.0, -0.001, 0.0));
};

Game.prototype.addBall = function addBall(p, v) {
    var ball = null;
    if (ge.actors[this.ballId] == undefined) {
        ball = ge.addActor(`ball${this.ballId}`);
        ball.addSprite(this.spriteManager);
        ball.addMechanics(ge.getInstance('sm1'));
        ball.addCollider(this.segmentManager.collider);
    } else {
        ball = ge.actors[this.ballId];
    }
    this.ballId++;
    this.setBall(ball, p, v);
    if (this.ballId == MAX_BALL_COUNT) this.ballId = 0;
    return ball;
};

// Game.prototype.resetBalls = function resetBalls() {
//     for (var i = 0; i<ge.actors.length; i++) {
//         this.setBall(ge.actors[i]);
//     }
// };
//#endregion


async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }

    Dbg.init('con');
    Dbg.con.style.visibility = 'visible';

    game = new Game();
    await game.init();
    ge.run(game);
}

function onresize() {
    console.log(gl.canvas.width, gl.canvas.height);
    //resizeScreen();
}