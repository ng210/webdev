import { getConsole } from '../console/console.js'
import Test from '../test/test.js';
import WebGL from './webgl.js';
import SpriteManager from './sprite/sprite-manager.js';

const SPRITE_COUNT = 4000;

export default class SpriteTest extends Test {
    #webgl = null;
    #cons = null;
    #sprMgr = null;

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
        this.#sprMgr = new SpriteManager(this.#webgl, SPRITE_COUNT);
        this.#sprMgr.program = await this.#sprMgr.loadShaders();
        await this.#sprMgr.loadAtlas(
            new URL('assets/ascii_charset.png', import.meta.url).toString(),
            new URL('assets/ascii_charset.json', import.meta.url).toString());
    }

    teardown() {
        this.#sprMgr.destroy();
        this.#webgl.destroy();
    }

    async testCreateSprites() {
        const gl = this.#webgl.gl;
        for (let i = 0; i < SPRITE_COUNT; i++) {
            let spr = this.#sprMgr.allocate();
            // translate
            spr.translation.set(
                (0.05 + 0.9*Math.random()) * this.#webgl.canvas.width,
                (0.05 + 0.9*Math.random()) * this.#webgl.canvas.height,
                 0);
            // rotation
            spr.rotation = 0;   //Math.random() * 2 * Math.PI;
            // scale
            spr.scale.set([0.5 * Math.random() + 0.5, 0.5 * Math.random() + 0.5]);
            // color
            spr.color.set(
                0.5 + 0.5*Math.random(),
                0.5 + 0.5*Math.random(),
                0.5 + 0.5*Math.random(),
                1);
            // texcoord
            spr.frame = Math.floor(Math.random()*this.#sprMgr.frameCount);
        }
        
        this.#sprMgr.update();
        this.#sprMgr.render();

        await this.#cons.waitButton('Continue');
    }
}