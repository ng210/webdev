import Demo from '/js/demo/base/demo.js'
import WebGL from '/js/lib/webgl/webgl.js';
import SpriteManager from '/js/lib/webgl/sprite/sprite-manager.js';

export default class Fonts extends Demo {
    static #spriteCount = 1000;
    #webgl = null;
    #sprMgr = null;

    get size() {
        return [800, 600];
    }

    constructor() {
        super();
        this.settings = {
        };
        this.#webgl = new WebGL(
            document.querySelector('canvas'),
            {
                fullScreen: true,
                scaleX: 1.0,
                scaleY: 1.0});
        // const st = this.#webgl.canvas.style;
        // st.translation = 'absolute';
        // st.top = 0;
        // st.left = 0;
        // st.zIndex = -1;
        this.#sprMgr = new SpriteManager(this.#webgl, Fonts.#spriteCount);
    }

    async initialize() {
        super.initialize();

        this.#sprMgr.program = await this.#sprMgr.loadShaders();
        await this.#sprMgr.loadAtlas(
            '/js/lib/webgl/assets/ascii_charset.png',
            '/js/lib/webgl/assets/ascii_charset.json');

        for (let i=0; i<Fonts.#spriteCount; i++) {
            let spr = this.#sprMgr.allocate();
            //spr.visible = false;
            spr.frame = 1;
            spr.scale.set(0.0, 0.0);
            spr.color.set(1, 0, 1, 1);
        }
    }

    textWidth(text) {
        let width = 0;
        for (let ci=0; ci<text.length; ci++) {
            const code = text.charCodeAt(ci) - 32;
            if (code >= 0 && code <= 94) {
                let frame = this.#sprMgr.getFrame(code);
                width += frame[4] / this.#webgl.canvas.width;
            }
        }
        return width;
    }

    renderText(text, x, y, scale) {
        for (let ci=0; ci<text.length; ci++) {
            const code = text.charCodeAt(ci);
            if (code >= 32 && code <= 126) {
                let spr = this.#sprMgr.spr(ci);
                spr.translation.set(x, y, 0);
                spr.rotation = 0;
                spr.scale.set(scale, scale);
                spr.color.set(1, 1, 1, 0.5);
                spr.frame = code - 32;
                x += 2*spr.baseWidth / this.#webgl.canvas.width;
            }
        }
    }

	onChange(id, value) {
        return true;
	}

    update(frame, dt) {
        if (frame == 0) {
            let text = '0123456789';
            let scale = 0.1;
            let width = this.textWidth(text);
console.log(width);
            this.renderText(text, -width/2, 0, scale);
        } else if (frame == 200) {
            let text = '0123456789012345678901234567890123456789';
            let scale = 0.05;
            let width = this.textWidth(text);
console.log(width);
            this.renderText(text, -width/2, 0, scale);
        }

        this.#sprMgr.update();
    }

    render(frame, dt) {
		this.#webgl.gl.viewport(0, 0, this.#webgl.canvas.width, this.#webgl.canvas.height);
        this.#sprMgr.render();		
    }
}
