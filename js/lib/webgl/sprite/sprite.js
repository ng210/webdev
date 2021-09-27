include('/lib/webgl/webgl.js');
include('/lib/math/v2.js');
include('/lib/math/v3.js');
include('/lib/math/v4.js');
include('/lib/math/m44.js');
//include('/lib/player/player-lib.js');

(function() {
    function Sprite(sprMgr) {
        this.ix = 0;
        this.isDirty = true;
        this.offset = 0;
        this.frame = 0;
        this.baseWidth = 0;
        this.baseHeight = 0;
        this.width = 0;
        this.height = 0;
        this.position = new V3(0);
        this.scale = new V3(1.0);
        this.rotationZ = 0.0;
        this.color = new V4(1.0);

        this.sprMgr = sprMgr;
    }

    Sprite.prototype.setPosition = function setPosition(p) {
        this.position.set(p);
        this.isDirty = true;
    };
    Sprite.prototype.setScale = function setScale(s) {
        this.scale.set(s);
        this.width = this.baseWidth * s[0];
        this.height = this.baseHeight * s[1];
        this.isDirty = true;
    };
    Sprite.prototype.setRotationZ = function setRotationZ(r) {
        this.rotationZ = r;
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
        this.color.set(c);
        this.isDirty = true;
    };

    Sprite.prototype.update = function update(dt) {

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
        'col':  6
    };

    publish(Sprite, 'Sprite', webGL);
})();