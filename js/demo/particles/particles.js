import Demo from '/js/demo/base/demo.js'
import WebGL from '/js/lib/webgl/webgl.js';
import Vec4 from "/js/lib/math/vec4.js";
import ParticleManager from '/js/lib/webgl/particle/particle-manager.js';
import ComputeShader from '/js/lib/webgl/compute-shader.js';

const FloatsPerParticle = 16;

export default class Particles extends Demo {
    #webgl = null;
    #textures = [null, null];

    #lastIndex = 0;
    #count = 0;

    #cs = null;
    #ptMgr = null;

    #acceleration = new Vec4();

    get size() {
        return [800, 600];
    }

    constructor() {
        super();
        this.settings = {
            set:        { value: 100, min:  10, max: 500, step:  10 },
            ratio:      { value:   3, min:   1, max:  10, step:   1 },
          //time:       { value:  80, min:   1, max: 200, step:   5 },
          //scale:      { value:   4, min:   1, max:  10, step:   1 },
            random:     { value:  .8, min:  .0, max:  1., step:  .1 },
            area:       { value: .02, min:   0, max:  .4, step: .01 },
            life:       { value:   2, min:   1, max:  20, step:   1 },
            speed:      { value:   3, min:   0, max:  10, step: .25 },
            angle:      { value:  90, min:   0, max: 360, step:   10 },
            size:       { value:   2, min:   1, max:  10, step:   1 }
        };

        this.#webgl = new WebGL(
            document.querySelector('canvas'),
            {
                fullScreen: true,
                scaleX: 1.0,
                scaleY: 1.0});
        this.#webgl.useExtension('EXT_color_buffer_float');
        const gl = this.#webgl.gl;
        this.#count = 100000;
        this.#ptMgr = new ParticleManager(this.#webgl, this.#count);
        //this.#ptMgr.diffuseColor = [1.0, 1.0, 1.0, 1.0];

        //this.#ptMgr.addParticles = () => this.addParticles;
        //ptMgr.addParticles();
        this.#textures[0] = this.#ptMgr.dataTexture;
    
        // create compute shader
        this.#cs = new ComputeShader(this.#webgl, 'cs1');
        this.#cs.setInput(this.#textures[0]);
        this.#textures[1] = this.#cs.setOutput();
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
        this.#ptMgr.dataTexture = this.#cs.output;
        this.updateWind();
    }

    async initialize() {
        super.initialize();
    }

    updateWind() {
        this.#acceleration.fromPolar(0.1, 2.0 * Math.PI / 360 * this.settings.angle.value, 0.5 * Math.PI);
    }

    addParticles(settings) {
        settings = settings || this.settings;
        let tex = this.#textures[this.#cs.index];
        tex.bind(0);
        let rnd = settings.random.value;
        let ix = this.#lastIndex * FloatsPerParticle;
        let phi = 0.5 * Math.PI;
        for (let pi=0; pi<settings.set.value; pi++) {
            let theta = 2 * Math.PI * Math.random();
            let position = new Vec4(tex.data, ix)
            let rnd0 = 1.0 - rnd + rnd * Math.random();
            position.fromPolar(settings.area.value * rnd0, theta, phi);
            position.inc(this.glMousePos);
            position.w = 1.0;
            let velocity = new Vec4(tex.data, ix+4)
            let rnd1 = 1.0 - rnd + rnd * Math.random();
            let speed = 0.05 * settings.speed.value * rnd1;
            velocity.fromPolar(speed, theta, phi);
            velocity.w = 0.0;
            let misc = new Vec4(tex.data, ix+8);
            // life, time, size, unused
            let rnd2 = 1.0 - rnd + rnd * Math.random();
            let rnd3 = 1.0 - rnd + rnd * Math.random();
            misc.set(settings.life.value * rnd2, 0.0, settings.size.value * rnd3, 1.0);
            let color = new Vec4(tex.data, ix+12);
            color.set(
                1.0 - rnd + rnd * Math.random(),
                1.0 - rnd + rnd * Math.random(),
                1.0 - rnd + rnd * Math.random(),
                0.6
            );

            ix += FloatsPerParticle;
            this.#lastIndex++;
            if (this.#lastIndex == this.#count) {
                this.#lastIndex = 0;
                ix = 0;
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
        if (id == 'angle') {
            this.updateWind();
        }
        return true;
    }

    update(frame, dt) {
        if (frame % this.settings.ratio.value === 0) {
            this.addParticles();
        }
    }
    
    render(frame, dt) {
        this.#cs.run({
            u_time: dt / 1000.0,
            u_acc: this.#acceleration
        });
        this.#cs.readOutput();
        this.#cs.feedback();
    
        this.#webgl.gl.viewport(0, 0, this.#webgl.canvas.width, this.#webgl.canvas.height);
        this.#ptMgr.render(frame, dt);
    }

    onPointerDown(e) {
        super.onPointerDown(e);
        let settings = {};
        for (let key in this.settings) {
            settings[key] = { value: this.settings[key].value };
        }
        settings.speed.value *= 2;
        settings.set.value *= 4;
        settings.random.value = 0.4;
        settings.life.value *= 2.0;
        this.addParticles(settings);
    }

    onWheel(e) {
        if (e.deltaY > 0) this.settings.angle.control.inc();
        else if (e.deltaY < 0) this.settings.angle.control.dec();
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
