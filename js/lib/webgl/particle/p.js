import WebGL from "../webgl.js";
import Vec4 from "../../math/vec4.js";
import ComputeShader from "../compute-shader.js";
import ParticleManager from "../particle/particle-manager.js";

const COUNT = 20000;

const settings = {
    set:        { value: 100, min:  10, max: 500, step:  10 },
    ratio:      { value:   3, min:   1, max:  10, step:   1 },
  //time:       { value:  80, min:   1, max: 200, step:   5 },
  //scale:      { value:   4, min:   1, max:  10, step:   1 },
    random:     { value:  .8, min:  .1, max:  1., step:  .1 },
    area:       { value: .02, min:   0, max:  .4, step: .01 },
    life:       { value:   2, min:   1, max:  20, step:   1 },
    speed:      { value:   3, min:   0, max:  10, step:   1 },
    size:       { value:   2, min:   1, max:  10, step:   1 }
};

const FloatsPerParticle = 16;

let mousePos = {x: 0, y: 0, z: 0, w: 0};

let webgl = null;
let textures = [null, null];

let frameHandler = null;
let lastTime = 0.0;
let frame = 0;
let lastIndex = 0;

let cs = null;
let ptMgr = null;

function addParticles(data) {
    let rnd = settings.random.value;
    let ix = lastIndex * FloatsPerParticle;
    let phi = 0.5 * Math.PI;
    for (let pi=0; pi<settings.set.value; pi++) {
        let theta = 2 * Math.PI * Math.random();
        let position = new Vec4(data, ix)
        position.fromPolar(settings.area.value * Math.random(), theta, phi);
        position.inc(mousePos);
        position.w = 1.0;
        let velocity = new Vec4(data, ix+4)
        let rnd1 = 1.0 - rnd + rnd * Math.random();
        velocity.fromPolar(0.05 * settings.speed.value * rnd1, theta, phi);
        velocity.w = 0.0;
        let misc = new Vec4(data, ix+8);
        // life, time, size, unused
        let rnd2 = 1.0 - rnd + rnd * Math.random();
        let rnd3 = 1.0 - rnd + rnd * Math.random();
        misc.set(settings.life.value * rnd2, 0.0, settings.size.value * rnd3, 1.0);
        let color = new Vec4(data, ix+12);
        color.set(
            1.0 - rnd + rnd * Math.random(),
            1.0 - rnd + rnd * Math.random(),
            1.0 - rnd + rnd * Math.random(),
            0.6
        );

        ix += FloatsPerParticle;
        lastIndex++;
        if (lastIndex == COUNT) {
            lastIndex = 0;
            ix = 0;
        }
    }
}

function setMousePos(e) {
    mousePos.x = 2.0 * e.clientX * webgl.scale.x/webgl.canvas.width - 1.0;
    mousePos.y = 2.0 - 2.0 * e.clientY * webgl.scale.y/webgl.canvas.height - 1.0;
}

function setup() {
    webgl = new WebGL(null, {
        fullScreen: true,
        scaleX: 0.8,
        scaleY: 0.8
    });
    webgl.useExtension('EXT_color_buffer_float');
    webgl.canvas.addEventListener('pointerenter', setMousePos)
    webgl.canvas.addEventListener('pointermove', setMousePos);
    const gl = webgl.gl;

    ptMgr = new ParticleManager(webgl, COUNT);
    ptMgr.addParticles = addParticles;
    //ptMgr.addParticles();
    textures[0] = ptMgr.dataTexture;

    // create compute shader
    cs = new ComputeShader(webgl, 'cs1');
    cs.setInput(textures[0]);
    textures[1] = cs.setOutput();
    cs.setProgram(
        `#version 300 es
        precision highp float;
        precision highp sampler2D;
        in vec2 v_texcoord;
        out vec4 result;
        vec4 position;
        vec4 velocity;
        vec4 misc;
        vec4 color;
        uniform sampler2D u_texture;
        uniform float u_time;

        void main() {
            ivec2 texSize = textureSize(u_texture, 0);
            float texWidth = float(texSize.x);
            int ix = int(v_texcoord.x * texWidth) % 4;
            float offs = float(ix) / texWidth;
            vec2 uv = vec2(v_texcoord.x - offs, v_texcoord.y);

            position = texture(u_texture, uv);
            uv.x += 1.0 / texWidth;
            velocity = texture(u_texture, uv);
            uv.x += 1.0 / texWidth;
            misc = texture(u_texture, uv);
            uv.x += 1.0 / texWidth;
            color = texture(u_texture, uv);

            switch (ix) {
                case 0: // position
                    result = position + u_time * velocity;
                    break;
                case 1: // velocity
                    result = velocity;
                    break;
                case 2: // misc: life, time, size, unused
                    misc.y += u_time;
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
}

function update(frame, dt) {
    if (frame % settings.ratio.value === 0) {
        let ix = frame % 2;
        let tex = textures[ix];
        tex.bind(0);
        addParticles(tex.data);
        const gl = webgl.gl;
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, tex.width, tex.height, tex.format, tex.type, tex.data);
    }
}

function render(frame, dt) {
    cs.run({
        u_time: dt / 1000.0
    });
    cs.readOutput();
    cs.feedback();

    webgl.gl.viewport(0, 0, webgl.canvas.width, webgl.canvas.height);
    ptMgr.dataTexture = cs.output;
    ptMgr.render(frame, dt);
}

function mainLoop(time) {
    cancelAnimationFrame(frameHandler);
    const dt = time - lastTime;
    lastTime = time;

    update(frame, dt);
    render(frame, dt);
    frame++;

    frameHandler = requestAnimationFrame(mainLoop);
}

function onLoad() {
    setup();
    mainLoop(0.0);
}

window.addEventListener('load', onLoad);