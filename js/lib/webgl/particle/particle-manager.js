import Vec4 from "/js/lib/math/vec4.js";

// 00 translation:  4
// 04 velocity:     4
// 08 not used:     4
// 0C color:        4


// must be a multiple of 4
const FloatsPerParticle = 4 + 4 + 4 + 4;

class ParticleManager {
    #webgl;
    dataTexture = null;
    #count = 0;
    get count() { return this.#count; }
    #program = null;
    diffuseColor = [1.0, 1.0, 1.0, 1.0];

    #defaultVertexShader =
    `#version 300 es
    precision highp float;

    uniform sampler2D u_dataTexture;    // { vec4 position, vec4 color }
    uniform int u_count;                // count of visible particles
    const int ELEMENT_SIZE = 4;         // 4 vec4: position, velocity, misc, color
    out vec4 v_color;

    void main() {
        int elementIndex = gl_VertexID;
        float fInvalid = step(float(u_count), float(elementIndex));

        int texIndex = elementIndex * ELEMENT_SIZE;
        ivec2 texSize = textureSize(u_dataTexture, 0);
        ivec2 uv = ivec2(texIndex % texSize.x, texIndex / texSize.x);

        vec4 position = texelFetch(u_dataTexture, uv, 0);

        uv.x++;
        vec4 velocity = texelFetch(u_dataTexture, uv, 0);

        uv.x++;
        vec4 misc = texelFetch(u_dataTexture, uv, 0);

        uv.x++;
        vec4 color = texelFetch(u_dataTexture, uv, 0);

        // float time = u_time - misc.y;

        gl_Position = position;
        v_color = color;
        v_color.a *= misc.y / misc.x * (1.0 - fInvalid);

        gl_PointSize = misc.z;
    }`;

    #defaultFragmentShader =
    `#version 300 es
    precision mediump float;

    out vec4 fragColor;
    uniform vec4 u_color;
    in vec4 v_color;
    
    void main() {
        fragColor = u_color * v_color;
    } `;

    constructor(webgl, count = 0) {
        this.#webgl = webgl;
        if (count > 0) this.setCount(count);
        this.setProgram(
            {
                vertexSrc: this.#defaultVertexShader,
                fragmentSrc: this.#defaultFragmentShader
            }
        );
    }

    setProgram(prg) {
        this.#program = this.#webgl.createProgram(prg);
    }

    setCount(count) {
        this.#count = count;
        let dataCount = count * FloatsPerParticle;
        const [width, height] = this.#webgl.calculateTextureSize(dataCount/4);
        let data = new Float32Array(width * height * 4);
        // create texture
        if (this.dataTexture) this.dataTexture.delete();
        const gl = this.#webgl.gl;
        this.dataTexture = this.#webgl.createTexture(
            'float[4]', width, height, {
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                useMipmaps: false,
                tag: 'data1',
                data: data
            });
    }

    addParticles(callback) {
        let data = this.dataTexture.data;
        if (typeof callback === 'function') {
            callback(data);
        } else {
            let ix = 0;
            for (let pi=0; pi<this.#count; pi++) {
                let position = new Vec4(data, ix)
                position.set(
                    Math.random() * 2.0 - 1.0,
                    Math.random() * 2.0 - 1.0,
                    Math.random() * 2.0 - 1.0,
                    1.0);
                let velocity = new Vec4(data, ix+4)
                let theta = 2 * Math.PI * Math.random();
                let phi = 0.5 * Math.PI;
                velocity.fromPolar(0.1, theta, phi);
                velocity.w = 0.0;
                let misc = new Vec4(data, ix+8);
                // life, time, size, unused
                misc.set(2.5, 0.0, 1.2, 1.0);
                let color = new Vec4(data, ix+12);
                color.set(
                    0.5 + 0.5 * Math.random(),
                    0.5 + 0.5 * Math.random(),
                    0.5 + 0.5 * Math.random(),
                    0.8
                );
                ix += FloatsPerParticle;
            }
        }
    }

    get(ix) {
        let start = ix * FloatsPerParticle;
        return this.dataTexture.data.subarray(start, start + FloatsPerParticle);
    }

    reset() {
        this.#count = 0;
        this.dataTexture.data.fill(0.0);
        this.update(0, 0.0);
    }

    update(frame, dt) {
        // for (let i=0; i<this.#count; i++) {
        //     this.#pool[i].update();
        // }
        // update data texture
        // console.log(this.#dataArray);
        // console.log(this.#dataTexture.width, this.#dataTexture.height);
        this.dataTexture.update();
    }

    render(frame, dt) {
        this.#program.use();
        this.#program.setUniform('u_dataTexture', this.dataTexture);
        this.#program.setUniform('u_count', this.#count);
        this.#program.setUniform('u_color', this.diffuseColor);

        const gl = this.#webgl.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.dataTexture.bind(0);
        gl.drawArrays(gl.POINTS, 0, this.#count);
    }

    destroy() {
        this.#program.delete();
    }
}

export default ParticleManager;