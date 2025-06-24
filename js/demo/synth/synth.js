import Demo from '/js/demo/base/demo.js'
import Sound from '/js/lib/sound.js'
import WebGL from '/js/lib/webgl/webgl.js'
import {load} from '/js/lib/loader/load.js'
import { lerp } from '/js/lib/fn.js'

class FltStage {
    ai = new Array(3);    // nominator coeffs
    bi = new Array(3);    // LP denominator coeffs
    ci = new Array(3);    // HP denominator coeffs
    ui = new Array(3);    // LP inputs
    vi = new Array(3);    // HP inputs
    lp = new Array(2);    // LP outputs
    hp = new Array(2);    // HP outputs

    constructor() {
        this.ai.fill(0);
        this.bi.fill(0);
        this.ci.fill(0);
        this.ui.fill(0);
        this.vi.fill(0);
        this.lp.fill(0);
        this.hp.fill(0);
    }

    run() {
        return 0.0;
    }

    update(e, g) {

    }
}
    
class FltStage1Pole extends FltStage {
    constructor() {
        super();
        this.ci[0] = 1.0;
        this.ci[1] = -1.0;
    }

    run() {
        // let gain = 1.0f / ai_[0];
        // y0 = (b0*u0 + b1*u1 - a1*y1)/a0
        let lp = (this.bi[0] * this.ui[0] + this.bi[1] * this.ui[1] - this.ai[1] * this.lp[0]) / this.ai[0];        // * gain;
        let hp = (this.ci[0] * this.vi[0] + this.ci[1] * this.vi[1] - this.ai[1] * this.hp[0]) / this.ai[0];
        this.ui[1] = this.ui[0];
        this.vi[1] = this.vi[0];
        this.lp[0] = lp;
        this.hp[0] = hp;
    }
        
    update(e, g) {
        this.bi[0] = this.bi[1] = e;
        // this.ci[0] = 1.0;
        // this.ci[1] = -1.0;
        this.ai[0] = e + 1;
        this.ai[1] = e - 1;
    }
}

class Flt {
    #stages = [];
    #stageCount = 0;

    constructor(poleCount = 1) {
        this.#stages.push(new FltStage1Pole());
        this.#stageCount = 1;
    }

    run(u0) {
        let lp = u0;
        let hp = lp;

        for (let i = 0; i < this.#stageCount; i++) {
            let stage = this.#stages[i];
            stage.ui[0] = lp;
            stage.vi[0] = hp;
            stage.run();
            lp = stage.lp[0];
            hp = stage.hp[0];
        }

        // hp = u0 - lp;
        let output = 0.0;
        // let mode = values_->mode.b;
        // if ((mode & FmLowPass) != 0)
        output += lp;
        // if ((mode & FmHighPass) != 0) output += hp;
        // if ((mode & FmBandPass) != 0) {
        //     output += (u0 - hp - lp);
        // }

        return output;
    }

    update(cut, res) {
        let q = res < 0.000001 ? 1.0 : 1.0 - res;
        let e = 0.5 * cut * cut;    //0.5 * Math.PI * cut;
        if (e <= 0) e = 0.001;
        let g = -q * e;

        for (var i = 0; i < this.#stageCount; i++) {
            this.#stages[i].update(e, g);
        }
    }
}

export default class Synth extends Demo {
    static waveforms = ['Sinus', 'Pulse', 'Saw', 'Tri', 'Noise'];
    static synthMode = ['AM', 'add'];
    #sampleRate = 48000;
    #sound = null;
    #time = 0;
    #buffer = null;
    #bufferWrite = 0;
    #webgl = null;
    #program = null;
    #texture = null;
    #vertexShader =
        `#version 300 es
        out vec2 v_texcoord;

        void main() {
        // 6 vertices for two triangles forming a quad
        int id = gl_VertexID;
        vec2 pos = vec2((id == 0 || id == 2 || id == 4) ? -1.0 : 1.0,
                        (id == 0 || id == 1 || id == 3) ? -1.0 : 1.0);
        v_texcoord = pos * 0.5 + 0.5;
        gl_Position = vec4(pos, 0.0, 1.0);
        }`;

    #prevValues = [0, 0, 0];
    #flt = null;

    #oscWindowWidth = 0;

    get size() {
        return [800, 600];
    }

    getNoteFrequency(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    constructor() {
        super();
        this.settings = {
            osc1:       { list: Synth.waveforms, value:2  },
            amp1:       { value: 0.50, min:  .0, max:   1.0, step:  .05  },
            fre1:       { value: 94.0, min:   1, max:3520.0, step:   1   },
            psw1:       { value:  0.2, min:   0, max:   1.0, step:   .01 },

            osc2:       { list: Synth.waveforms, value:2  },
            amp2:       { value: 0.15, min:  .0, max:   1.0, step:  .05  },
            fre2:       { value:237.0, min:   1, max:3520.0, step:   1   },
            psw2:       { value:  0.8, min:   0, max:   1.0, step:   .01 },

            osc3:       { list: Synth.waveforms, value:2  },
            amp3:       { value: 0.25, min:  .0, max:   1.0, step:  .05  },
            fre3:       { value:281.0, min:   1, max:3520.0, step:   1   },
            psw3:       { value:  0.5, min:   0, max:   1.0, step:   .01 },

            cut:        { value:  0.5, min:   0, max:   1.0, step:   .01 },
            res:        { value:  0.5, min:   0, max:   1.0, step:   .01 },

            mode:       { list: Synth.synthMode, value: 0 },

            scale:      { value:    1, min:   1, max:   8, step:     1   },
            type:       { value:    0, min:   0, max:   3, step:     1   }
        };
        this.#buffer = new Float32Array(2*256*256);
        this.#buffer.fill(0);
        this.#bufferWrite = 0;

        this.#flt = [];
        this.#flt.push(new Flt());
        this.#flt.push(new Flt());
    }

    generateSamples(left, right, count) {
        let bw = 2*this.#bufferWrite;
        for (let i = 0; i < count; i++) {
            let ls = this.generate(this.#time);
            let rs = this.generate(this.#sampleRate/4+this.#time);
            ls = this.#flt[0].run(ls);
            rs = this.#flt[1].run(rs);
            this.#buffer[bw++] = ls;
            this.#buffer[bw++] = rs;
            left[i] = ls;
            right[i] = rs;
            this.#time++;
        }
        this.#bufferWrite += count;
        if (this.#bufferWrite >= this.#oscWindowWidth) {
            this.#bufferWrite = 0;
        }
    }

    async initialize() {
        super.initialize();
        this.#sound = new Sound(this.#sampleRate, (left, right, count, offset) => {
            this.generateSamples(left, right, count);
        });
        this.#webgl = new WebGL(this.canvas, { fullScreen: true });
        this.#webgl.canvas.width = this.size[0];
        this.#webgl.canvas.height = this.size[1];
        this.#webgl.useExtension('EXT_color_buffer_float');
        const gl = this.#webgl.gl;

        this.#texture = this.#webgl.createTexture('float[2]', 256, 256, {
            minFilter: this.#webgl.gl.NEAREST,
            magFilter: this.#webgl.gl.NEAREST
        });

        let fragmentShader = await load({ url: './visuals.fs', base:import.meta.url });
        this.#program = this.#webgl.createProgram(
            {
                vertexSrc: this.#vertexShader,
                fragmentSrc: fragmentShader.content
            });

        this.onChange('scale', this.settings.scale.value);

        this.#flt[0].update(this.settings.cut.value, this.settings.res.value);
        this.#flt[1].update(this.settings.cut.value, this.settings.res.value);
    }

    osc(id, type, fre, psw, time) {
        // let f = 2 * Math.PI / this.#sampleRate;
        // let t = time * f * fre;
        
        let smp = 0;
        let f = fre / this.#sampleRate;
        let t = time * f;
        let ph = t - Math.trunc(t);

        switch (type) {
            case 0: // sine
                smp = Math.sin(2 * Math.PI * t); break;
            case 1: // square
                smp = ph >= psw ? 1 : -1; break;
            case 2: // sawtooth
                smp = ph < psw ? 1 - 2*ph/psw : -1; break;
            case 3: // triangle
                smp = ph < psw ? 2*ph/psw - 1 : 2*(1-ph)/(1-psw) - 1; break;
            case 4: // noise
                f = 8 * fre / this.#sampleRate;
                t = time * f;
                ph = t - Math.trunc(t);
                if (ph < f || ph > psw-f/2 && ph < psw+f/2) {
                    this.#prevValues[id] = 2*Math.random()-1;
                }
                smp = this.#prevValues[id]; //ph >= psw ? this.#prevValues[id] : -this.#prevValues[id];
                break;
            default:
                return 0;
        }

        return smp;
    }

    flt(cut, res, mode, buffer, time) {

    }

    generate(time) {
        let osc1 = this.osc(0, this.settings.osc1.value, this.settings.fre1.value, this.settings.psw1.value, time);
        let osc2 = this.osc(1, this.settings.osc2.value, this.settings.fre2.value, this.settings.psw2.value, time);
        let osc3 = this.osc(2, this.settings.osc3.value, this.settings.fre3.value, this.settings.psw3.value, time);
        let out = 0.0;
        if (this.settings.mode.value == 1) {
            out = this.settings.amp1.value*osc1;
            out += this.settings.amp2.value*osc2;
            out += this.settings.amp3.value*osc3;
            out /= 3;
        } else {
            out =  lerp(1.0, osc1, this.settings.amp1.value);
            out *= lerp(1.0, osc2, this.settings.amp2.value);
            out *= lerp(1.0, osc3, this.settings.amp3.value);
        }
        return out;
    }        

	onChange(id, value) {
        switch (id) {
            // case 'osc1':
            // case 'amp1':
            // case 'fre1':
            // case 'psw1':
            // case 'osc2':
            // case 'amp2':
            // case 'fre2':
            // case 'psw2':
            case 'cut':
                this.#flt[0].update(value, this.settings.res.value);
                this.#flt[1].update(value, this.settings.res.value);
                break;
            case 'res':
                this.#flt[0].update(this.settings.cut.value, value);
                this.#flt[1].update(this.settings.cut.value, value);
                break;
            case 'scale':
                this.#oscWindowWidth = this.#sound.BUFFER_SIZE*value;
                break;
        }
        return true;
	}

    update(frame, dt) {
        this.#texture.uploadData(this.#buffer);
        this.#program.setUniform('u_type', this.settings.type.value);
    }

    render(frame, dt) {
        const gl = this.#webgl.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this.#program.use();
        this.#texture.bind();

        this.#program.setUniform('u_resolution', this.size);
        this.#program.setUniform('u_size', this.#oscWindowWidth);
        this.#program.setUniform('u_texture', this.#texture);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    async run() {
        super.stop();
    }

    start() {
        super.start();
        this.#sound.start();
    }

    stop() {
        super.stop();
        this.#sound.stop();
    }
}
