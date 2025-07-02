import Demo from '../base/demo.js'
import WebGL from '../../lib/webgl/webgl.js';
import SpriteManager from '../../lib/webgl/sprite/sprite-manager.js';

export default class Fonts extends Demo {
    static #spriteCount = 1000;
    #webgl = null;
    #sprMgr = null;
    static texts = [
        "JavaScript moves logic, but WebGL renders the visuals.",
        "One shader tells more than a thousand loops.",
        "WebGL: where pixels come to life.",
        "Objects come and go, but the RenderBuffer is forever.", 
        "The GPU does not wait - optimize cleverly."
    ];
    #textIndex = -1;

    #transitions = {
        fade: (fr, dt) => {
            let alpha = 1;
            if (fr < 30) alpha = fr / 30;
            else if (fr > 130) alpha = (160 - fr) / 30;
            for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                let spr = this.#sprMgr.spr(si);
                spr.color.w = alpha;
            }
        },
        fall: (fr, dt) => {
            if (fr == 0) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.translation.y -= 40*0.8;
                }
            }
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.translation.y += 0.8;
                    spr.color.w = fr / 40;
                }
            } else if (fr > 100) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.translation.y += 3.4;
                    spr.color.w = (160 - fr) / 60;
                }
            }
        },
        flipx: (fr, dt) => {
            let scale = this.settings.scale.value;
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale * fr/40, scale]);
                    spr.color.w = fr / 40;
                }
            } else if (fr > 120) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale * (160 - fr)/40, scale]);
                    spr.color.w = (160 - fr) / 40;
                }
            }
        },
        flipy: (fr, dt) => {
            let scale = this.settings.scale.value;
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale, scale * fr/40]);
                    spr.color.w = fr / 40;
                }
            } else if (fr > 120) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale, scale * (160 - fr)/40]);
                    spr.color.w = (160 - fr) / 40;
                }
            }
        }
    };

    get size() {
        return [1024, 800];
    }

    constructor() {
        super();
        this.settings = {
            scale: { min: 0.1, max: 2.0, value: 0.5, step: 0.1},
            gap: { min: 0, max: 10, value: 2, step: 1 },
            transitions: { list: Object.keys(this.#transitions), value: 0 }
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
            { url: 'assets/ascii_charset.png', base: document.scripts[0].src },
            { url: 'assets/ascii_charset.json', base: document.scripts[0].src });

        for (let i=0; i<Fonts.#spriteCount; i++) {
            let spr = this.#sprMgr.allocate();
            // rotation
            spr.rotation = 0.0;
            // scale
            spr.scale.set([0, 0]);
            // color
            spr.color.set(1, 1, 1, 1);
            spr.frame = Math.floor(Math.random() * this.#sprMgr.frameCount);
        }
    }

    textWidth(text) {
        let width = 0;
        for (let ci=0; ci<text.length; ci++) {
            const code = text.charCodeAt(ci) - 32;
            if (code >= 0 && code <= 94) {
                let frame = this.#sprMgr.getFrame(code);
                width += frame[4] * this.settings.scale.value + this.settings.gap.value;
            }
        }
        return width;
    }

    renderText(text, x, y) {
        for (let si=0; si<Fonts.#spriteCount; si++) {
            let spr = this.#sprMgr.spr(si);
            if (si < text.length) {
                const code = text.charCodeAt(si);
                if (code >= 32 && code <= 126) {
                    spr.translation.set(x, y, 0);
                    spr.rotation = 0;
                    spr.scale.set([this.settings.scale.value, this.settings.scale.value]);
                    spr.color.w = 1.0;
                    spr.frame = code - 32;
                    x += spr.width + this.settings.gap.value;
                }
            } else {
                spr.scale.set([0, 0]);
            }
        }
    }

	onChange(id, value) {
        let scale = this.settings.scale.value;
        let gap = this.settings.gap.value;
        switch (id) {
            case 'scale':
            case 'gap':
                let text = Fonts.texts[this.#textIndex];
                let width = this.textWidth(text);
                let x = 0.5 * (this.#webgl.canvas.width - width);
                let y = 0.5 * this.#webgl.canvas.height;
                for (let si=0; si<text.length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.translation.set(x, y, 0);
                    spr.scale.set([scale, scale]);
                    x += spr.width + this.settings.gap.value;
                }
                break;
        }

        return true;
	}

    update(frame, dt) {
        let fr = frame % 160; 
        if (fr == 0) {
            this.#textIndex = (this.#textIndex + 1) % Fonts.texts.length;
            let width = this.textWidth(Fonts.texts[this.#textIndex]);
            this.renderText(Fonts.texts[this.#textIndex], 0.5*(this.#webgl.canvas.width - width), 0.5*this.#webgl.canvas.height);
        }

        let fxName = this.settings.transitions.list[this.settings.transitions.value];
        this.#transitions[fxName].apply(this, [fr, dt]);
        this.#sprMgr.update();
    }

    render(frame, dt) {
		this.#webgl.gl.viewport(0, 0, this.#webgl.canvas.width, this.#webgl.canvas.height);
        this.#sprMgr.render();		
    }
}
