import Demo from '/js/demo/base/demo.js'
import Sound from '/js/lib/sound.js'
import WebGL from '/js/lib/webgl/webgl.js'
import {load} from '/js/lib/loader/load.js'
import ComputeShader from '/js/lib/webgl/compute-shader.js'

const _dummy = new Float32Array(256 * 256 * 2);
for (let i = 0; i < _dummy.length;) {
    let col = (i % 200)/200;
    _dummy[i++] = col;
    _dummy[i++] = col;
}

export default class Blank extends Demo {
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
    #computeShader = null;
    #oscWindowWidth = 0;

    get size() {
        return [640, 480];
    }

    getNoteFrequency(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    constructor() {
        super();
        this.settings = {
            osc1:       { value:    3, min:  0, max:      4, step:   1   },
            amp1:       { value: 0.50, min:  .0, max:   1.0, step:  .05  },
            fre1:       { value: 94.0, min:   1, max: 880.0, step:   1   },
            psw1:       { value:  0.2, min:   0, max:   1.0, step:   .05 },

            osc2:       { value:    3, min:  0, max:      4, step:   1   },
            amp2:       { value: 0.15, min:  .0, max:   1.0, step:  .05  },
            fre2:       { value:237.0, min:   1, max: 880.0, step:   1   },
            psw2:       { value:  0.8, min:   0, max:   1.0, step:   .05 },

            osc3:       { value:    3, min:  0, max:      4, step:   1   },
            amp3:       { value: 0.25, min:  .0, max:   1.0, step:  .05  },
            fre3:       { value:281.0, min:   1, max: 880.0, step:   1   },
            psw3:       { value:  0.5, min:   0, max:   1.0, step:   .05 },

            scale:      { value:    1, min:   1, max:   8, step:     1   }
        };
        this.#buffer = new Float32Array(2*256*256);
        this.#buffer.fill(0);
        this.#bufferWrite = 0;
    }

    async initialize() {
        super.initialize();
        this.#sound = new Sound(this.#sampleRate, (left, right, count, offset) => {
            //console.log(this.#bufferWrite, this.#oscWindowWidth);
            let bw = 2*this.#bufferWrite;
            for (let i = 0; i < count; i++) {
                let ls = this.generate(this.#time);
                let rs = this.generate(this.#sampleRate/4+this.#time);
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
        });
        this.#webgl = new WebGL(this.canvas, { fullScreen: true });
        this.#webgl.canvas.width = this.size[0];
        this.#webgl.canvas.height = this.size[1];
        this.#webgl.useExtension('EXT_color_buffer_float');
        const gl = this.#webgl.gl;
        //this.#texture = this.#webgl.createTexture('float[2]', 256, 256);    //, { data: this.#buffer });

        this.#texture = this.#webgl.createTexture('float[2]', 256, 256, {
            minFilter: this.#webgl.gl.NEAREST,
            magFilter: this.#webgl.gl.NEAREST
        });
        //this.#texture = this.#webgl.createTextureFromImage(img1, 'test');

        // // this.#computeShader = new ComputeShader(this.#webgl, 'visual');
        // // this.#computeShader.setProgram();
        // this.#program = this.#webgl.createProgram(
        //     {
        //         vertexSrc: this.#vertexShader,
        //         fragmentSrc: fragmentShader
        //     });
        // this.#program.use();

        // this.#webgl.createBufferFromArrayBuffer(
        //     gl.ARRAY_BUFFER,
        //     new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]),
        //     'vertices'
        // );

        let fragmentShader = await load({ url: './visuals.fs', base:import.meta.url });
        this.#program = this.#webgl.createProgram(
            {
                vertexSrc: this.#vertexShader,
                fragmentSrc: fragmentShader
            });

        this.onChange('scale', this.settings.scale.value);
    }

    osc(type, fre, amp, psw, time) {
        let f = 2 * Math.PI / this.#sampleRate;
        let t = time * f * fre;
        let smp = 0;

        switch (type) {
            case 0: // sine
                smp = Math.sin(2 * Math.PI * fre * time / this.#sampleRate); break;
            case 1: // square
                smp = Math.sin(t) >= psw ? 1 : -1; break;
            case 2: // sawtooth
                smp = 2 * (0.5 * t / Math.PI - Math.floor(0.5*t / Math.PI + 0.5)); break;
            case 3: // triangle
                smp = Math.asin(Math.sin(t)) * (2 / Math.PI); break;
            case 4: // noise
                smp = 2 * Math.random() - 1; break;
            default:
                return 0;
        }

        return amp * smp
    }

    generate(time) {
        let osc1 = this.osc(this.settings.osc1.value, this.settings.fre1.value, this.settings.amp1.value, this.settings.psw1.value, time);
        let osc2 = this.osc(this.settings.osc2.value, this.settings.fre2.value, this.settings.amp2.value, this.settings.psw2.value, time);
        let osc3 = this.osc(this.settings.osc3.value, this.settings.fre3.value, this.settings.amp3.value, this.settings.psw3.value, time);
        return (osc1 + osc2 + osc3) / 3;
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
            case 'scale':
                this.#oscWindowWidth = this.#sound.BUFFER_SIZE*value;
                break;
        }
        return true;
	}

    update(frame, dt) {
        //this.#texture.uploadData(this.#buffer);
        this.#texture.uploadData(this.#buffer);
    }

    render(frame, dt) {
        const gl = this.#webgl.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this.#program.use();
        this.#texture.bind();
        //this.#program.setUniform('uColor', [0.4, 0.6, 1.0, 1.0]);
        this.#program.setUniform('u_resolution', this.size);
        this.#program.setUniform('u_size', this.#oscWindowWidth);
        this.#program.setUniform('u_texture', this.#texture);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // gl.clearColor(0.0, 0.0, 0.0, 1);
        // gl.clear(gl.COLOR_BUFFER_BIT);
        // this.#texture.uploadData(_dummy);
        // this.#texture.bind();
        // this.#program.setUniform('u_texture', this.#texture);
        // //this.#program.setUniform('u_size', this.size);

        // gl.drawArrays(gl.TRIANGLES, 0, 6);
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
