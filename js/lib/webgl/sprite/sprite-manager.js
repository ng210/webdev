include('/lib/webgl/webgl.js');
include('/lib/math/fn.js')
include('/lib/math/v2.js');
include('/lib/math/v3.js');
include('/lib/math/m44.js');
include('/lib/player/player-lib.js');
include('sprite.js');

(function() {
    function SpriteManager(player) {
        SpriteManager.base.constructor.call(this, player);
        this.map = null;
        this.count = 0;
        this.sprites = [];

        this.vertexBuffer = null;
        this.program = null;
        this.spriteAttributeBuffer = null;
        this.spriteAttributeData = null;
        this.projection = new Float32Array(16);
    }
    extend(Ps.IAdapter, SpriteManager);

    SpriteManager.prototype.initialize = async function initialize(mapUrl, spriteCount) {
        if (!window.gl) {
            webGL.init(null, true);
        }
        spriteCount = spriteCount || 100;
        this.sprites = new Array(spriteCount || SPRITE_COUNT);
        //this.angleExtension = webGL.useExtension('ANGLE_instanced_arrays');
        var shaderName = 'sprite-inst';
        // load resources
        var resources = await Promise.all([
            load({ url: `/lib/webgl/sprite/${shaderName}.vs`, contentType: 'x-shader/x-vertex', shaderType:gl.VERTEX_SHADER }),
            load({ url: `/lib/webgl/sprite/${shaderName}.fs`, contentType: 'x-shader/x-fragment', shaderType:gl.FRAGMENT_SHADER })
        ]);
        var errors = [];
        if (resources[0].error) errors.push(resources[0].error.message);
        if (resources[1].error) errors.push(resources[1].error.message);
        await this.createMap(mapUrl, errors);
        if (errors.length > 0) throw new Error(`Could not load resources: ${errors.join()}`);
        // create shaders and program
        M44.projection(gl.canvas.width, gl.canvas.height, 1, this.projection);
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = resources[0].data;
        shaders[gl.FRAGMENT_SHADER] = resources[1].data;
        var bufferId = webGL.buffers.length;
        this.program = webGL.createProgram(shaders, {
            a_position: { buffer:bufferId },
            a_vertexId: { buffer:bufferId++ },
            a_translate: { divisor: 1, buffer:bufferId },
            a_scale: { divisor: 1, buffer:bufferId },
            a_rotateZ: { divisor: 1, buffer:bufferId },
            a_color: { divisor: 1, buffer:bufferId },
            a_texcoord: { divisor: 1, buffer:bufferId }
        });

        this.vertexBuffer = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ .5,-.5, .5,.5, -.5,-.5, -.5,.5 ]), gl.STATIC_DRAW);
        this.spriteAttributeData = new Float32Array(webGL.Sprite.AttributeSize*spriteCount);
        this.spriteAttributeBuffer = webGL.createBuffer(gl.ARRAY_BUFFER, this.spriteAttributeData.length*4, gl.DYNAMIC_DRAW);
    };

    SpriteManager.prototype.resize = function resize(width, height) {
        // gl.canvas.width = width || window.innerWidth;
        // gl.canvas.height = height || window.innerHeight;
        if (this.program) {
            M44.projection(gl.canvas.width, gl.canvas.height, 1, this.projection);
            this.program.uniforms.u_projection.value = this.projection;
        }
    };

    SpriteManager.prototype.destroy = async function destroy() {
        for (var i=0; i<this.count; i++) {
            delete this.sprites[i];
        }
        delete this.sprites;

        webGL.deleteBuffer(this.vertexBuffer);
        //delete this.vertexData;
        webGL.deleteBuffer(this.spriteAttributeBuffer);
        delete this.spriteAttributeData;

        webGL.deleteTexture(this.map.texture);
        this.program.destroy();
    };

    SpriteManager.prototype.createMap = async function createMap(url, errors) {
        var res = await load(url);
        if (res.error) errors.push(res.error.message);
        else {
            var map = mergeObjects(res.data);
            res = await load(map.image, res.resolvedUrl.getPath());
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

    SpriteManager.prototype.addSprite = function addSprite(type) {
        type = type || webGL.Sprite;
        var spr = Reflect.construct(type, [this]);
        spr.ix = this.count;
        this.sprites[this.count] = spr;
        this.count++;
        spr.offset = spr.ix * webGL.Sprite.AttributeSize;
        return spr;
    };

    SpriteManager.prototype.update = function update() {
        for (var i=0; i<this.count; i++) {
            var spr = this.sprites[i];
            this.updateSprite(spr);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteAttributeBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.spriteAttributeData);
    };

    SpriteManager.prototype.updateSprite = function updateSprite(spr) {
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
        }
    };

    SpriteManager.prototype.render = function render() {
        webGL.useProgram(this.program, { 'u_projection': this.projection });
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.map.texture.texture);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.count);
    };

    SpriteManager.prototype.selectRadius = function selectRadius(x, y, r, action, args) {
        var r2 = r*r;
        for (var i=0; i<this.count; i++) {
            var spr = this.sprites[i];
            var dx = x - spr.position.x, dy = y - spr.position.y;
            var d = dx*dx + dy*dy;
            if (d < r2) {
                d = Math.sqrt(d);
                action(spr, x,y, dx/d, dy/d, args);
            }
        }
    };

    SpriteManager.prototype.selectRect = function selectRect(x, y, width, height, action, args) {
        height = height || width;
        var x2 = x + width, y2 = y + height;
        for (var i=0; i<this.count; i++) {
            var spr = this.sprites[i];
            var dx = x - spr.position.x, dy = y - spr.position.y;
            if (dx < 0 && dy < 0 && spr.position.x < x2 && spr.position.y < y2) {
                action(spr, x,y, dx,dy, args);
            }
        }
    };

    SpriteManager.prototype.checkCollision = function checkCollision() {
        // #1 brute force: check n*(n-1)/2
        // #2 use quad tree
        for (var i=0; i<this.count; i++) {
            var s1 = this.sprites[i];
            var r1 = [s1.position.x, s1.position.y, s1.width, s1.height];
            for (var j=0; j<i; j++) {
                var s2 = this.sprites[j];
                var r2 = [s2.position.x, s2.position.y, s2.width, s2.height];
                if (Fn.intersectRect(r1, r2)) console.log(i, j);
            }
        }

    };

    SpriteManager.initWebGL = function initWebGL(obj) {
        if (obj instanceof WebGLRenderingContext) {
            gl = obj;
        } else {
            var canvas = obj;
            if (!(obj instanceof HTMLCanvasElement)) {
                canvas = document.createElement('canvas');
                document.body.appendChild(canvas);
                canvas.style.position = 'absolute';
                canvas.style.left = '0px';
                canvas.style.top = '0px';
        
            }
            gl = canvas.getContext('webgl');
            if (gl == null) throw new Error('webGL not supported!');
        }
    };

    //#region IAdapter implementation
	SpriteManager.prototype.prepareContext = async function prepareContext(data) {
        var url = data.readString();
        var count = data.readUint8();
        await this.initialize(url, count);
        data.readPosition--;
        SpriteManager.base.prepareContext.call(this, data);
	};
	SpriteManager.prototype.createDeviceImpl = function createDeviceImpl(deviceType, initData) {
		var device = null;
		switch (deviceType) {
			case SpriteManager.Device.SPRITE:
                device = this.addSprite();
				break;
			default:
				throw new Error(`Invalid device type: ${deviceType}`);
		}
		return device;
	};
	SpriteManager.prototype.processCommand = function processCommand(channel, command) {
        var spr = channel.device;
        var sequence = channel.sequence;
        var cursor = channel.cursor;
        switch (command) {
            case SpriteManager.Commands.SETSPRITE:
                var fr = sequence.getUint8(cursor++);
                var tx = sequence.getFloat32(cursor); cursor += 4;
                var ty = sequence.getFloat32(cursor); cursor += 4;
                var tz = sequence.getFloat32(cursor); cursor += 4;
                var sx = sequence.getFloat32(cursor); cursor += 4;
                var sy = sequence.getFloat32(cursor); cursor += 4;
                var rz = sequence.getFloat32(cursor); cursor += 4;
                spr.setFrame(fr);
                spr.setPosition([tx, ty, tz]);
                spr.setScale([sx, sy, 1.0]);
                spr.setRotationZ(rz);
                break;
            case SpriteManager.Commands.SETFRAME:
                spr.setFrame(sequence.getUint8(cursor++));
                break;
			case SpriteManager.Commands.SETPOSITION:
				spr.setPosition([sequence.getFloat32(cursor++), sequence.getFloat32(cursor++), sequence.getFloat32(cursor++)]);
				break;
			case SpriteManager.Commands.SETSCALE:
				spr.setScale([sequence.getFloat32(cursor++), sequence.getFloat32(cursor++)]);
				break;
			case SpriteManager.Commands.SETROTATION:
				spr.setRotationZ(sequence.getFloat32(cursor++));
				break;
            case SpriteManager.Commands.CHANGE:
                var field = sequence.getUint8(cursor++);
                switch (field) {
                   case webGL.Sprite.Fields.tx: spr.position[0] += sequence.getFloat32(cursor); cursor += 4; break;
                   case webGL.Sprite.Fields.ty: spr.position[1] += sequence.getFloat32(cursor); cursor += 4; break;
                   case webGL.Sprite.Fields.tz: spr.position[2] += sequence.getFloat32(cursor); cursor += 4; break;
                   case webGL.Sprite.Fields.sx: spr.scale[0] += sequence.getFloat32(cursor); cursor += 4; break;
                   case webGL.Sprite.Fields.sy: spr.scale[1] += sequence.getFloat32(cursor); cursor += 4; break;
                   case webGL.Sprite.Fields.rz: spr.rotationZ += sequence.getFloat32(cursor); cursor += 4; break;
                   case webGL.Sprite.Fields.col:
                       spr.color[0] += sequence.getUint8(cursor++);
                       spr.color[1] += sequence.getUint8(cursor++);
                       spr.color[2] += sequence.getUint8(cursor++);
                       break;
                }
                spr.isDirty = true;
    	}
		return cursor;
	};
    SpriteManager.prototype.updateRefreshRate = function(device, command) { throw new Error('Not implemented!'); };

    // IAdapterExt implementation
    SpriteManager.prototype.makeCommand = function(command)  {
        var stream = new Stream(128);
        if (typeof command == 'string') {
            command = SpriteManager.Commands[command.toUpperCase()];
        }
        stream.writeUint8(command);
        var inputStream = null;
        if (arguments[1] instanceof Ps.Sequence) inputStream = arguments[1].stream;
        else if (arguments[1] instanceof Stream) inputStream = arguments[1];

        switch (command) {
            case SpriteManager.Commands.SETSPRITE:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 25);
                } else {
                    stream.writeUint8(arguments[1]);    // frame number
                    stream.writeFloat32(arguments[2]);  // tx
                    stream.writeFloat32(arguments[3]);  // ty
                    stream.writeFloat32(arguments[4]);  // tz
                    stream.writeFloat32(arguments[5]);  // sx
                    stream.writeFloat32(arguments[6]);  // sy
                    stream.writeFloat32(arguments[7]);  // rz
                }
                break;
            case SpriteManager.Commands.SETFRAME:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 1);
                } else {
                    stream.writeUint8(arguments[1]);    // frame number
                }
                break;
            case SpriteManager.Commands.SETPOSITION:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 12);
                } else {
                    stream.writeFloat32(arguments[1]);  // tx
                    stream.writeFloat32(arguments[2]);  // ty
                    stream.writeFloat32(arguments[3]);  // tz
                }
                break;
            case SpriteManager.Commands.SETSCALE:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 8);
                } else {
                    stream.writeFloat32(arguments[1]);  // sx
                    stream.writeFloat32(arguments[2]);  // sy
                }
                break;
            case SpriteManager.Commands.SETROTATION:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 4);
                } else {
                    stream.writeFloat32(arguments[1]);  // rz
                }
                break;
            case SpriteManager.Commands.CHANGE:
                if (inputStream) {
                    var field = inputStream.readUint(8);
                    stream.writeStream(inputStream, arguments[2], field == webGL.Sprite.Fields.col ? 3 : 4);
                } else {
                    var field = arguments[1];
                    stream.writeUint8(field);               // field
                    if (field == webGL.Sprite.Fields.col) {
                        stream.writeUint8(arguments[2]);    // r
                        stream.writeUint8(arguments[3]);    // g
                        stream.writeUint8(arguments[4]);    // b
                    } else {
                        stream.writeFloat32(arguments[2]);  // value
                    }
                }
                break;
        }

        stream.buffer = stream.buffer.slice(0, stream.length);
        return stream;
    };

    //#endregion

    SpriteManager.getInfo = () => SpriteManager.info;
    SpriteManager.info = { name: 'SpriteManager', id: 3 };
    
    // device types
    SpriteManager.Device = {
        SPRITE: 0,
        BATCH: 1
    };

    // commands
    SpriteManager.Commands = {
        SETFRAME:       0x02,
        SETPOSITION:    0x03,
        SETSCALE:       0x04,
        SETROTATION:    0x05,
        SETALPHA:       0x06,
        SETSPRITE:      0x07,
        CHANGE:         0x08,
        SCALE:          0x09,
        ROTATE:         0x0A,
        ALPHA:          0x0B
    };

    publish(SpriteManager, 'SpriteManager', webGL);
})();