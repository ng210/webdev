import { getConsole } from '../console/console.js'
import Test from '../test/test.js';
import WebGL from './webgl.js';
import ParticleManager from './particle/particle-manager.js';
import { sleep } from '/js/lib/util.js';
import { load } from '../loader/load.js';
import Vec4 from '../math/vec4.js';
//const PARTICLE_COUNT = 2**14;
const SCALE = 1/10;
const DELATION = 0.1;
const DURATION = 40;

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
    #imageUrls = [
        'assets/ascii_charset.png',
        'assets/SAM_2332.JPG'
    ];
    #images = [];


    async setupAll() {
        this.#cons = await getConsole();
		let responses = [];
		for (let url of this.#imageUrls) {
			let image = await load({url: url, base: import.meta.url})
				.then(
					async resp => {
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
                if (this.#frame == DURATION) {
                    this.#phase = 1;
                    this.#frame = 0;
                    console.log('phase 1: ' + this.#frame);
                }                
                break;
            case 1:
                dt = DELATION;
                if (this.#frame == 2*DURATION) {
                    this.#phase = 2;
                    this.#frame = 0;
                    console.log('phase 2: ' + this.#frame);
                }
                break;
            case 2:
                dt = 0;
                if (this.#frame == 0.5 * DURATION) {
                    this.#phase = 3;
                    this.#frame = 0;
                    console.log('phase 3: ' + this.#frame);
                }
                break;
            case 3:
                dt = -DELATION;
                if (this.#frame == 2*DURATION) {
                    this.#phase = 0;
                    this.#frame = 0;
                    console.log('phase 0: ' + this.#frame);
                }
                break;
        }

        let ix = 0;
        for (let pi=0; pi<this.#particleCount; pi++) {
            let position = new Vec4(this.#ptMgr.data, ix)
            let velocity = new Vec4(this.#ptMgr.data, ix+4);
            position.inc({x:velocity.x*dt, y:velocity.y*dt, z:velocity.z*dt, w: 0});
            let misc = new Vec4(this.#ptMgr.data, ix+8);
            misc.y += 2;
            ix += ParticleManager.FloatsPerParticle;
        }        

        this.#ptMgr.update(dt, this.#frame);
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
        let image = this.#images[0];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        this.#ptMgr.particleSize = 1/SCALE; //Math.max();
        let ix = 0;
        for (let yi = 0; yi < rows; yi++) {
            for (let xi = 0; xi < cols; xi++) {

                let position = new Vec4(this.#ptMgr.data, ix)
                position.set(-1.0 + 2*xi/cols, -1.0 + 2*yi/rows, 0.0, 1.0);
                position.w = 1.0;
                let velocity = new Vec4(this.#ptMgr.data, ix+4);
                velocity.fromPolar(
                    0.1 * Math.random() + 0.1,
                    2*Math.PI*Math.random(), 0.5*Math.PI);
                velocity.w = 0.0;
                let misc = new Vec4(this.#ptMgr.data, ix+8);
                // life, time, size, unused
                misc.set(DURATION * (0.4*Math.random() + 0.6), 0.0, 1/SCALE, 1.0);
                let color = new Vec4(this.#ptMgr.data, ix+12);
                let pix = 4*(Math.floor(xi*imageData.width/cols) + imageData.width * (imageData.height-1 - Math.floor(yi*imageData.height/rows)));
                color.set(
                    imageData.data[pix] / 255.0,
                    imageData.data[pix+1] / 255.0,
                    imageData.data[pix+2] / 255.0,
                    imageData.data[pix+3] / 255.0
                );

                ix += ParticleManager.FloatsPerParticle;
            }
        }

        this.#ptMgr.update(this.#frame, 0);
        this.#webgl.gl.viewport(0, 0, this.#webgl.canvas.width, this.#webgl.canvas.height);
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