import { getConsole } from '../console/console.js'
import Test from '../test/test.js';
import WebGL from './webgl.js';
import ParticleManager from './particle/particle-manager.js';
import { sleep } from '../util.js';

//const PARTICLE_COUNT = 2**14;
const SCALE = 1/1;
const DELATION = 0.1;
const DURATION = 100;

export default class ParticleTest extends Test {
    #webgl = null;
    #cons = null;
    #ptMgr = null;
    #particleCount = 0;
    #handler = null;
    #currentTime = 0;
    #startTime = 0;
    #frame = 0;
    #phase = 0;

    async setupAll() {
        this.#cons = await getConsole();
    }

    async setup() {
        this.#webgl = new WebGL(null, {
            fullScreen: true,
            scaleX: 1.0,
            scaleY: 1.0
        });
        const st = this.#webgl.canvas.style;
        st.translation = 'absolute';
        st.top = 0;
        st.left = 0;
        st.zIndex = -1;
        this.#particleCount = Math.floor(SCALE * this.#webgl.canvas.width) * Math.floor(SCALE * this.#webgl.canvas.height);
        this.#ptMgr = new ParticleManager(this.#webgl, this.#particleCount);
        this.#cons.writeln('Particle count: ' + this.#particleCount);
    }

    teardown() {
        this.#ptMgr.destroy();
        this.#webgl.destroy();
    }

    #main() {
        cancelAnimationFrame(this.#handler);
        // let now = DELATION * new Date().getTime();
        // let dt = now - this.#currentTime;
        // this.#currentTime = now;

        // let dt = 10 * Math.sin(2*Math.PI * this.#frame * DELATION);
        let dt = 0;
        switch (this.#phase) {
            case 0:
                dt = 0;
                if (this.#frame == 2*DURATION) {
                    this.#phase = 1;
                    this.#frame = 0;
                    console.log('phase 1: ' + this.#frame);
                }                
                break;
            case 1:
                dt = DELATION;
                if (this.#frame == DURATION) {
                    this.#phase = 2;
                    this.#frame = 0;
                    console.log('phase 2: ' + this.#frame);
                }
                break;
            case 2:
                dt = 0;
                if (this.#frame == 0.2 * DURATION) {
                    this.#phase = 3;
                    this.#frame = 0;
                    console.log('phase 3: ' + this.#frame);
                }
                break;
            case 3:
                dt = -DELATION;
                if (this.#frame == DURATION) {
                    this.#phase = 0;
                    this.#frame = 0;
                    console.log('phase 0: ' + this.#frame);
                }
                break;
        }

        //this.#ptMgr.update(dt, this.#frame);
        const gl = this.#webgl.gl;
        gl.clearColor(0.01, 0.02, 0.1, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.#ptMgr.render(this.#frame, dt);

        this.#frame++;
        this.#handler = requestAnimationFrame(() => this.#main());
    }

    async testCreateParticles() {
        const gl = this.#webgl.gl;
        const rows = Math.floor(SCALE * this.#webgl.canvas.height);
        const cols = Math.floor(SCALE * this.#webgl.canvas.width);
		// read pixel data from image
        let image = new Image();
        //image.src = '/js/lib/webgl/assets/ascii_charset.png';
        image.src = '/js/lib/webgl/assets/SAM_2332.JPG';
        let imageData = await new Promise(resolve => {
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                resolve(imageData);
            };
        });

        this.#ptMgr.particleSize = 1/SCALE; //Math.max();
        for (let yi = 0; yi < rows; yi++) {
            for (let xi = 0; xi < cols; xi++) {
                let pt = this.#ptMgr.allocate();
                let x = xi/cols;
                let y = yi/rows;
                // position
                pt.position.set(-1.0 + 2*x, -1.0 + 2*y, 0.0, 1.0);
                // pt.position.fromPolar(
                //     0.5 * Math.random() + 0.0,
                //     2*Math.PI*Math.random(), 0.5*Math.PI);
                // pt.position.w = 1.0;
                // velocity
                pt.velocity.fromPolar(
                    0.05 * Math.random() + 0.01,
                    2*Math.PI*Math.random(), 0.5*Math.PI);
                //pt.position.sub({x:0, y:0, z:0, w:0}, pt.velocity);
                pt.velocity.w = 0.0;
                //pt.acceleration.set(0.0, 0.0, 0.0, 0.0);
                // color
                pt.misc.set(20 + 0 * Math.random(), 1.0, 1.0, 0.0);
                let ix = 4*(Math.floor(x*imageData.width) + imageData.width * (imageData.height - Math.floor(y*imageData.height)));
                pt.color.set(
                    imageData.data[ix] / 255.0,
                    imageData.data[ix+1] / 255.0,
                    imageData.data[ix+2] / 255.0,
                    1.0);
                // pt.color.set(
                //     0.5 * i/PARTICLE_COUNT + 0.5*Math.random(),
                //     0.5 * i/PARTICLE_COUNT + 0.5*Math.random(),
                //     0.5 * i/PARTICLE_COUNT + 0.5*Math.random(),
                //     1);
            }
        }

        this.#ptMgr.update(this.#frame, 0);
        this.#ptMgr.render(this.#frame, 0);
        await sleep(1000);
        //this.#currentTime = DELATION * new Date().getTime();
        this.#startTime = new Date().getTime();
        this.#frame = 0;
        this.#main();

        await this.#cons.waitButton('Continue');
        cancelAnimationFrame(this.#handler);
    }
}