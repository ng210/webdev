import Vec2 from '../../math/vec2.js';
import Vec4 from '../../math/vec4.js';

const SF = {    // sprite fields
    'tx':  0,
    'ty':  1,
    'tz':  2,
    'p0':  3,   // padding1
    'sx':  4,
    'sy':  5,
    'rz':  6,
    'p1':  7,   // padding2
    'u1':  8,
    'v1':  9,
    'u2': 10,
    'v2': 11,
    'cr': 12,
    'cg': 13,
    'cb': 14,
    'ca': 15
};

export default class Sprite {
    #sprMgr;
    #array;
    #ix;

    isDirty;
    //get isDirty() { return this.#isDirty; }
    #translation;
    get translation() { this.isDirty = true; return this.#translation; }
    // padding1:    1
    #scale;
    get scale() { this.isDirty = true; return this.#scale; }
    //#rotation;
    get rotation() { return this.#array[this.#ix+SF.rz]; }
    set rotation(r) { this.isDirty = true; this.#array[this.#ix+SF.rz] = r; }
    // padding2:    1
    #texCoords;
    #color;
    get color() { this.isDirty = true; return this.#color; }

    #frame;
    #baseWidth;
    #baseHeight;
    set frame(frameId) {
        this.#frame = frameId;
        let frame = this.#sprMgr.getFrame(frameId);
        this.#baseWidth = frame[4];
        this.#baseHeight = frame[5];
        this.#texCoords.set(
            frame[0], frame[1],
            frame[2], frame[3]);
        this.isDirty = true;

    }

    #visible;
    get visible() { return this.#visible; }
    set visible(v) {
        this.isDirty = this.#visible != v;
        this.#visible = v;
    }
    get width() { return this.baseWidth * this.#scale.x; }
    get height() { return this.baseHeight * this.#scale.y; };

    constructor(sprMgr, ix) {
        this.#sprMgr = sprMgr;
        this.#array = sprMgr.dataArray;
        this.#ix = ix;
        this.isDirty = true;
        this.#translation = new Vec4(this.#array, ix+SF.tx);
        this.#scale = new Vec2(this.#array, ix+SF.sx, 1, 1);
        this.#texCoords = new Vec4(this.#array, ix+SF.u1, 0, 0, 1, 1);
        this.#color = new Vec4(this.#array, ix+SF.cr, 1, 1, 1, 1);
    }
}

// (function() {
//     function Controller(v) {
//         this.time = 0;
//         this.value = v;
//         this.start = v;
//         this.dt = 0;        // delta time of change
//         this.dv = 0;        // delta value of change
//         this.isActive = false;
//         this.transform = Sprite.Transform.basic;
//     }
//     Controller.prototype.update = function update(dt) {
//         var isDirty = this.isActive;
//         if (this.time < 1 && dt != 0) {
//             this.time += dt/this.dt;
//             if (this.time >= 1) {
//                 this.value = this.start + this.dv;
//                 this.isActive = false;
//             } else {
//                 this.value = this.start + this.transform();
//             }
//         }
//         return isDirty;
//     }

//     function Sprite(sprMgr) {
//         this.ix = 0;
//         this.isDirty = true;
//         this.offset = 0;
//         this.frame = 0;
//         this.baseWidth = 0;
//         this.baseHeight = 0;
//         this.visible = false;
//         this.width = 0;
//         this.height = 0;
//         //this.translation = new V3(0);
//         //this.scale = new V3(1.0);
//         //this.rotationZ = 0.0;
//         //this.color = new V4(1.0);
//         this.controllers = [];
//         for (var i in Sprite.Fields) {
//             this.controllers.push(new Controller(0));
//         }
//         this.sprMgr = sprMgr;
//     }

//     Sprite.prototype.getPosition = function getPosition() {
//         return new V3(
//             this.controllers[Sprite.Fields.tx].value,
//             this.controllers[Sprite.Fields.ty].value,
//             this.controllers[Sprite.Fields.tz].value);
//     };
//     Sprite.prototype.setPosition = function setPosition(p) {
//         this.controllers[Sprite.Fields.tx].value = p[0];
//         this.controllers[Sprite.Fields.ty].value = p[1];
//         this.controllers[Sprite.Fields.tz].value = p[2];
//         //this.translation.set(p);
//         this.isDirty = true;
//     };
//     Sprite.prototype.getScale = function getScale() {
//         return new V2(
//             this.controllers[Sprite.Fields.sx].value,
//             this.controllers[Sprite.Fields.sy].value);
//     };
//     Sprite.prototype.setScale = function setScale(s) {
//         this.controllers[Sprite.Fields.sx].value = s[0];
//         this.controllers[Sprite.Fields.sy].value = s[1];
//         //this.scale.set(s);
//         this.width = this.baseWidth * s[0];
//         this.height = this.baseHeight * s[1];
//         this.isDirty = true;
//     };
//     Sprite.prototype.getRotationZ = function getRotationZ() {
//         return this.controllers[Sprite.Fields.rz].value;
//     };
//     Sprite.prototype.setRotationZ = function setRotationZ(r) {
//         this.controllers[Sprite.Fields.rz].value = r;
//         //this.rotationZ = r;
//         this.isDirty = true;
//     };
//     Sprite.prototype.getFrame = function getFrame() {
//         return this.frame;
//     };
//     Sprite.prototype.setFrame = function setFrame(f) {
//         this.frame = f;
//         var frameOffset = f*6;
//         this.baseWidth = this.sprMgr.map.data[frameOffset+4];
//         this.baseHeight = this.sprMgr.map.data[frameOffset+5];
//         this.isDirty = true;
//     };
//     Sprite.prototype.getColor = function getColor() {
//         return new V4(
//             this.controllers[Sprite.Fields.cr].value,
//             this.controllers[Sprite.Fields.cg].value,
//             this.controllers[Sprite.Fields.cb].value,
//             this.controllers[Sprite.Fields.ca].value);
//     };
//     Sprite.prototype.setColor = function setColor(c) {
//         this.controllers[Sprite.Fields.cr].value = c[0];
//         this.controllers[Sprite.Fields.cg].value = c[1];
//         this.controllers[Sprite.Fields.cb].value = c[2];
//         this.controllers[Sprite.Fields.ca].value = c[3] == undefined ? 1.0 : c[3];
//         //this.color.set(c);
//         this.isDirty = true;
//     };
//     Sprite.prototype.getAlpha = function getAlpha() {
//         return this.controllers[Sprite.Fields.ca].value;
//     };
//     Sprite.prototype.setAlpha = function setAlpha(a) {
//         this.controllers[Sprite.Fields.ca].value = a;
//         //this.color.w = a;
//         this.isDirty = true;
//     };
//     Sprite.prototype.show = function show(visible) {
//         this.visible = visible;
//         this.isDirty = true;
//     }
//     Sprite.prototype.update = function update(dt) {
//         for (var i=0; i<this.controllers.length; i++) {
//             var c = this.controllers[i];
//             if (c.isActive) {
//                 var isDirty = c.update(dt)
//                 this.isDirty ||= isDirty;
//             }            
//         }
//     };
//     Sprite.prototype.setDelta = function setDelta(ci, dt, dv, transform) {
//         var c = this.controllers[ci];
//         c.time = 0
//         c.dt = dt;
//         c.dv = dv;
//         c.start = c.value;
//         c.transform = typeof transform === 'function' ? transform : Sprite.Transform.basic;
//         c.isActive = true;
//     };
//     Sprite.prototype.reset = function reset(ci, v) {
//         var c = this.controllers[ci];
//         c.time = 0;
//         c.value = v;
//         c.isActive = true;
//     };

//     // Sprite.Fields = {
//     //     POSITION_X:     0,
//     //     POSITION_Y:     1 + POSITION_X,
//     //     POSITION_Z:     1 + POSITION_Y,
//     //     TEXCOOR_U:      1 + POSITION_Z,
//     //     TEXCOOR_V:      1 + TEXCOOR_U,
//     //     COLOR_R:        1 + TEXCOOR_V,
//     //     COLOR_G:        1 + COLOR_R,
//     //     COLOR_B:        1 + COLOR_G,
//     //     VERTEXSIZE:     1 + COLOR_B
//     // };

//     Sprite.Attributes = {
//         'translation':     3,
//         'scale':        2,
//         'rotation':     1,
//         'texCoords':    4,
//         'color':        4
//     };
//     Sprite.AttributeSize = Object.values(Sprite.Attributes).reduce((v, x) =>  v += x);

//     Sprite.Fields = {
//         'tx':   0,
//         'ty':   1,
//         'tz':   2,
//         'sx':   3,
//         'sy':   4,
//         'rz':   5,
//         'cr':   6,
//         'cg':   7,
//         'cb':   8,
//         'ca':   9
//     };

//     Sprite.Transform = {
//         'basic': function() { return this.dv * Fn.linear(this.time); },
//         'smooth': function() { return this.dv * Fn.smoothstep(this.time); }
//     };

//     publish(Sprite, 'Sprite', webGL);
// })();