include('/lib/base/dbg.js');
include('/lib/math/noise.js');
include('./components/ge.js');
include('/lib/math/segment.js');

const MAX_BALL_COUNT = 2000;
const MAX_AIM_STRETCH = 300;

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

    this.frame = 20;
    this.segments = [];
    this.selectedBall = null;
    this.selectedBallSize = 0;

    this.aimingSegment = new Segment(new V2(0), new V2());
    this.shootStatus = 0;
    this.spriteFrame = 0;

    this.mode = 0;

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
    await ge.createInstance('SimpleMechanics', 'sm1', {
        'forces': [
            { 'type':'field', 'direction': new V3(0, -0.0004, 0) },
            // { 'type':'point', 'center': new V3(this.frame, -this.frame), 'amount': new V3(0, -200.0, 0) }
            //{ 'type':'point', 'center': new V3(100, -5000), 'amount': new V3(0, 50000.0, 0) }
        ],
        'damping': 0.8
    });

    await ge.loadComponent('input-handler.js');
    this.keyboardHandler = await ge.createInstance('KeyboardHandler', 'kbhandler1');
    this.mouseHandler = await ge.createInstance('MouseHandler', 'mousehandler1');

    await ge.loadComponent('actor.js');
    Dbg.prln('Components loaded.');
    //#endregion

    this.noise = new Noise(Date.now());

    // setup screen
    var fpsDisplay = document.getElementById('fps');
    ge.setFpsHandler(fps => fpsDisplay.innerHTML = ('    '+fps.toFixed(2)).slice(-6));
    this.setResolution(1920, 1080);
    ge.settings.backgroundColor = [0.85, 0.90, 1.0, 1.0];
    // ge.getInstance('sm1').addForces([
    //     { 'type':'point', 'center': new V3(this.center), 'amount': new V3(10.0) }
    // ]);
    ge.prerender();
};

Game.prototype.createCircleSegments = function createCircleSegments(center, w, h, count, isOutside) {
    var segments = [];
    var d = 2*Math.PI/count;
    var a1 = 0;
    var p0 = p1 = null;
    for (var i=0; i<count; i++) {
        var n = this.noise.fbm1d(a1, 6, 1.0, 2.0, 0.6, 2.0);
        var l = i < count/2 ? Fn.smoothstep(i/count) : Fn.smoothstep((count - i)/count);
        l = 0.5 + l * n;
        //var l = Fn.lerp(1, n, 0.5);
        var p = V2.fromPolar(a1, l).mul([w, h]).add(center);
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
        a1 += d;
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
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.2, 0.3]), 0.05*w, 0.08*h, 3, true));
    //this.segments.push(...this.createCircleSegments(this.center, 0.2*w, 0.2*h, 24, true));
    segments.push(...this.createCircleSegments(this.center.sum([0, this.frame]), 0.30*w, 0.3*h, 180, true));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.8, 0.3]), 0.05*w, 0.08*h, 5, true));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.2, 0.7]), 0.02*w, 0.08*h, 12, true));
    // this.segments.push(...this.createCircleSegments(ge.resolution.prod([0.8, 0.7]), 0.10*w, 0.10*h, 6, true));
    var p1 = new V2(1.1*this.frame, 1.5*this.frame);
    var p2 = new V2(1.1*this.frame, this.frame);
    segments.push(
        new Segment(bl, br),        // bottom
        // new Segment(bl, p2),        // bottom
        // new Segment(p2, p1),        // bottom
        // new Segment(p1, br),        // bottom
        new Segment(br, tr),        // right
        new Segment(tr, tl),        // top
        new Segment(tl, bl)         // left
    );

    this.segmentManager.clearSegments();
    this.segmentManager.addSegment(this.aimingSegment);
    this.segmentManager.addSegments(segments);
};

Game.prototype.setResolution = function setResolution(w, h) {
    ge.setResolution(w, h);
    this.borders[0] = 0; this.borders[1] = 0;
    this.borders[2] = w; this.borders[3] = h;
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
        if (this.keyboardHandler.isPressed(32) || this.mouseHandler.isLeftDown()) {
            //if (this.spriteManager.sprMgr.selectRadius(mpos.x, mpos.y, 10, toggleBall) == 0) {
                switch (this.shootStatus) {
                    case 0: // idle state
                        this.shootStatus = 1;
                        this.selectedBall = this.addBall(mpos, [0, 0]);
                        this.setBallSize(this.selectedBall, 0.3);
                        this.selectedBall.isActive = false;
                        this.aimingSegment.b.set(mpos);
                        this.aimingSegment.a.set(mpos);
                        break;
                    case 1: // sizing
                        var d = this.selectedBall.current.position.diff(mpos);
                        if (d.len < 0.1) {
                            var s = this.selectedBall.sprite.scale.x;
                            if (s < 0.8) {
                                this.setBallSize(this.selectedBall, s + 0.002);
                            }
                        } else {
                            this.shootStatus = 2;
                        }
                        break;
                    case 2: // aiming
                        this.aimingSegment.a.set(mpos);
                        this.aimingSegment.update();
                        if (this.aimingSegment.d.len > MAX_AIM_STRETCH) {
                            this.aimingSegment.d.norm().scale(MAX_AIM_STRETCH);
                            this.aimingSegment.a = this.aimingSegment.b.diff(this.aimingSegment.d);
                            this.aimingSegment.update();
                        }
                        
                        this.segmentManager.renderer.updateSegments([this.aimingSegment], 0);
                        break;
                }
            //}
        }

        if ((this.keyboardHandler.isReleased(32) || this.mouseHandler.isLeftReleased())) {
            switch (this.shootStatus) {
                case 1:
                case 2:
                    this.shootStatus = 3;
                    break;
            }            
        }
    }

    if (this.keyboardHandler.isReleased(49)) { this.spriteFrame = 0;  }
    if (this.keyboardHandler.isReleased(50)) { this.spriteFrame = 1; }
};

Game.prototype.update = function update(dt) {
    switch (this.shootStatus) {
        case 3:
            this.shootStatus = 4;
            //this.aimingSegment.update();
            var f = 0.002/this.selectedBall.current.mass;
            this.selectedBall.setCurrent('velocity', this.aimingSegment.d.prodC(f));
            var spr = this.selectedBall.sprite;
            this.selectedBallSize = 0.5*Math.sqrt(spr.width*spr.width + spr.height*spr.height);
            break;
        case 4:
            var l = this.aimingSegment.d.len;
            if (l > this.selectedBallSize*0.8) {
                this.aimingSegment.d.scale(0.7);
                this.aimingSegment.a = this.aimingSegment.b.diff(this.aimingSegment.d);
            } else {
                this.selectedBall.isActive = true;
                this.shootStatus = 0;
                this.aimingSegment.b.set([0,0]);
                this.aimingSegment.a.set([0,0]);
            }
            this.segmentManager.renderer.updateSegments([this.aimingSegment], 0);
            break;
    }
};
//#endregion

//#region Ball management
Game.prototype.setBall = function setBall(ball, p, v) {
    var spr = ball.sprite;
    spr.setFrame(this.spriteFrame);
    var s = rand(0.3, 0.5);
    var color = new V3([rand(0.5, 1.0), rand(0.5, 1.0), rand(0.5, 1.0)]);
    spr.setColor(color);
    this.setBallSize(ball, s);
    ball.setCurrent('velocity', v);
    ball.setCurrent('position', p);
    ball.setCurrent('acceleration', new V3(0.0));
};

Game.prototype.setBallSize = function setBallSize(ball, s) {
    ball.sprite.setScale([s, s, 1]);
    ball.setCurrent('mass', 4*4*s*s*s/3);
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