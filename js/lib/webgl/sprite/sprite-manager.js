// import WebGL from '/js/lib/webgl/webgl.js';
import Sprite from './sprite.js';
// import { load } from "/js/lib/loader/load.js";

// 00 translation: 3
// 03 padding1:    1
// 04 scale:       2
// 06 rotation:    1
// 07 padding2:    1
// 08 texCoords:   4
// 0C color:       4
const FloatsPerSprite = 16;

export default class SpriteManager /*extends IAdapter*/ {
    #webgl;
    #dataArray = null;
    get dataArray() { return this.#dataArray; }
    #atlas = null;
    #pool = null;
    #count = 0;
    get count() { return this.#count; }
    #vertices = null;
    #attributes = null;
    #program = null;
    set program(p) { this.#program = p; }
    diffuseColor = [1.0, 1.0, 1.0, 1.0];

    get size() { return this.#pool.length; }

    get frameCount() { return this.#atlas.frames.length; }

    #defaultVertexShader =
    `#version 300 es

    // buffer #1
    in vec2 a_position;

    // buffer #2
    in vec3 a_translate;
    in vec2 a_scale;
    in float a_rotation;
    in vec4 a_texcoord;
    in vec4 a_color;

    out vec2 v_texcoord;
    out vec4 v_color;

    void main() {
        mat4 m = mat4(1.0);
        float c = cos(a_rotation);
        float s = sin(a_rotation);
        m[0][0] = c*a_scale.x;
        m[0][1] = s*a_scale.x;
        m[1][0] = -s*a_scale.y;
        m[1][1] = c*a_scale.y;
        m[2][2] = 1.0;  //a_scale.z
        m[2][3] = 1.0;
        m[3][0] = a_translate.x;
        m[3][1] = a_translate.y;
        m[3][2] = 0.0;  //a_translate.z;
        m[3][3] = 1.0;
        gl_Position = m*vec4(a_position, 0.0, 1.0);
        if (gl_VertexID == 0) v_texcoord = a_texcoord.xw;
        else if (gl_VertexID == 1) v_texcoord = a_texcoord.xy;
        else if (gl_VertexID == 2) v_texcoord = a_texcoord.zy;
        else if (gl_VertexID == 3) v_texcoord = a_texcoord.zy;
        else if (gl_VertexID == 4) v_texcoord = a_texcoord.zw;
        else if (gl_VertexID == 5) v_texcoord = a_texcoord.xw;
        v_color = a_color;
    } `;

    #defaultFragmentShader =
    `#version 300 es
    precision mediump float;

    out vec4 fragColor;
    uniform vec4 uColor;
    in vec2 v_texcoord;
    in vec4 v_color;
    uniform sampler2D u_texture;
    
    void main() {
        fragColor = uColor * v_color * texture(u_texture, v_texcoord);
    } `;

    constructor(webgl, count) {
        this.#webgl = webgl;
        const gl = this.#webgl.gl;
        // create pool of sprites
        this.#dataArray = new Float32Array(FloatsPerSprite*count);
        this.#pool = [];
        let ix = 0;
        for (let i=0; i<count; i++) {
            this.#pool.push(new Sprite(this, ix));
            ix += FloatsPerSprite;
        }

        // set up buffers
        this.#vertices = this.#webgl.screenVBO;
        this.#attributes = this.#webgl.createBufferFromArrayBuffer(
            gl.ARRAY_BUFFER,
            this.#dataArray,
            'attributes');
    
        this.#program = null;
    }

    spr(ix) {
        let sp = null;
        if (ix >= 0 && ix < this.#count) {
            sp = this.#pool[ix];
        }
        return sp;
    }

    async loadAtlas(imgUrl, mapUrl) {
        let img = new Image();
        img.src = imgUrl;
        await img.decode();
        let map = await fetch(mapUrl).then(r => r.json());
        for (let v of Object.values(map)) {
            v[4] = v[2] - v[0];
            v[5] = v[3] - v[1];
            v[0] /= img.width;
            v[1] /= img.height;
            v[2] /= img.width;
            v[3] /= img.height;
        }
        this.#atlas = {
            'img': img,
            'texture': this.#webgl.createTextureFromImage(img, 'spr-atlas'),
            'frames': map
        };
    }

    async loadShaders(vsUrl, fsUrl) {
        let vs = vsUrl ? await fetch(vsUrl).then(res => res.text()) : this.#defaultVertexShader;
        let fs = fsUrl ? await fetch(fsUrl).then(res => res.text()) : this.#defaultFragmentShader;

        return this.#webgl.createProgram(
            {
                vertexSrc: vs,
                fragmentSrc: fs,
                attributes: {
                    a_position:  { bufferId: this.#vertices.id },
                    a_translate: { bufferId: this.#attributes.id, offset:  0*4, divisor: 1 },
                    a_scale:     { bufferId: this.#attributes.id, offset:  4*4, divisor: 1 },
                    a_rotation:  { bufferId: this.#attributes.id, offset:  6*4, divisor: 1 },
                    a_texcoord:  { bufferId: this.#attributes.id, offset:  8*4, divisor: 1 },
                    a_color:     { bufferId: this.#attributes.id, offset: 12*4, divisor: 1 }
                }
            });
    }

    setProgram(program) {
        this.#program = program;
    }

    allocate() {
        if (this.#count < this.#pool.length) {
            let spr = this.#pool[this.#count];
            this.#count++;
            return spr;
        } else console.warn('Sprite pool is full!');
    }

    update() {
        // check for dirty sprites
        let isDirty = false;
        for (let i=0; i<this.#count; i++) {
            let spr = this.#pool[i];
            if (spr.isDirty) {
                spr.isDirty = false;
                isDirty = true;
            }
        }
        if (isDirty) {
            this.#attributes.uploadData(this.#dataArray, this.#webgl.gl.DYNAMIC_DRAW);
        }
    }

    render() {
        const gl = this.#webgl.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        this.#atlas.texture.bind(0);

        this.#program.use();
        this.#program.setUniform('u_texture', this.#atlas.texture);
        this.#program.setUniform('uColor', this.diffuseColor);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.#count);
    }

    destroy() {
        this.#program.delete();
    }

    getFrame(frameId) {
        return this.#atlas.frames[frameId];
    }
}

// (function() {
//     SpriteManager.prototype.initialize = async function initialize(mapUrl, spriteCount, shaders) {
//         if (!window.gl) {
//             webGL.init(null, true);
//         }
//         spriteCount = spriteCount || 100;
//         this.sprites = new Array(spriteCount || SPRITE_COUNT);
//         //this.angleExtension = webGL.useExtension('ANGLE_instanced_arrays');
//         if (!shaders) {
//             var shaderName = 'sprite-inst';
//             // load resources
//             var resources = await load([
//                 { url: `/lib/webgl/sprite/${shaderName}.vs`, contentType: 'x-shader/x-vertex', shaderType:gl.VERTEX_SHADER },
//                 { url: `/lib/webgl/sprite/${shaderName}.fs`, contentType: 'x-shader/x-fragment', shaderType:gl.FRAGMENT_SHADER }
//             ]);
//             var errors = [];
//             if (resources[0].error) errors.push(resources[0].error.message);
//             if (resources[1].error) errors.push(resources[1].error.message);
//             shaders = {};
//             shaders[gl.VERTEX_SHADER] = resources[0].data;
//             shaders[gl.FRAGMENT_SHADER] = resources[1].data;
//         }
//         await this.createMap(mapUrl, errors);
//         if (errors.length > 0) throw new Error(`Could not load resources: ${errors.join()}`);
//         this.resize(gl.canvas.clientWidth, gl.canvas.clientHeight);

//         // create shaders and program
//         var bufferId = webGL.buffers.length;
//         this.program = webGL.createProgram(shaders, {
//             a_position: { buffer:bufferId },
//             a_vertexId: { buffer:bufferId++ },
//             a_translate: { divisor: 1, buffer:bufferId },
//             a_scale: { divisor: 1, buffer:bufferId },
//             a_rotateZ: { divisor: 1, buffer:bufferId },
//             a_color: { divisor: 1, buffer:bufferId },
//             a_texcoord: { divisor: 1, buffer:bufferId }
//         });

//         this.vertexBuffer = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ .5,-.5, .5,.5, -.5,-.5, -.5,.5 ]), gl.STATIC_DRAW);
//         this.spriteAttributeData = new Float32Array(webGL.Sprite.AttributeSize*spriteCount);
//         this.spriteAttributeBuffer = webGL.createBuffer(gl.ARRAY_BUFFER, this.spriteAttributeData.length*4, gl.DYNAMIC_DRAW);
//     };

//     SpriteManager.prototype.resize = function resize(width, height) {
//         if (width) gl.canvas.width = width || window.innerWidth;
//         if (height) gl.canvas.height = height || window.innerHeight;
//         M44.projection(gl.canvas.width, gl.canvas.height, 1, this.projectionMatrix);
//         this.projectionMatrix.mul(this.viewMatrix, this.projectionView);
//         gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
//     };

//     SpriteManager.prototype.destroy = async function destroy() {
//         for (var i=0; i<this.count; i++) {
//             delete this.sprites[i];
//         }
//         delete this.sprites;

//         webGL.deleteBuffer(this.vertexBuffer);
//         //delete this.vertexData;
//         webGL.deleteBuffer(this.spriteAttributeBuffer);
//         delete this.spriteAttributeData;

//         if (this.map) webGL.deleteTexture(this.map.texture);
//         if (this.program) this.program.destroy();
//     };

//     SpriteManager.prototype.createMap = async function createMap(url, errors) {
//         var res = await load(url);
//         if (res.error) errors.push(res.error.message);
//         else {
//             var map = clone(res.data);
//             res = await load(map.image, res.resolvedUrl.getPath());
//             if (res.error) errors.push(res.error.message);
//             else {
//                 map.image = res.node;
//                 this.map = map;
//                 this.map.texture = webGL.createTexture(map.image, webGL.types.RGBA8);
//                 map.data = new Float32Array(6*map.frames.length);
//                 var k = 0;
//                 for (var i=0; i<map.frames.length; i++) {
//                     map.data[k++] = map.frames[i][0]/map.image.width;
//                     map.data[k++] = map.frames[i][1]/map.image.height;
//                     map.data[k++] = (map.frames[i][0] + map.frames[i][2])/map.image.width;
//                     map.data[k++] = (map.frames[i][1] + map.frames[i][3])/map.image.height;
//                     map.data[k++] = map.frames[i][2];
//                     map.data[k++] = map.frames[i][3];
//                 }
//                 // map.buffer = gl.createBuffer();
//                 // gl.bindBuffer(gl.ARRAY_BUFFER, map.buffer);
//                 // gl.bufferData(gl.ARRAY_BUFFER, map.data, gl.STATIC_DRAW);
//             }
//         }
//     };

//     SpriteManager.prototype.addSprite = function addSprite(type) {
//         type = type || webGL.Sprite;
//         var spr = Reflect.construct(type, [this]);
//         spr.ix = this.count;
//         this.sprites[this.count] = spr;
//         this.count++;
//         spr.offset = spr.ix * webGL.Sprite.AttributeSize;
//         return spr;
//     };

//     //#region UPDATE
//     SpriteManager.prototype.updateBuffer = function updateBuffer() {
//         gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteAttributeBuffer.ref);
//         gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.spriteAttributeData);
//     };

//     SpriteManager.prototype.update = function update(dt) {
//         for (var i=0; i<this.count; i++) {
//             var spr = this.sprites[i];
//             spr.update(dt);
//             this.updateSprite(spr);
//         }
//         this.updateBuffer();
//         if (this.matrixChanged) {
//             this.projectionView = this.projectionMatrix.mul(this.viewMatrix);
//         }
//     };
//     SpriteManager.prototype.resetView = function resetView() {
//         M44.identity(this.viewMatrix);
//     };
//     SpriteManager.prototype.translate = function translate(t) {
//         var mat44 = M44.translate(t);
//         this.viewMatrix = this.viewMatrix.mul(mat44);
//         this.matrixChanged = true;
//     };
//     SpriteManager.prototype.scale = function scale(s) {
//         var mat44 = M44.scale(s);
//         this.viewMatrix = this.viewMatrix.mul(mat44);
//         this.matrixChanged = true;
//     };
//     SpriteManager.prototype.rotateZ = function rotateZ(r) {
//         var mat44 = M44.rotateZ(r);
//         this.viewMatrix = this.viewMatrix.mul(mat44);
//         this.matrixChanged = true;
//     };

//     SpriteManager.prototype.updateSpritePosition = function updateSpritePosition(spr) {
//         this.spriteAttributeData[spr.offset+ 0] = spr.controllers[webGL.Sprite.Fields.tx].value;
//         this.spriteAttributeData[spr.offset+ 1] = spr.controllers[webGL.Sprite.Fields.ty].value;
//         this.spriteAttributeData[spr.offset+ 2] = spr.controllers[webGL.Sprite.Fields.tz].value;
//     };

//     SpriteManager.prototype.updateSpriteScale = function updateSpriteScale(spr) {
//         var frameOffset = spr.frame*6;
//         this.spriteAttributeData[spr.offset+ 3] = spr.controllers[webGL.Sprite.Fields.sx].value * this.map.data[frameOffset+4];
//         this.spriteAttributeData[spr.offset+ 4] = spr.controllers[webGL.Sprite.Fields.sy].value * this.map.data[frameOffset+5];
//     };

//     SpriteManager.prototype.updateSpriteRotZ = function updateSpriteRotZ(spr) {
//         this.spriteAttributeData[spr.offset+ 5] = spr.controllers[webGL.Sprite.Fields.rz].value;
//     };

//     SpriteManager.prototype.updateSpriteColor = function updateSpriteColor(spr) {
//         this.spriteAttributeData[spr.offset+ 6] = spr.controllers[webGL.Sprite.Fields.cr].value;
//         this.spriteAttributeData[spr.offset+ 7] = spr.controllers[webGL.Sprite.Fields.cg].value;
//         this.spriteAttributeData[spr.offset+ 8] = spr.controllers[webGL.Sprite.Fields.cb].value;
//         this.spriteAttributeData[spr.offset+ 9] = spr.controllers[webGL.Sprite.Fields.ca].value;
//     };

//     SpriteManager.prototype.updateSpriteFrame = function updateSpriteFrame(spr) {
//         var frameOffset = spr.frame*6;
//         this.spriteAttributeData[spr.offset+10] = this.map.data[frameOffset+0];
//         this.spriteAttributeData[spr.offset+11] = this.map.data[frameOffset+1];
//         this.spriteAttributeData[spr.offset+12] = this.map.data[frameOffset+2];
//         this.spriteAttributeData[spr.offset+13] = this.map.data[frameOffset+3];
//     };

//     SpriteManager.prototype.updateSprite = function updateSprite(spr) {
//         if (spr.isDirty) {
//             // update matrix
//             var frameOffset = spr.frame*6;
//             this.spriteAttributeData[spr.offset+ 0] = spr.controllers[webGL.Sprite.Fields.tx].value;
//             this.spriteAttributeData[spr.offset+ 1] = spr.controllers[webGL.Sprite.Fields.ty].value;
//             this.spriteAttributeData[spr.offset+ 2] = spr.controllers[webGL.Sprite.Fields.tz].value;
//             var wi = 0, he = 0;
//             if (spr.visible) {
//                 wi = spr.controllers[webGL.Sprite.Fields.sx].value * this.map.data[frameOffset+4];
//                 he = spr.controllers[webGL.Sprite.Fields.sy].value * this.map.data[frameOffset+5];
//             }
//             this.spriteAttributeData[spr.offset+ 3] = wi;
//             this.spriteAttributeData[spr.offset+ 4] = he;
//             this.spriteAttributeData[spr.offset+ 5] = spr.controllers[webGL.Sprite.Fields.rz].value;
//             this.spriteAttributeData[spr.offset+ 6] = spr.controllers[webGL.Sprite.Fields.cr].value;
//             this.spriteAttributeData[spr.offset+ 7] = spr.controllers[webGL.Sprite.Fields.cg].value;
//             this.spriteAttributeData[spr.offset+ 8] = spr.controllers[webGL.Sprite.Fields.cb].value;
//             this.spriteAttributeData[spr.offset+ 9] = spr.controllers[webGL.Sprite.Fields.ca].value;
//             this.spriteAttributeData[spr.offset+10] = this.map.data[frameOffset+0];
//             this.spriteAttributeData[spr.offset+11] = this.map.data[frameOffset+1];
//             this.spriteAttributeData[spr.offset+12] = this.map.data[frameOffset+2];
//             this.spriteAttributeData[spr.offset+13] = this.map.data[frameOffset+3];
//             spr.isDirty = false;
//         }
//     };
//     //#endregion

//     SpriteManager.prototype.render = function render() {
//         webGL.useProgram(this.program, { 'u_projectionView': this.projectionView });
//         gl.activeTexture(gl.TEXTURE0);
//         gl.bindTexture(gl.TEXTURE_2D, this.map.texture.texture);
//         gl.enable(gl.BLEND);
//         gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
//         gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.count);
//     };

//     SpriteManager.prototype.selectRadius = function selectRadius(x, y, r, action, args) {
//         var count = 0;
//         var r2 = r*r;
//         for (var i=0; i<this.count; i++) {
//             var spr = this.sprites[i];
//             var dx = x - spr.controllers[webGL.Sprite.Fields.tx].value;
//             var dy = y - spr.controllers[webGL.Sprite.Fields.ty].value;
//             var d = dx*dx + dy*dy;
//             if (d < r2) {
//                 d = Math.sqrt(d);
//                 count++;
//                 if (action(spr, x,y, dx/d, dy/d, args)) break;
//             }
//         }
//         return count;
//     };

//     SpriteManager.prototype.selectRect = function selectRect(x, y, width, height, action, args) {
//         height = height || width;
//         var x2 = x + width, y2 = y + height;
//         for (var i=0; i<this.count; i++) {
//             var spr = this.sprites[i];
//             var dx = x - spr.controllers[webGL.Sprite.Fields.tx].value;
//             var dy = y - spr.controllers[webGL.Sprite.Fields.ty].value;
//             if (dx < 0 && dy < 0 && spr.controllers[webGL.Sprite.Fields.tx].value < x2 && spr.controllers[webGL.Sprite.Fields.ty].value < y2) {
//                 action(spr, x,y, dx,dy, args);
//             }
//         }
//     };

//     SpriteManager.prototype.checkCollision = function checkCollision() {
//         // #1 brute force: check n*(n-1)/2
//         // #2 use quad tree
//         for (var i=0; i<this.count; i++) {
//             var s1 = this.sprites[i];
//             var r1 = [s1.position.x, s1.position.y, s1.width, s1.height];
//             for (var j=0; j<i; j++) {
//                 var s2 = this.sprites[j];
//                 var r2 = [s2.position.x, s2.position.y, s2.width, s2.height];
//                 if (Fn.intersectRect(r1, r2)) console.log(i, j);
//             }
//         }

//     };

//     SpriteManager.initWebGL = function initWebGL(obj) {
//         if (obj instanceof WebGLRenderingContext) {
//             gl = obj;
//         } else {
//             var canvas = obj;
//             if (!(obj instanceof HTMLCanvasElement)) {
//                 canvas = document.createElement('canvas');
//                 document.body.appendChild(canvas);
//                 canvas.style.position = 'absolute';
//                 canvas.style.left = '0px';
//                 canvas.style.top = '0px';
        
//             }
//             gl = canvas.getContext('webgl2');
//             if (gl == null) throw new Error('webGL not supported!');
//         }
//     };

//     //#region IAdapter implementation
//     SpriteManager.prototype.getInfo = function() { return webGL.SpriteManager.info; };
// 	SpriteManager.prototype.prepareContext = async function prepareContext(data) {
//         var url = data.readString();
//         var count = data.readUint8();
//         await this.initialize(url, count);
//         SpriteManager.base.prepareContext.call(this, data);
// 	};
// 	SpriteManager.prototype.createDeviceImpl = function createDeviceImpl(deviceType, initData) {
// 		var device = null;
// 		switch (deviceType) {
// 			case SpriteManager.Device.Sprite:
//                 device = this.addSprite();
// 				break;
// 			default:
// 				throw new Error(`Invalid device type: ${deviceType}`);
// 		}
// 		return device;
// 	};
// 	SpriteManager.prototype.processCommand = function processCommand(channel, command) {
//         var spr = channel.device;
//         var sequence = channel.sequence;
//         var cursor = channel.cursor;
//         switch (command) {
//             case SpriteManager.Commands.SetSprite:
//                 var fr = sequence.getUint8(cursor++);
//                 var tx = sequence.getFloat32(cursor); cursor += 4;
//                 var ty = sequence.getFloat32(cursor); cursor += 4;
//                 var tz = sequence.getFloat32(cursor); cursor += 4;
//                 var sx = sequence.getFloat32(cursor); cursor += 4;
//                 var sy = sequence.getFloat32(cursor); cursor += 4;
//                 var rz = sequence.getFloat32(cursor); cursor += 4;
//                 var col = sequence.getUint32(cursor); cursor += 4;
//                 var a = col & 0xff; col >>= 8;
//                 var b = col & 0xff; col >>= 8;
//                 var g = col & 0xff; col >>= 8;
//                 var r = col & 0xff;
//                 spr.setFrame(fr);
//                 spr.setPosition([tx, ty, tz]);
//                 spr.setScale([sx, sy, 1.0]);
//                 spr.setRotationZ(rz);
//                 spr.setColor([r/255, g/255, b/255, a/255]);
//                 break;
//             case SpriteManager.Commands.SetFrame:
//                 spr.setFrame(sequence.getUint8(cursor++));
//                 break;
// 			case SpriteManager.Commands.SetPosition:
// 				spr.setPosition([sequence.getFloat32(cursor), sequence.getFloat32(cursor+4), sequence.getFloat32(cursor+8)]);
//                 cursor += 12;
// 				break;
// 			case SpriteManager.Commands.SetScale:
// 				spr.setScale([sequence.getFloat32(cursor++), sequence.getFloat32(cursor++)]);
// 				break;
// 			case SpriteManager.Commands.SetRotation:
// 				spr.setRotationZ(sequence.getFloat32(cursor++));
// 				break;
//             case SpriteManager.Commands.Color:
//                 var col = sequence.getUint32(cursor); cursor += 4;
//                 var a = col && 0xff; col >>= 8;
//                 var b = col && 0xff; col >>= 8;
//                 var g = col && 0xff; col >>= 8;
//                 var r = col && 0xff;
//                 spr.setColor([r/255, g/255, b/255, a/255]);
//                 break;
//             case SpriteManager.Commands.Alpha:
//                 spr.setAlpha(sequence.getUint8(cursor++));
//                 break;
//             case SpriteManager.Commands.Show:
//                 spr.show(true);
//                 break;
//             case SpriteManager.Commands.Hide:
//                 spr.show(false);
//                 break;
//             case SpriteManager.Commands.Delta:
//                 var ci = sequence.getUint8(cursor++);
//                 var df = sequence.getUint16(cursor); cursor += 2;
//                 var dv = sequence.getFloat32(cursor); cursor += 4;
//                 spr.setDelta(ci, df/this.fps, dv);
//                 break;
//             // case SpriteManager.Commands.CHANGE:
//             //     var field = sequence.getUint8(cursor++);
//             //     switch (field) {
//             //        case webGL.Sprite.Fields.tx: spr.position[0] += sequence.getFloat32(cursor); cursor += 4; break;
//             //        case webGL.Sprite.Fields.ty: spr.position[1] += sequence.getFloat32(cursor); cursor += 4; break;
//             //        case webGL.Sprite.Fields.tz: spr.position[2] += sequence.getFloat32(cursor); cursor += 4; break;
//             //        case webGL.Sprite.Fields.sx: spr.scale[0] += sequence.getFloat32(cursor); cursor += 4; break;
//             //        case webGL.Sprite.Fields.sy: spr.scale[1] += sequence.getFloat32(cursor); cursor += 4; break;
//             //        case webGL.Sprite.Fields.rz: spr.rotationZ += sequence.getFloat32(cursor); cursor += 4; break;
//             //        case webGL.Sprite.Fields.col:
//             //            spr.color[0] += sequence.getUint8(cursor++);
//             //            spr.color[1] += sequence.getUint8(cursor++);
//             //            spr.color[2] += sequence.getUint8(cursor++);
//             //            break;
//             //     }
//             //     spr.isDirty = true;
//     	}
// 		return cursor;
// 	};
//     SpriteManager.prototype.setRefreshRate = function(fps) {
//         this.fps = fps;
//     };

//     //#endregion
//     SpriteManager.getInfo = () => webGL.SpriteManager.info;
//     SpriteManager.info = { name: 'SpriteManager', id: 3 };
//     SpriteManager.create = player => Reflect.constructor(webGL.SpriteManager, [player]);
    
//     // device types
//     SpriteManager.Device = {
//         Sprite: 0,
//         Batch: 1
//     };

//     // commands
//     SpriteManager.Commands = {
//         SetFrame:       2,
//         SetPosition:    3,
//         SetScale:       4,
//         SetRotation:    5,
//         SetColor:       6,
//         SetAlpha:       7,
//         SetSprite:      8,
//         Show:           9,
//         Hide:          10,
//         Delta:         11
//     };

//     publish(SpriteManager, 'SpriteManager', webGL);
// })();