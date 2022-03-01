include('/lib/webgl/webgl.js');
include('/lib/math/v2.js');
include('/lib/math/v3.js');
include('/lib/math/v4.js');
include('/lib/math/m44.js');
//include('/lib/player/player-lib.js');

(function() {
    function Controller(v) {
        this.value = v;
        this.delta = 0;
        this.target = v;
        this.isActive = false;
    }
    Controller.prototype.update = function update(dt) {
        if (this.value != this.target) {
            var dv = this.delta * dt;
            this.value += dv;
            if (dv < 0) {
                if (this.value < this.target) {
                    this.value = this.target;
                    this.isActive = false;
                }
            } else {
                if (this.value > this.target) {
                    this.value = this.target;
                    this.isActive = false;
                }
            }
        }
        return this.isActive;
    }

    function Sprite(sprMgr) {
        this.ix = 0;
        this.isDirty = true;
        this.offset = 0;
        this.frame = 0;
        this.baseWidth = 0;
        this.baseHeight = 0;
        this.visible = false;
        this.width = 0;
        this.height = 0;
        this.position = new V3(0);
        this.scale = new V3(1.0);
        this.rotationZ = 0.0;
        this.color = new V4(1.0);
        this.controllers = [];
        for (var i in Sprite.Fields) {
            this.controllers.push(new Controller(0));
        }
        this.sprMgr = sprMgr;
    }

    Sprite.prototype.setPosition = function setPosition(p) {
        this.controllers[Sprite.Fields.tx].value = p[0];
        this.controllers[Sprite.Fields.ty].value = p[1];
        this.controllers[Sprite.Fields.tz].value = p[2];
        //this.position.set(p);
        this.isDirty = true;
    };
    Sprite.prototype.setScale = function setScale(s) {
        this.controllers[Sprite.Fields.sx].value = s[0];
        this.controllers[Sprite.Fields.sy].value = s[1];
        //this.scale.set(s);
        this.width = this.baseWidth * s[0];
        this.height = this.baseHeight * s[1];
        this.isDirty = true;
    };
    Sprite.prototype.setRotationZ = function setRotationZ(r) {
        this.controllers[Sprite.Fields.rz].value = r;
        //this.rotationZ = r;
        this.isDirty = true;
    };
    Sprite.prototype.setFrame = function setFrame(f) {
        this.frame = f;
        var frameOffset = f*6;
        this.baseWidth = this.sprMgr.map.data[frameOffset+4];
        this.baseHeight = this.sprMgr.map.data[frameOffset+5];
        this.isDirty = true;
    };
    Sprite.prototype.setColor = function setColor(c) {
        this.controllers[Sprite.Fields.cr].value = c[0];
        this.controllers[Sprite.Fields.cg].value = c[1];
        this.controllers[Sprite.Fields.cb].value = c[2];
        this.controllers[Sprite.Fields.ca].value = c[3];
        //this.color.set(c);
        this.isDirty = true;
    };
    Sprite.prototype.setAlpha = function setAlpha(a) {
        this.controllers[Sprite.Fields.ca].value = a;
        //this.color.w = a;
        this.isDirty = true;
    };
    Sprite.prototype.show = function show(visible) {
        this.visible = visible;
        this.isDirty = true;
    }
    Sprite.prototype.update = function update(dt) {
        for (var i=0; i<this.controllers.length; i++) {
            var c = this.controllers[i];
            if (c.isActive) {
                var isDirty = c.update(dt)
                this.isDirty ||= isDirty;
            }            
        }
    };
    Sprite.prototype.setDelta = function setDelta(ci, dt, dv) {
        var c = this.controllers[ci];
        c.delta = dv/dt;
        c.target = c.value + dv;
        c.isActive = true;
    };

    // Sprite.Fields = {
    //     POSITION_X:     0,
    //     POSITION_Y:     1 + POSITION_X,
    //     POSITION_Z:     1 + POSITION_Y,
    //     TEXCOOR_U:      1 + POSITION_Z,
    //     TEXCOOR_V:      1 + TEXCOOR_U,
    //     COLOR_R:        1 + TEXCOOR_V,
    //     COLOR_G:        1 + COLOR_R,
    //     COLOR_B:        1 + COLOR_G,
    //     VERTEXSIZE:     1 + COLOR_B
    // };

    Sprite.Attributes = {
        'position':     3,
        'scale':        2,
        'rotation':     1,
        'texCoords':    4,
        'color':        4
    };
    Sprite.AttributeSize = Object.values(Sprite.Attributes).reduce((v, x) =>  v += x);

    Sprite.Fields = {
        'tx':   0,
        'ty':   1,
        'tz':   2,
        'sx':   3,
        'sy':   4,
        'rz':   5,
        'cr':   6,
        'cg':   7,
        'cb':   8,
        'ca':   9
    };

    publish(Sprite, 'Sprite', webGL);
})();