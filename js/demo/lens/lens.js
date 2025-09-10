import Demo from '../base/demo.js'
import { load } from '../../lib/loader/load.js';
import WebGL from '../../lib/webgl/webgl.js';
import ComputeShader from '../../lib/webgl/compute-shader.js';
import Noise from '../../lib/math/noise.js'

export default class Lens extends Demo {
    #webgl = null;
    #program = null;
    #texture = null;
    #images = [];

    static SIZE = 1024;

    static images = {
        sample: 'assets/sample.png',
        deepspace: 'assets/deepspace.jpg',
        bopnrumble: 'assets/bopnrumble.gif',
        sidelined: 'assets/sidelined.gif',
        ninja: 'assets/ninja.gif',
        worldmap: 'assets/map3.jpg'};
    static interpolations = ['none', 'linear', 'sinusoid'];

    get size() {
        return [800, 600];
    }

    constructor() {
        super();
        this.settings = {
            image:          { list: Object.keys(Lens.images), value: 2 },
            radius:         { value: 0.50, min: 0.2, max: 0.8, step: 0.05 },
            zoom:           { value: 1.50, min: 0.5, max: 5.0, step: 0.10 },
            size:           { value: 0.50, min: 0.0, max: 1.0, step: 0.05 },
            interpolation:  { list: Lens.interpolations, value: 0 }
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

		let urls = Object.values(Lens.images);
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

        this.#program = this.#webgl.createProgram(
            {
                vertexSrc: WebGL.screenVShader,
                fragmentSrc:
                   `#version 300 es
                    precision highp float;

                    uniform sampler2D u_texture;
                    uniform vec2 uMousePos;
                    uniform float uZoom;
                    uniform float uRadius;
                    uniform int uInterpolation;
                    uniform float uSize;
                    uniform vec2 uResolution;
                    uniform float uAspect;

                    in vec2 v_texcoord;
                    out vec4 fragColor;

                    void main() {
                        vec2 coord = 2.0 * gl_FragCoord.xy / uResolution - 1.0;
                        coord.x *= uAspect;
                        vec2 mouse = uMousePos;
                        mouse.x *= uAspect;
                        float dist = distance(coord, mouse);

                        float blend = step(uRadius, dist);
                        float zoomBlend = 1.0;
                        switch (uInterpolation) {
                            case 0: // none
                                zoomBlend = uZoom;
                                break;
                            case 1: // linear
                                zoomBlend = mix(1.0, uZoom, 1.0 - clamp(uSize * dist / uRadius, 0.0, 1.0));
                                break;
                            case 2: // sinusoid
                                zoomBlend = mix(1.0, uZoom, sin(3.14 * (1.0 - clamp(uSize * dist / uRadius, 0.0, 1.0))));
                                break;
                        }
                        vec2 zoomed = mix(mouse + (coord - mouse) / zoomBlend, coord, blend);
                        zoomed.x /= uAspect;

                        vec2 uv = (zoomed + 1.0) * 0.5;
                        fragColor = texture(u_texture, vec2(uv.x, 1.0 - uv.y));
                    }`

                //    `#version 300 es
                //     precision highp float;

                //     uniform sampler2D u_texture;
                //     uniform vec2 uMousePos;     // in [-1, 1] range
                //     uniform float uZoom;
                //     uniform float uRadius;
                //     uniform vec2 uResolution;   // in pixels

                //     out vec4 fragColor;

                //     void main() {
                //         vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
                //         vec2 coord = 2.0 * gl_FragCoord.xy / uResolution - 1.0;
                //         vec2 mouse = uMousePos;
                //         float dist = distance(coord, mouse);

                //         vec2 uv1 = (coord + 1.0) / 2.0; 
                //         vec2 uv2 = coord - mouse;
                //         uv2 *= uZoom;
                //         uv2 -= uZoom * mouse;
                //         uv2 = (uv2 + 1.0) / 2.0;

                //         fragColor += 0.5 * texture(u_texture, vec2(uv1.x, 1.0 - uv1.y));
                //         fragColor += 0.5 * texture(u_texture, vec2(uv2.x, 1.0 - uv2.y));
                //     }`
            });
        this.#program.use();
        this.onChange('image', this.settings.image.value);
    }

    onChange(id, value) {
        switch (id) {
            case 'image':
                this.#texture = this.#webgl.createTextureFromImage(this.#images[value], 'input');
                break;
        }
        return true;
    }

    update(frame, dt) {
    }

    render(frame, dt) {
        let gl = this.#webgl.gl;
        this.#program.use();
        this.#program.setUniform('uInterpolation', this.settings.interpolation.value);
        this.#program.setUniform('uZoom', this.settings.zoom.value);
        this.#program.setUniform('uRadius', this.settings.radius.value);
        this.#program.setUniform('uSize', this.settings.size.value);
        this.#program.setUniform('uMousePos', [this.glMousePos.x, this.glMousePos.y]);
        this.#program.setUniform('uResolution', [gl.canvas.width, gl.canvas.height]);
        this.#program.setUniform('uAspect', gl.canvas.clientWidth / gl.canvas.clientHeight);
        this.#texture.bind();
        // draw
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
