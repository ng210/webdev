// I have a model that simulates heat spreading in 2D.
// The design is this.
// The plane is divided into cells, each cell has a heat value.
// Heat is spread between neighbouring cells, the spread ratio is a variable.
// There can be a cooling variable as well that generally reduces heat values.
// Initially there are a few non-zero heat values, either following a pattern
// (like perlin noise) or are distributed in a total random way.
// For a single heat value of a cell, in each iteration it is calculated
// how much heat is spread to the neighbouring cells, optionally how much heat is lost due to cooling.
// I consider the top, left, right, bottom neightbours only.
// Important, that at the 4 corners there are only 2 neighbours and along the edges there are only 3.
// This could be solved by turning any heat value along the edges and corners into 0,
// that would assume the edge being a infinite heat consumer.

// Example: we have a 3x3 model (9 cells) with only the middle heat value at coordinates (1,1) being 1.0,
// all others are 0.0. Spread is 0.5 and cooling is 0.1. After the first iteration,
// according to the spread variable the middle heat value loses 50% of its heat by spreading it to its 4 neighbours.
// It also cools by 10% because cooling is 0.1 that is only 90% of its initially heat will remain for the next iteration. 
// Initial state, texture data: [0.000, 0.000, 0.000,  0.000, 1.000, 0.000,  0.000, 0.000, 0.000]
// 1st iteration, texture data: [0.000, 0.125, 0.000,  0.125, 0.450, 0.125,  0.000, 0.125, 0.000]
// middle value = 0.45*0.9-0.5*0.45+4*0.125*0.5 = 0.43
// The remaining heat after cooling by 10% is 0.45*0.9.
// The heat loss due to heat spread is 0.45*0.5.
// The heat gain from the 4 neighbouring cells is 4*0.125*0.5.
// 2nd iteration, texture data: [0.000, 0.125, 0.000,  0.125, 0.450, 0.125,  0.000, 0.125, 0.000]


import Demo from '../base/demo.js'
import { load } from '../../lib/loader/load.js';
import WebGL from '../../lib/webgl/webgl.js';
//import Vec4 from "../../lib/math/vec4.js";
import ComputeShader from '../../lib/webgl/compute-shader.js';
import Noise from '../../lib/math/noise.js'

export default class Fire extends Demo {
    #webgl = null;
    #cs = null;
    #program = null;
    #textures = new Array(2);
    #images = [];

    static SIZE = 1024;

    static images = {
        sample: 'assets/sample.png',
        deepspace: 'assets/deepspace.jpg',
        fire: 'assets/fire.png',
        tilduska: 'assets/tilduska.png',
        hexa: 'assets/hexa.png'};

    get size() {
        return [800, 600];
    }

    constructor() {
        super();
        this.settings = {
            image:      { list: Object.keys(Fire.images), value: 0 },
            random:     { value: 0.40, min: 0.0, max: 0.5, step: 0.01 },
            cooling:    { value: 0.70, min: 0.0, max: 1.0, step: 0.01 },
            spread:     { value: 0.70, min: 0.0, max: 1.0, step: 0.01 },
            time:       { value: 0.25, min: 0.0, max: 1.0, step: 0.01 }
        };

        this.#webgl = new WebGL(
            document.querySelector('canvas'),
            {
                fullScreen: true,
                scaleX: 1.0,
                scaleY: 1.0});
        this.#webgl.useExtension('EXT_color_buffer_float');
    }

    async initialize() {
        super.initialize();

		let urls = Object.values(Fire.images);
		for (let url of urls) {
            let img = await load({url: url, base: document.scripts[0].src})
            .then(async resp => {
                if (resp instanceof Error) {
                    console.log(url, resp.message);
                    return null;
                } else {
                    const img = new Image();
                    img.src = URL.createObjectURL(resp.content);
                    await img.decode();
                    return img;
                }
            });
            if (img) this.#images.push(img);
        }

        let heatBuffer = this.#createHeatBuffer(this.#images[this.settings.image.value]);
        // create compute shader
        this.#cs = new ComputeShader(this.#webgl, 'cs1');
        this.#textures[0] = this.#cs.setInput(heatBuffer, 4);
        this.#textures[1] = this.#cs.setOutput();
        this.#cs.setProgram(
            `#version 300 es
            precision highp float;

            uniform sampler2D u_texture;
            uniform float uRandom;
            uniform float uSpread;
            uniform float uCooling;
            uniform float uTime;

            out vec4 outData;

            float rand(vec2 co, float seed) {
                return fract(sin(dot(co * seed, vec2(12.9898, 78.233))) * 43758.5453);
            }

            float randDelta(vec2 co, float seed, float strength) {
                float r = rand(co, seed);
                // Convert to centered delta in [-1.0, 1.0]
                float delta = (r * 2.0 - 1.0) * strength;
                return delta;
            }

            void main() {
                ivec2 coord = ivec2(gl_FragCoord.xy);
                ivec2 texSize = textureSize(u_texture, 0);

                // Fetch center cell data
                vec4 center = texelFetch(u_texture, coord, 0);

                // Neighbor coordinates
                ivec2 up        = coord + ivec2(0, 1);
                ivec2 down      = coord + ivec2(0, -1);
                ivec2 left      = coord + ivec2(-1, 0);
                ivec2 right     = coord + ivec2(1,  0);
                ivec2 downLeft  = coord + ivec2(-1, -1);
                ivec2 downRight   = coord + ivec2(1, -1);

                vec4 upCell         = (coord.y > 0)             ? texelFetch(u_texture, up, 0)      : vec4(0.0, 0.0, 0.0, 1.0);
                vec4 downCell       = (coord.y < texSize.y - 1) ? texelFetch(u_texture, down, 0)    : vec4(0.0, 0.0, 0.0, 1.0);
                vec4 leftCell       = (coord.x > 0)             ? texelFetch(u_texture, left, 0)    : vec4(0.0, 0.0, 0.0, 1.0);
                vec4 rightCell      = (coord.x < texSize.x - 1) ? texelFetch(u_texture, right, 0)   : vec4(0.0, 0.0, 0.0, 1.0);
                vec4 downLeftCell   = (coord.y > 0 &&
                                       coord.x > 0)             ? texelFetch(u_texture, downLeft, 0)  : vec4(0.0, 0.0, 0.0, 1.0);
                vec4 downRightCell  = (coord.y > 0 &&
                                       coord.x < texSize.x - 1) ? texelFetch(u_texture, downRight, 0) : vec4(0.0, 0.0, 0.0, 1.0);


                // --- Heat loss ---
                // Heat pulled by neighbors based on THEIR spread values (from this cell)
                float remainingHeat = center.x * (1.0 - uSpread * center.z);

                // --- Heat gain ---
                float received = 0.0;
                received += 1.00*upCell.x / upCell.w;
                received += 7.00*downCell.x / downCell.w;
                received += 3.00*leftCell.x / leftCell.w;
                received += 3.00*rightCell.x / rightCell.w;
                received += 1.00*downLeftCell.x / downLeftCell.w;
                received += 1.00*downRightCell.x / downRightCell.w;
                received *= uSpread * mix(1.0, rand(vec2(coord), uTime), uRandom);

                // --- Supply with noise ---
                float supply = center.y * clamp(randDelta(vec2(coord), uTime, uRandom), 0.0, 1.0);
                // center.y += clamp(randDelta(vec2(coord), uTime, uRandom), -0.5, 0.5);

                // --- Final heat computation ---
                center.x = clamp((remainingHeat + received + center.y) * (1.0 - uCooling), 0.0, 2.0);

                // Output new state: heat stays in .x, preserve supply/spread/spreadSum
                outData = center;
            }`);

        this.#program = this.#webgl.createProgram(
            {
                vertexSrc: WebGL.screenVShader,
                fragmentSrc:
               `#version 300 es
                precision mediump float;
                out vec4 fragColor;
                in vec2 v_texcoord;
                uniform sampler2D u_texture;
                uniform vec4 uColor;
                uniform float uThresholds[7];

                vec4[6] colors = vec4[6](
                    vec4(0.0, 0.0, 0.0, 0.0),
                    vec4(0.2, 0.3, 0.3, 0.7),
                    vec4(0.5, 0.3, 0.3, 0.8),
                    vec4(0.8, 0.5, 0.4, 0.9),
                    vec4(1.0, 0.8, 0.6, 1.0),
                    vec4(1.0, 1.0, 1.0, 1.0));

                void main() {
                    float value = clamp(texture(u_texture, v_texcoord).x, 0.0, 2.0);
                    vec4 color = colors[0];

                    for (int i = 0; i < 5; i++) {
                        float t0 = uThresholds[i];
                        float t1 = uThresholds[i + 1];
                        float weight = clamp((value - t0) / (t1 - t0), 0.0, 1.0);
                        color = mix(color, colors[i + 1], weight);
                    }

                    fragColor = uColor * color;
                }`
            });
        this.#program.use();

    }

    onChange(id, value) {
        switch (id) {
            case 'image':
                let heatBuffer = this.#createHeatBuffer(this.#images[value]);
                this.#textures[0] = this.#cs.setInput(heatBuffer, 4);
                this.#textures[1] = this.#cs.setOutput();
                break;
        }
        return true;
    }

    update(frame, dt) {
        // use compute shader to calculate heat values
        this.#cs.run({
            // uFrame: frame,
            uRandom: this.settings.random.value,
            uTime: frame * this.settings.time.value / 100.0,
            uCooling: this.settings.cooling.value,
            uSpread: this.settings.spread.value
         });
        this.#cs.feedback();
    }

    render(frame, dt) {
        let gl = this.#webgl.gl;
        // render data texture transforming heat values into colors
        this.#program.use();
        this.#program.setUniform('uColor', [1.0, 1.0, 1.0, 1.0]);
        this.#program.setUniform('uThresholds', [0.00, 0.20, 0.40, 0.60, 1.20, 1.80, 2.00]);
        this.#cs.output.bind();
        // draw
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    #createHeatBuffer(img) {
        let buffer = new Float32Array(4*Fire.SIZE*Fire.SIZE)
        let ix = 0;
        let ns = new Noise(0);
        let rx = img.width / Fire.SIZE;
        let ry = img.height / Fire.SIZE;
        let imgData = WebGL.getImageData(img);

        let sy = img.height - 1;
        for (let j=0; j<Fire.SIZE; j++) {
            let si = Math.floor(sy) * img.width;
            let sx = 0.0;
            for (let i=0; i<Fire.SIZE; i++) {
                // heat value
                buffer[ix++] = 0.0;
                // supply
                let six = si + Math.floor(sx);
				var v = 0.2989 * imgData.data[six*4] +
						0.5870 * imgData.data[six*4+1] +
						0.1140 * imgData.data[six*4+2];
				buffer[ix++] = v / 255;
                sx += rx;
                //buffer[ix++] = Math.random() > 0.999 ? ns.fbm2d(i, j, 3, 0.000005, 0.0001*Fire.SIZE, 0.997, 2.03) : 0.0;
                // spread
                buffer[ix++] = 0.6 + 0.4*Math.random();
                // sum spread
                buffer[ix++] = 0.0;
            }
            sy -= ry;
        }
        ix = 0;
        for (let j=0; j<Fire.SIZE; j++) {
            for (let i=0; i<Fire.SIZE; i++) {
                if (j > 0 && j < Fire.SIZE-1 && i > 0 && i < Fire.SIZE-1) {
                    buffer[ix+3] =  buffer[ix-4*Fire.SIZE+2];   // top
                    buffer[ix+3] += buffer[ix+4*Fire.SIZE+2];   // bottom
                    buffer[ix+3] += buffer[ix-4+2];             // left
                    buffer[ix+3] += buffer[ix+4+2];             // right
                } else {
                    buffer[ix+2] = 0;
                    buffer[ix+3] = 1000;
                }
                ix += 4;
            }
        }
        return buffer;
    }
}
