include('webgl/webgl.js');
include('math/v2.js');
include('math/v3.js');
include('math/m44.js');
include('/player/player-lib.js');

(function() {

    const POSITION_X    = 0;
    const POSITION_Y    = 1 + POSITION_X;
    const POSITION_Z    = 1 + POSITION_Y;
    const TEXCOOR_U     = 1 + POSITION_Z;
    const TEXCOOR_V     = 1 + TEXCOOR_U;
    const COLOR_R       = 1 + TEXCOOR_V;
    const COLOR_G       = 1 + COLOR_R;
    const COLOR_B       = 1 + COLOR_G;
    const VERTEXSIZE    = 1 + COLOR_B;

    const SPRITE_COUNT = 10;

    function Sprite() {
        this.ix = 0;
        this.isDirty = true;
        this.offset = 0;
        this.frame = 0;

        this.position = new V3(0);
        this.scale = new V3(1.0);
        this.rotationZ = 0.0;
        this.color = [1.0, 1.0, 1.0, 1.0];
    }
    Sprite.prototype.setPosition = function setPosition(p) {
        this.position[0] = p[0];
        this.position[1] = p[1];
        this.position[2] = p[2];
        this.isDirty = true;
    };
    Sprite.prototype.setScale = function setScale(s) {
        this.scale[0] = s[0];
        this.scale[1] = s[1];
        this.scale[2] = s[2];
        this.isDirty = true;
    };
    Sprite.prototype.setRotationZ = function setRotationZ(r) {
        this.rotationZ = r;
        this.isDirty = true;
    };
    Sprite.prototype.setFrame = function setFrame(f) {
        this.frame = f;
        this.isDirty = true;
    };

    Sprite.Attributes = {
        'position':     3,
        'scale':        2,
        'rotation':     1,
        'texCoords':    4,
        'color':        4
    };
    Sprite.AttributeSize = Object.values(Sprite.Attributes).reduce((v, x) =>  v += x);

    function SpriteManager() {
        this.map = null;
        this.count = 0;
        this.vertexBuffer = null;
        this.sprites = [];
        this.spriteAttributeBuffer = null;
        this.spriteAttributeData = null;
        this.angleExtension = null;

        this.projection = new Float32Array(16);
    }
    extend(Ps.IAdapter, SpriteManager);

    SpriteManager.prototype.initialize = async function initialize(mapUrl, spriteCount) {
        spriteCount = spriteCount || 100;
        this.sprites = new Array(spriteCount || SPRITE_COUNT);
        this.angleExtension = webGL.useExtension('ANGLE_instanced_arrays');
        var shaderName = 'sprite';
        if (this.angleExtension) shaderName += '-inst';
        // load resources
        var resources = await Promise.all([
            load({ url: `webgl/sprite/${shaderName}.vs`, contentType: 'x-shader/x-vertex', shaderType: gl.VERTEX_SHADER }),
            load({ url: `webgl/sprite/${shaderName}.fs`, contentType: 'x-shader/x-fragment', shaderType: gl.FRAGMENT_SHADER })
        ]);
        var errors = [];
        if (resources[0].error) errors.push(resources[0].error.message);
        if (resources[1].error) errors.push(resources[1].error.message);
        await this.createMap(mapUrl, errors);
        if (errors.length > 0) throw new Error(`Could not load resources: ${errors.join()}`);
        // create shaders and  program
        M44.projection(gl.canvas.width, gl.canvas.height, 1, this.projection);
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = resources[0].data;
        shaders[gl.FRAGMENT_SHADER] = resources[1].data;
        this.program = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:2, buffer:0 },
            a_vertexId: { type:gl.FLOAT, size:1, buffer:0 },
            a_translate: { type:gl.FLOAT, size:3, divisor: 1, buffer:1 },
            a_scale: { type:gl.FLOAT, size:2, divisor: 1, buffer:1 },
            a_rotateZ: { type:gl.FLOAT, size:1, divisor: 1, buffer:1 },
            a_color: { type:gl.FLOAT, size:4, divisor: 1, buffer:1 },
            a_texcoord: { type:gl.FLOAT, size:4, divisor: 1, buffer:1 },
        }, {
            u_projection: { type: webGL.FLOAT4x4M, value: this.projection }
        });

        this.vertexData = new Float32Array([ -1.0, -1.0, 0.0,   1.0,  1.0, 3.0,  -1.0,  1.0, 2.0,  -1.0, -1.0, 0.0,   1.0, -1.0, 1.0,   1.0,  1.0, 3.0 ]);
        this.vertexBuffer = webGL.createBuffer(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);
        this.spriteAttributeData = new Float32Array(Sprite.AttributeSize*spriteCount);
        this.spriteAttributeBuffer = webGL.createBuffer(gl.ARRAY_BUFFER, this.spriteAttributeData.length*4, gl.DYNAMIC_DRAW);

    };

    SpriteManager.prototype.onresize = function onresize() {
        gl.canvas.width = window.innerWidth;
        gl.canvas.height = window.innerHeight;
        if (this.program) {
            M44.projection(gl.canvas.width, gl.canvas.height, 1, this.projection);
            this.program.uniforms.u_projection.value = this.projection;
            this.program.updateUniform('u_projection');
        }
    };

    SpriteManager.prototype.destroy = async function destroy() {
        for (var i=0; i<this.count; i++) {
            delete this.sprites[i];
        }
        delete this.sprites;

        webGL.deleteBuffer(this.vertexBuffer);
        delete this.vertexData;
        webGL.deleteBuffer(this.spriteAttributeBuffer);
        delete this.spriteAttributeData;

        gl.deleteTexture(this.map.texture);
        this.program.destroy();
    };

    SpriteManager.prototype.createMap = async function createMap(url, errors) {
        var res = await load(url);
        if (res.error) errors.push(res.error.message);
        else {
            var map = mergeObjects(res.data);
            res = await load(map.image);
            if (res.error) errors.push(res.error.message);
            else {
                map.image = res.node;
                this.map = map;
                this.map.texture = webGL.createTexture(map.image);
                map.data = new Float32Array(6*map.frames.length);
                var k = 0;
                for (var i=0; i<map.frames.length; i++) {
                    map.data[k++] = map.frames[i][0]/map.image.width;
                    map.data[k++] = map.frames[i][1]/map.image.height;
                    map.data[k++] = map.frames[i][2]/map.image.width;
                    map.data[k++] = map.frames[i][3]/map.image.height;
                    map.data[k++] = (map.frames[i][2] - map.frames[i][0]);
                    map.data[k++] = (map.frames[i][3] - map.frames[i][1]);
                }
                // map.buffer = gl.createBuffer();
                // gl.bindBuffer(gl.ARRAY_BUFFER, map.buffer);
                // gl.bufferData(gl.ARRAY_BUFFER, map.data, gl.STATIC_DRAW);
            }
        }
    };

    SpriteManager.prototype.addSprite = function addSprite() {
        var spr = new Sprite();
        spr.ix = this.count;
        this.sprites[this.count] = spr;
        this.count++;
        spr.offset = spr.ix * Sprite.AttributeSize;
        return spr;
    };

    SpriteManager.prototype.setFrame = function setFrame(sprId, frame) {

    };

    SpriteManager.prototype.update = function update() {
        for (var i=0; i<this.count; i++) {
            var spr = this.sprites[i];
            if (spr.isDirty) {
                // update matrix
                var frameOffset = spr.frame*6;
                this.spriteAttributeData[spr.offset+ 0] = spr.position.x;
                this.spriteAttributeData[spr.offset+ 1] = spr.position.y;
                this.spriteAttributeData[spr.offset+ 2] = spr.position.z;
                this.spriteAttributeData[spr.offset+ 3] = spr.scale.x * this.map.data[frameOffset+4];
                this.spriteAttributeData[spr.offset+ 4] = spr.scale.y * this.map.data[frameOffset+5];
                this.spriteAttributeData[spr.offset+ 5] = spr.rotationZ;
                this.spriteAttributeData[spr.offset+ 6] = spr.color[0];
                this.spriteAttributeData[spr.offset+ 7] = spr.color[1];
                this.spriteAttributeData[spr.offset+ 8] = spr.color[2];
                this.spriteAttributeData[spr.offset+ 9] = spr.color[3];
                this.spriteAttributeData[spr.offset+10] = this.map.data[frameOffset+0];
                this.spriteAttributeData[spr.offset+11] = this.map.data[frameOffset+1];
                this.spriteAttributeData[spr.offset+12] = this.map.data[frameOffset+2];
                this.spriteAttributeData[spr.offset+13] = this.map.data[frameOffset+3];
                spr.isDirty = false;
//console.log(this.spriteAttributeData.slice(spr.offset, spr.offset+Sprite.AttributeSize));
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteAttributeBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.spriteAttributeData);
    };

    SpriteManager.prototype.render = function render(frame) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        //gl.colorMask(false, false, false, true);
        gl.clearDepth(1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        webGL.useProgram(this.program).setUniforms();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.map.texture);

        this.angleExtension.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, this.count);
    };

    publish(Sprite, 'Sprite', webGL);
    publish(SpriteManager, 'SpriteManager', webGL);
})();