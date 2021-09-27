include('/lib/base/dbg.js');
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

    // setup screen
    this.setResolution(1920, 1080);
    ge.settings.backgroundColor = [0.85, 0.90, 1.0, 1.0];
    ge.prerender();
};

function createCircleSegments(center, w, h, count, isOutside) {
    var segments = [];
    var d = 2*Math.PI/count;
    var a = 0;
    var p1 = new V2(w, 0).add(center);
    for (var i=0; i<=count; i++) {
        var p2 = new V2(w*Math.cos(a), h*Math.sin(a)).add(center);
        if (isOutside) {
            segments.push(new Segment(p2, p1))
            p1 = p2;
        } else {
            segments.push(new Segment(p1, p2))
            p1 = p2;
        }
        
        a += d;
    }
    console.log(segments);
    return segments;
}

Game.prototype.setResolution = function setResolution(w, h) {
    ge.setResolution(w, h);
    this.center = new V2(w/2, h/2);
    var bl = new V2(this.frame, this.frame);
    var tl = new V2(this.frame, h-this.frame);
    var tr = new V2(w-this.frame, h-this.frame);
    var br = new V2(w-this.frame, this.frame);
    this.segments.push(...createCircleSegments(this.center, 0.4*w, 0.45*h, 120));
    this.segments.push(...createCircleSegments(this.center, 0.35*w, 0.4*h, 100, true));
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
            var angle = Math.PI/2 - Math.atan2(this.mouseHandler.position.y - this.frame, this.mouseHandler.position.x - 0.5*ge.resolution.x);
            if (ge.actors[this.ballId] == undefined) {
                this.addBall(angle);
            } else {
                this.setBall(ge.actors[this.ballId], angle);
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
Game.prototype.setBall = function setBall(ball, angle) {
    var spr = ball.sprite;
    spr.setFrame(0);
    var s = rand(0.3, 0.5);
    spr.setScale([s, s, 1]);
    var color = new V3([rand(0.5, 1.0), rand(0.5, 1.0), rand(0.5, 1.0)]);
    spr.setColor(color);
    // calculate velocity
    var v = V3.fromPolar(angle, 0, rand(0.2, 0.4));
    var p = new V2([this.center.x, this.frame]);
    ball.setCurrent('velocity', v);
    ball.setCurrent('position', p);
    //ball.acceleration.y = -.0;
};

Game.prototype.addBall = function addBall(angle) {
    var ball = ge.addActor(`ball${this.ballId}`);
    this.ballId++;
    ball.addSprite();
    ball.addSimpleMechanics();
    ball.addSegmentCollider(this.segments);
    this.setBall(ball, angle);
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