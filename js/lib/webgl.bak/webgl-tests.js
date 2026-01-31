import { getConsole, Colors } from '../console/console.js'
import Test from '../test/test.js';
import WebGL from './webgl.js';
import ComputeShader from './compute-shader.js';
import { load } from '../loader/load.js'

export default class WebGLTest extends Test {
    #webgl = null;
    #cons = null;
    #program = null;
    #images = [];
    #imageUrls = [
        'assets/test.gif',
        'assets/ascii_charset.png'
    ];

    #vertexShaders = [
        `#version 300 es

        in vec2 a_position;
        void main() {
            gl_Position = vec4(0.5*a_position, 0.0, 1.0);
        } `,
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
            else if (gl_VertexID == 1) v_texcoord = a_texcoord.zw;
            else if (gl_VertexID == 2) v_texcoord = a_texcoord.zy;
            else if (gl_VertexID == 3) v_texcoord = a_texcoord.xy;
            v_color = a_color;
        } `];
    #fragmentShaders = [
        `#version 300 es
        precision mediump float;
        out vec4 fragColor;
        uniform vec4 uColor;
        void main() {
            fragColor = uColor;
        } `,
        `#version 300 es
        precision mediump float;

        out vec4 fragColor;
        uniform vec4 uColor;
        in vec2 v_texcoord;
        in vec4 v_color;
        uniform sampler2D u_texture;
        
        void main() {
            fragColor = uColor * v_color * texture(u_texture, v_texcoord);
        } `,
        `#version 300 es
        precision highp float;
        precision highp usampler2D;
        in vec2 v_texcoord;
        out uint result;
        uniform usampler2D u_texture;
        void main() {
            result = texture(u_texture, v_texcoord).r;
        } `];
    async setupAll() {
        this.#cons = await getConsole();
        for (let url of this.#imageUrls) {
            let image = await load({url: url, base: import.meta.url})
            .then(async resp => {
                if (resp.content instanceof Error) {
                    console.log(resp.content);
                } else {
                    const img = new Image();
                    img.src = URL.createObjectURL(resp.content);
                    await img.decode();
                    return img;
                }
            });
            this.#images.push(image);
        }
    }

    async setup() {
        this.#webgl = new WebGL(null, { fullScreen: true });
        const gl = this.#webgl.gl;
        const st = this.#webgl.canvas.style;
        st.position = 'absolute';
        st.top = 0;
        st.left = 0;
        st.zIndex = -1;
        this.#webgl.createBufferFromArrayBuffer(
            gl.ARRAY_BUFFER,
            new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]),
            'vertices'
        );

        this.#webgl.createBufferFromArrayBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array([0, 1, 2, 2, 3, 0]),
            'index'
        );

        this.#webgl.createTextureFromImage(this.#images[0], 'test');
        this.#webgl.createTextureFromImage(this.#images[1], 'ascii');

        this.asciiMap = (await load({ url: 'assets/ascii_charset_map.json', base: import.meta.url })).content;
    }

    teardown() {
        if (this.#program) {
            this.#program.delete();
        }

        this.#webgl.destroy();
    }

    async testDrawSolidRectangle() {
        const gl = this.#webgl.gl;

        // v_position attribute uses buffer[0] implicitly
        this.#program = this.#webgl.createProgram(
            {
                vertexSrc: this.#vertexShaders[0],
                fragmentSrc: this.#fragmentShaders[0]
            });
        this.#program.use();
        this.#program.setUniform('uColor', [0.4, 0.6, 1.0, 1.0]);

        // draw
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        this.#cons.writeln('Drawn a solid rectangle.');
        await this.#cons.waitButton('Continue');
    }

    async testDrawTexturedRectangle() {
        const gl = this.#webgl.gl;
        // use buffers
        const vertices = this.#webgl.getBufferByTag('vertices');
        const index = this.#webgl.getBufferByTag('index');
        const attributes = this.#webgl.createBufferFromArrayBuffer(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0, 0.0, 0.0, 0.09, 0.16, 0.0, 0.0, 0.0, 1.0, 1.0, 0.4, 0.5, 8.0, 1.0]),
            { tag: 'attributes' }
        );

        const testTexture = this.#webgl.getTextureByTag('test');
        testTexture.bind(0);

        this.#program = this.#webgl.createProgram(
            {
                vertexSrc: this.#vertexShaders[1],
                fragmentSrc: this.#fragmentShaders[1],
                attributes: {
                    a_position: { bufferId: vertices.id },
                    a_translate: { bufferId: attributes.id, divisor: 1 },
                    a_scale: { bufferId: attributes.id, divisor: 1 },
                    a_rotation: { bufferId: attributes.id, divisor: 1 },
                    a_texcoord: { bufferId: attributes.id, divisor: 1 },
                    a_color: { bufferId: attributes.id, divisor: 1 }
                }
            });

        this.#program.use();
        this.#program.setUniform('uColor', [1.0, 1.0, 1.0, 1.0]);
        this.#program.setUniform('u_texture', testTexture);

        // draw
        gl.clearColor(0.5, 0.6, 1.0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        this.#cons.writeln('Drawn a solid rectangle.');
        await this.#cons.waitButton('Continue');
    }

    async testDrawManyTexturedRectangles() {
        const count = 1000;
        const gl = this.#webgl.gl;
        const testTexture = this.#webgl.getTextureByTag('ascii');
        testTexture.bind(0);
        const vertices = this.#webgl.getBufferByTag('vertices');
        const index = this.#webgl.getBufferByTag('index');
        let attributeData = new Float32Array(16 * count);
        let ix = 0;
        let asciiData = Object.values(this.asciiMap);
        for (let i = 0; i < count; i++) {
            // translation
            attributeData[ix++] = 0.9 * (2 * Math.random() - 1);
            attributeData[ix++] = 0.9 * (2 * Math.random() - 1);
            attributeData[ix++] = 0;
            // padding1
            attributeData[ix++] = 0;
            // scale
            attributeData[ix++] = 0.02 + 0.01 * Math.random();
            attributeData[ix++] = 0.02 + 0.01 * Math.random();
            // rotation
            attributeData[ix++] = Math.random() * 2 * Math.PI;
            // padding2
            attributeData[ix++] = 0;
            // texcoord
            let char = asciiData[Math.floor(asciiData.length * Math.random())];
            attributeData[ix++] = (char[0] - 1) / testTexture.width;
            attributeData[ix++] = (char[1] - 1) / testTexture.height;
            attributeData[ix++] = (char[2] - 1) / testTexture.width;
            attributeData[ix++] = (char[3] - 1) / testTexture.height;
            // color
            attributeData[ix++] = 0.5 + 0.5 * Math.random();
            attributeData[ix++] = 0.5 + 0.5 * Math.random();
            attributeData[ix++] = 0.5 + 0.5 * Math.random();
            attributeData[ix++] = 1;
        }

        const attributes = this.#webgl.createBufferFromArrayBuffer(
            gl.ARRAY_BUFFER,
            attributeData,
            { tag: 'attributes' }
        );

        this.#program = this.#webgl.createProgram(
            {
                vertexSrc: this.#vertexShaders[1],
                fragmentSrc: this.#fragmentShaders[1],
                attributes: {
                    a_position: { bufferId: vertices.id },
                    a_translate: { bufferId: attributes.id, offset: 0 * 4, divisor: 1 },
                    a_scale: { bufferId: attributes.id, offset: 4 * 4, divisor: 1 },
                    a_rotation: { bufferId: attributes.id, offset: 6 * 4, divisor: 1 },
                    a_texcoord: { bufferId: attributes.id, offset: 8 * 4, divisor: 1 },
                    a_color: { bufferId: attributes.id, offset: 12 * 4, divisor: 1 }

                }
            });

        this.#program.use();
        this.#program.setUniform('uColor', [1.0, 1.0, 1.0, 1.0]);
        this.#program.setUniform('u_texture', testTexture);

        // draw
        gl.clearColor(0.05, 0.02, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        gl.drawElementsInstanced(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0, count);

        this.#cons.writeln(`Drawn ${count} textured rectangles.`);
        await this.#cons.waitButton('Continue');
    }

    async testComputeShader() {
        const computeShaderUint = new ComputeShader(this.#webgl, 'cs1');
        computeShaderUint.setInput(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]), 1);
        computeShaderUint.setOutput();
        computeShaderUint.setProgram(
            `#version 300 es
            precision highp float;
            precision highp usampler2D;
            in vec2 v_texcoord;
            out float result;
            uniform sampler2D u_texture;
            void main() {
                result = texture(u_texture, v_texcoord).r * 2.0;
            }`);
        computeShaderUint.run();
        var output = computeShaderUint.readOutput();
        this.isEqual('Should calculate correct values in shader', output, [0, 2, 4, 6, 8, 10, 12, 14]);
        computeShaderUint.destroy();
        await this.#cons.waitButton('Continue');

        const computeShader = new ComputeShader(this.#webgl, 'cs1');
        computeShader.setInput(new Float32Array([8.0, 4.0, 2.0, 1.0, 0.5, 0.25, 0.125, 0.0625]), 1);
        computeShader.setOutput();
        computeShader.setProgram(
            `#version 300 es
            precision highp float;
            precision highp sampler2D;
            in vec2 v_texcoord;
            out float result;
            uniform sampler2D u_texture;
            void main() {
                result = texture(u_texture, v_texcoord).r * 2.0;
            }`);
        computeShader.run();
        var output = computeShader.readOutput();
        this.isEqual('Should calculate correct values in shader', output, [16.0, 8.0, 4.0, 2.0, 1.0, 0.5, 0.25, 0.125]);

        await this.#cons.waitButton('Continue');
        computeShader.feedback();
        computeShader.run();
        var output = computeShader.readOutput();
        this.isEqual('Should calculate correct values in shader after 1x feedback', output, [32.0, 16.0, 8.0, 4.0, 2.0, 1.0, 0.5, 0.25]);

        await this.#cons.waitButton('Continue');
        computeShader.feedback();
        computeShader.run();
        var output = computeShader.readOutput();
        this.isEqual('Should calculate correct values in shader after 2x feedback', output, [64.0, 32.0, 16.0, 8.0, 4.0, 2.0, 1.0, 0.5]);


        await this.#cons.waitButton('Continue');
    }
}