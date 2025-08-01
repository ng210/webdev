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
    #phase = 0;
    #startFrame = 0;
    #fx = '';

    #fadeIn = {
        fade: (fr, dt) =>{
            if (fr < 30) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.color.w = fr / 30;
                }
                return true;
            }
            return false;
        },
        fall: (fr, dt) => {
            if (fr < 40) {
                let alpha = 0;
                let dy = 40 * 0.8
                if (fr > 0) {
                    alpha = fr / 40;
                    dy = 0.8;
                }
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.translation.y += dy;
                    spr.color.w = alpha;
                }
                return true;
            }
            return false;
        },
        scale: (fr, dt) => {
            let scale = this.settings.scale.value * fr/40;
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale, scale]);
                    spr.color.w = fr / 40;
                }
                return true;
            }
            return false;
        },
        'scale-x': (fr, dt) => {
            let scale = this.settings.scale.value;
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale * fr/40, scale]);
                    spr.color.w = fr / 40;
                }
                return true;
            }
            return false;
        },
        'scale-y': (fr, dt) => {
            let scale = this.settings.scale.value;
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale, scale * fr/40]);
                    spr.color.w = fr / 40;
                }
                return true;
            }
            return false;
        },
        roll: (fr, dt)  => {
            let count = 0;
            if (fr % 3 == 0) {
                fr = Math.floor(fr / 3);
                let text = Fonts.texts[this.#textIndex];
                if (fr == 0) {
                    for (let si=0; si<text.length; si++) {
                        let spr = this.#sprMgr.spr(si);
                        let frame = text.charCodeAt(si) - 32 - Math.floor(Math.random()*80/3);
                        if (frame < 0) frame += 94;
                        spr.frame = frame;
                    }
                } else {
                    for (let si=0; si<text.length; si++) {
                        let spr = this.#sprMgr.spr(si);
                        if (spr.frame != text.charCodeAt(si) - 32) {
                            spr.frame = (spr.frame + 1) % 94;
                        } else count++;
                        if (fr < 20) spr.color.w = fr / 20;
                    }
                }
            }
            return count != Fonts.texts[this.#textIndex].length;
        },
        explode: (fr, dt) => {
            const d = 50;
            if (fr <= d) {
                let text = Fonts.texts[this.#textIndex];
                for (let si=0; si<text.length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    let ch = (text.charCodeAt(si) - 32) / 94;
                    let a = 2 * Math.PI * ch;
                    let l = 400 * Math.sin(ch * Math.cos((1 + si)*ch));
                    if (fr == 0) {
                        spr.translation.x += l * Math.cos(a);
                        spr.translation.y += l * Math.sin(a);
                    } else {
                        spr.translation.x -= l * Math.cos(a) / d;
                        spr.translation.y -= l * Math.sin(a) / d;
                    }
                    spr.color.w = fr/d;
                }
                return true;
            }
            return false;
        }
    };

    #fadeOut = {
        fade: (fr, dt) => {
            if (fr < 30) {
                let alpha = 1 - fr / 30;
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.color.w = alpha;
                }
                return true;
            }
            return false;
        },
        fall: (fr, dt) => {
            if (fr < 60) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.translation.y += 3.4;
                    spr.color.w = 1 - fr / 60;
                }
                return true;
            }
            return false;
        },
        scale: (fr, dt) => {
            let scale = this.settings.scale.value * (1 - fr/40);
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale, scale]);
                    spr.color.w = 1 - fr / 40;
                }
                return true;
            }
            return false;
        },
        'scale-x': (fr, dt) => {
            let scale = this.settings.scale.value;
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale * (1 - fr/40), scale]);
                    spr.color.w = 1 - fr / 40;
                }
                return true;
            }
            return false;
        },
        'scale-y': (fr, dt) => {
            let scale = this.settings.scale.value;
            if (fr < 40) {
                for (let si=0; si<Fonts.texts[this.#textIndex].length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    spr.scale.set([scale, scale * (1 - fr/40)]);
                    spr.color.w = 1 - fr / 40;
                }
                return true;
            }
            return false;
        },
        explode: (fr, dt) => {
            const d = 140;
            if (fr <= d) {
                let text = Fonts.texts[this.#textIndex];
                for (let si=0; si<text.length; si++) {
                    let spr = this.#sprMgr.spr(si);
                    let ch = (text.charCodeAt(si) - 32) / 94;
                    let a = 2 * Math.PI * ch;
                    let l = 800 * Math.sin(ch * Math.cos((1 + si)*ch));
                    spr.translation.x += l * Math.cos(a) / d;
                    spr.translation.y += (l * Math.sin(a) + 0.2 * fr * fr) / d;
                    spr.color.w = (1 - fr/d);
                }
                return true;
            }
            return false;
        }
    };

    get size() {
        return [1024, 800];
    }

    constructor() {
        super();
        let fx = Object.keys(this.#fadeIn);
        fx.push('auto');
        this.settings = {
            scale: { min: 0.1, max: 2.0, value: 0.5, step: 0.1},
            gap: { min: 0, max: 10, value: 2, step: 1 },
            transition: { list: fx, value: 0 }
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
                    spr.color.w = 0.0;
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
        let fxName = this.settings.transition.list[this.settings.transition.value];
        if (this.#phase == 0) {
            this.#textIndex = (this.#textIndex + 1) % Fonts.texts.length;
            let width = this.textWidth(Fonts.texts[this.#textIndex]);
            this.renderText(Fonts.texts[this.#textIndex], 0.5*(this.#webgl.canvas.width - width), 0.5*this.#webgl.canvas.height);
            this.#phase = 1;
            if (fxName == 'auto') {
                let keys = Object.keys(this.#fadeIn);
                fxName = keys[Math.floor(Math.random() * keys.length)];
            }
            this.#startFrame = frame + 1;
            this.#fx = this.#fadeIn[fxName];
        } else if (this.#phase == 1) {
            if (!this.#fx.apply(this, [frame - this.#startFrame, dt])) {
                this.#phase = 2;
                this.#startFrame = frame + 1;
            }
        } else if (this.#phase == 2) {
            if (frame - this.#startFrame == 60) {
                if (fxName == 'auto') {
                    let keys = Object.keys(this.#fadeOut);
                    fxName = keys[Math.floor(Math.random() * keys.length)];
                }
                this.#startFrame = frame + 1;
                this.#fx = this.#fadeOut[fxName];
                this.#phase = 3;
            }
        } else if (this.#phase == 3) {
            if (!this.#fx || !this.#fx.apply(this, [frame - this.#startFrame, dt])) {
                this.#phase = 0;
            }
        }

        this.#sprMgr.update();
    }

    render(frame, dt) {
		this.#webgl.gl.viewport(0, 0, this.#webgl.canvas.width, this.#webgl.canvas.height);
        this.#sprMgr.render();		
    }
}
