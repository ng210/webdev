import Demo from '/js/demo/base/demo.js'
import WebGL from '/js/lib/webgl/webgl.js';
import Vec4 from "/js/lib/math/vec4.js";
import ParticleManager from '/js/lib/webgl/particle/particle-manager.js';
import ComputeShader from '/js/lib/webgl/compute-shader.js';

const FloatsPerParticle = 16;

export default class Explode extends Demo {
    #webgl = null;
    #textures = [null, null];

    #count = 0;
    #width = 0;
    #height = 0;

    #cs = null;
    #ptMgr = null;

    #acceleration = new Vec4();

    get size() {
        return [320, 200];
    }

    updateSize() {
        let scale = this.settings.scale.value / this.settings.scale.max;
        this.#width = Math.floor(scale * this.#webgl.canvas.width);
        this.#height = Math.floor(scale * this.#webgl.canvas.height);
        this.#count = this.#width * this.#height;
        this.#ptMgr.setCount(this.#count);
        this.#textures[0] = this.#ptMgr.dataTexture;
        this.updateComputeShader();
    }

    updateComputeShader() {
        this.#cs.setInput(this.#textures[0]);
        this.#textures[1] = this.#cs.setOutput();
    }

    constructor() {
        super();
        this.settings = {
            scale:      { value: 100, min:  10, max: 100, step:   5 },
            random:     { value:  .5, min:  .0, max:  1., step:  .1 },
            life:       { value:   4, min:   1, max:  20, step:   1 },
            speed:      { value:   5, min:   0, max:  10, step:   1 }
        };

        let scale = this.settings.scale.value / this.settings.scale.max;
        this.#webgl = new WebGL(
            document.querySelector('canvas'),
            {
                fullScreen: true,
                scaleX: scale,
                scaleY: scale
            });
        this.#webgl.useExtension('EXT_color_buffer_float');

        this.#ptMgr = new ParticleManager(this.#webgl);
        this.#cs = new ComputeShader(this.#webgl, 'cs1');
        this.#cs.setProgram(
            `#version 300 es
            precision highp float;
            precision highp sampler2D;
            out vec4 result;
            vec4 position;
            vec4 velocity;
            vec4 misc;
            vec4 color;
            uniform sampler2D u_texture;
            uniform float u_time;
            uniform vec4 u_acc;

            const int ELEMENT_SIZE = 4;         // 4 vec4: position, velocity, misc, color
    
            void main() {
                ivec2 uv = ivec2(gl_FragCoord);
                int ix = uv.x % ELEMENT_SIZE;
                uv.x -= ix;
                position = texelFetch(u_texture, uv, 0);
                uv.x += 1;
                velocity = texelFetch(u_texture, uv, 0);
                uv.x += 1;
                misc = texelFetch(u_texture, uv, 0);
                uv.x += 1;
                color = texelFetch(u_texture, uv, 0);
    
                switch (ix) {
                    case 0: // position
                        result = position + u_time * velocity;
                        break;
                    case 1: // velocity
                        result = velocity + u_time * u_acc;
                        break;
                    case 2: // misc: life, time, size, unused
                        misc.y += u_time;
                        misc.z += 2. * u_time;
                        result = misc;
                        break;
                    case 3: // color
                        color.a = 1.0 - clamp(misc.y / misc.x, 0.0, 1.0);
                        if (misc.y > misc.x) {
                            color.a = 0.0;
                        }
                        result = color;
                        break;
                }
            }`);
        this.updateSize();
    }

    async initialize() {
        super.initialize();
        let image = new Image();
        image.src = '/js/demo/assets/goldenaxe.gif';
        await image.decode();
        this.addParticlesFromImage(image);
    }

    addParticlesFromImage(image) {
        let tex = this.#textures[this.#cs.index];
        tex.bind(0);
        let rnd = this.settings.random.value;
        let imageData = this.#webgl.getImageData(image);
        let ix = 0;
        for (let y=0; y<this.#height; y++) {
            let ry = y * image.height / this.#height;
            let piy1 = Math.trunc(ry);
            let piy2 = Math.min(piy1 + 1, image.height);
            let pfy = ry - piy1;
            piy1 *= 4*image.width;
            piy2 *= 4*image.width;
            for (let x=0; x<this.#width; x++) {
                // position
                tex.data[ix++] = 2 * x / this.#width - 1.0;
                tex.data[ix++] = 2 * y / this.#height - 1.0;
                tex.data[ix++] = 0.0;
                tex.data[ix++] = 1.0;
                // velocity
                tex.data[ix++] = 0.0;
                tex.data[ix++] = 0.0;
                tex.data[ix++] = 0.0;
                tex.data[ix++] = 0.0;
                // misc
                tex.data[ix++] = 1000.0;
                tex.data[ix++] = 0.0;
                tex.data[ix++] = 2.0;
                tex.data[ix++] = 0.0;
                // color
                let rx = x * image.width / this.#width;
                let pix1 = Math.trunc(rx);
                let pix2 = 4 * Math.min(pix1 + 1, image.width);
                let pfx = rx - pix1;
                pix1 *= 4;
                const lerp = (arr, offs, x1, x2, fx) => arr[offs + x1]*fx + arr[offs + x2]*(1.0 - fx);
                const bilinear = (arr, x1, x2, fx, y1, y2, fy) => lerp(arr, 0, lerp(arr, y1, x1, x2, fx), lerp(arr, y2, x1, x2, fx),  fy);
                tex.data[ix++] = 20*imageData.data[(piy1*image.width + pix1)*4 + 0]/255;   //bilinear(imageData, pix1+0, pix2+0, pfx, piy1, piy2, pfy);
                tex.data[ix++] = 20*imageData.data[(piy1*image.width + pix1)*4 + 1]/255;   //bilinear(imageData, pix1+1, pix2+1, pfx, piy1, piy2, pfy);
                tex.data[ix++] = 20*imageData.data[(piy1*image.width + pix1)*4 + 2]/255;   //bilinear(imageData, pix1+2, pix2+2, pfx, piy1, piy2, pfy);
                tex.data[ix++] = 1.0;   //bilinear(imageData, pix1+3, pix2+3, pfx, piy1, piy2, pfy);
            }
        }
        const gl = this.#webgl.gl;
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, tex.width, tex.height, tex.format, tex.type, tex.data);
    }

    onChange(id, value) {
        // if (id == 'count') {
        //     this.stop();
        //     setTimeout(() => {
        //         this.addParticles();
        //         this.start();
        //     }, 0);
        // }
        return true;
    }

    update(frame, dt) {
    }
    
    render(frame, dt) {
        // this.#cs.run({
        //     u_time: dt / 1000.0,
        //     u_acc: this.#acceleration
        // });
        // this.#cs.readOutput();
        // this.#cs.feedback();
    
        this.#webgl.gl.viewport(0, 0, this.#webgl.canvas.width, this.#webgl.canvas.height);
        // this.#ptMgr.dataTexture = this.#cs.output;
        this.#ptMgr.render(frame, dt);
    }

    onPointerDown(e) {
        super.onPointerDown(e);
    }

    onWheel(e) {
    }

    // frc_gravity(particle, frame, dt) {
    //     particle.acceleration.inc(this.#gravity);
    // }

    // cst_lifespan(particle, frame, dt) {
    //     particle.elapsed += dt;
    //     if (particle.elapsed >= particle.lifespan) {
    //         // reset particle;
    //         this.resetParticle(particle);
    //     }
    // }

    // resetParticle(particle) {
    //     switch (this.settings.position.value) {
    //         case 'Center': 
    //             this.fromCenter(particle);
    //             particle.forces.length = 0;
    //             break;
    //         case 'Screen':
    //             this.onFullScreen(particle);
    //             particle.forces.length = 0;
    //             particle.forces.push((p, fr, dt) => this.frc_gravity(p, fr, dt));
    //             break;
    //     }

    //     switch (this.settings.render.value) {
    //         case 'Dot': particle.renderCallback = Particle.defaultRender; break;
    //         case 'Letter': particle.renderCallback = Particle.renderCharacter; break;
    //     }

    //     particle.data = String.fromCharCode(33 + Math.floor(89*Math.random()));
    //     particle.size = this.settings.size.min + Math.random() * (this.settings.size.value - this.settings.size.min);
    //     particle.lifespan = 0.5*(1 + Math.random()) * this.settings.life.value * 1000/this.settings.time.value;
    //     particle.elapsed = 0;
    // }

    // #randomVector() {
    //     let v2 = Vec2.random();
    //     let norm = (this.settings.radius.value - this.settings.radius.min) /(this.settings.radius.max - this.settings.radius.min);
    //     let scale = norm*0.24 + 0.01;
    //     return v2.scale(Math.random()*Math.min(this.frontBuffer.width, this.frontBuffer.height)*scale);

    // }

    // fromCenter(particle) {
    //     let dir = this.#randomVector();
    //     particle.velocity.set(dir.x, dir.y);
    //     particle.velocity.scale(0.3);
    //     if (this.mouseButtons & 1) {
    //         this.#lastMousePos.x = this.mousePos.x;
    //         this.#lastMousePos.y = this.mousePos.y;
    //     }
    //     dir.x += this.#lastMousePos.x;
    //     dir.y += this.#lastMousePos.y;
    //     particle.setPosition(dir.x, dir.y);
    //     Vec2.free(1);
    // }

    // onFullScreen(particle) {
    //     let x = Math.random() * this.frontBuffer.width;
    //     let y = Math.random() * this.frontBuffer.height;
    //     let dir = this.#randomVector();
    //     particle.velocity.set(dir.x, dir.y);
    //     particle.velocity.scale(0.1);
    //     particle.setPosition(x, y);
    //     Vec2.free(1);
    // }
}
