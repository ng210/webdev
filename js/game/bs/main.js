include('/lib/base/dbg.js');
include('/lib/math/noise.js');
include('./components/ge-lib.js');

const MAX_BALL_COUNT = 100;

var game = null;

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function Game() {
    this.sprMgr = null;
    this.time = 0;
    this.center = null;
    this.noise = null;

    this.frame = 100;
    this.segments = [];
    this.actors = [];

    this.ballId = 0;
}

Game.prototype.init = async function init() {
    Dbg.prln('Initialization');

    // load components
    await ge.loadComponent('SpriteManager', ['./res/balls.spr.json', MAX_BALL_COUNT]);
    await ge.loadComponent('SpriteRenderer');
    this.segmentRenderer = await ge.loadComponent('SegmentRenderer');
    await ge.loadComponent('SimpleMechanics');
    await ge.loadComponent('SegmentCollider2d');
    this.keyboardHandler = await ge.loadComponent('KeyboardHandler');
    this.mouseHandler = await ge.loadComponent('MouseHandler');
    Dbg.prln('Components loaded.');
    this.noise = new Noise(20081028);

    // setup screen
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

Game.prototype.setResolution = function setResolution(w, h) {
    ge.setResolution(w, h);
    this.center = new V2(w/2, h/2);
    var bl = new V2(this.frame, this.frame);
    var tl = new V2(this.frame, h-this.frame);
    var tr = new V2(w-this.frame, h-this.frame);
    var br = new V2(w-this.frame, this.frame);
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.2, 0.3]), 0.05*w, 0.08*h, 3, true));
    //this.segments.push(...this.createCircleSegments(this.center, 0.2*w, 0.2*h, 24, true));
    this.segments.push(...this.createCircleSegments(this.center, 0.5*w, 0.5*h, 36));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.8, 0.3]), 0.05*w, 0.08*h, 5, true));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.2, 0.7]), 0.02*w, 0.08*h, 12, true));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.8, 0.7]), 0.10*w, 0.10*h, 6, true));
    // this.segments.push(
    //     new Segment(bl, br),        // bottom
    //     new Segment(br, tr),        // right
    //     new Segment(tr, tl),        // top
    //     new Segment(tl, bl)         // left
    // );
    this.segmentRenderer.clearSegments();
    this.segmentRenderer.addSegments(this.segments);
};

//#region Callbacks for the GE framework
Game.prototype.handleInputs = function handleInputs() {
    if (this.keyboardHandler.isPressed(32) || this.mouseHandler.isLeftPressed()) {
        if (this.mouseHandler.position.y > this.frame) {
            //var angle = Math.PI/2 - Math.atan2(this.mouseHandler.position.y - this.frame, this.mouseHandler.position.x - 0.5*ge.resolution.x);
            var v = this.mouseHandler.position.diff(new V2([this.center.x, ge.resolution.y - this.frame])).div(ge.resolution);
            if (ge.actors[this.ballId] == undefined) {
                this.addBall(v);
            } else {
                this.setBall(ge.actors[this.ballId], v);
                this.ballId++;
            }
            if (this.ballId == MAX_BALL_COUNT) this.ballId = 0;
        }
    }
};

Game.prototype.update = function update() {
};
//#endregion

//#region Ball management
Game.prototype.setBall = function setBall(ball, v) {
    var spr = ball.sprite;
    spr.setFrame(0);
    var s = rand(0.3, 0.5);
    spr.setScale([s, s, 1]);
    var color = new V3([rand(0.5, 1.0), rand(0.5, 1.0), rand(0.5, 1.0)]);
    spr.setColor(color);
    // calculate velocity
    v.scale(rand(0.8, 1.0));
    var p = new V2([this.center.x, ge.resolution.y - this.frame]);
    ball.setCurrent('velocity', v);
    ball.setCurrent('position', p);
    ball.setCurrent('acceleration', new V3(0.0, -0.001, 0.0));
};

Game.prototype.addBall = function addBall(v) {
    var ball = ge.addActor(`ball${this.ballId}`);
    this.ballId++;
    ball.addSprite();
    ball.addSimpleMechanics();
    ball.addSegmentCollider(this.segments);
    this.setBall(ball, v);
    return ball;
};

Game.prototype.resetBalls = function resetBalls() {
    for (var i = 0; i<ge.actors.length; i++) {
        this.setBall(ge.actors[i]);
    }
};
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