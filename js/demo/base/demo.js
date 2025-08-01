import RangeControl from '../../lib/glui/control/range-control.js'
import HtmlRangeElem from '../../lib/glui/control/html/html-range-elem.js'
import Vec4 from '../../lib/math/vec4.js'


export default class Demo {
    #frame;
    #ts;
    #handler;
    #initializedPromise;
    #initializedResolved;
    #isDragging = false;
    #offsetX;
    #offsetY;
    #panel;
    #startTime;
    #startFrame;
    #fps;
    #startStopButton = null;

    canvas;
    frontBuffer;
    isRunning = false;
    settings = null;
    mousePos = null;
    glMousePos = null;
    mouseButtons = [0, 0, 0];

    get size() {
        return [320, 240];
    }

    constructor() {
        this.#frame = 0;
        this.#initializedPromise = new Promise(
            resolved => {
                this.#initializedResolved = resolved;
            });
        this.mousePos = new Vec4(0, 0, 0, 0);
        this.glMousePos = new Vec4(0, 0, 0, 0);
    }

    async initialize() {
        this.canvas = document.querySelector('canvas');
        this.canvas.width = this.size[0];
        this.canvas.height = this.size[1];
        this.canvas.demo = this;
        this.canvas.addEventListener('pointerdown', Demo.dispatchEvent);
        this.canvas.addEventListener('pointerup', Demo.dispatchEvent);
        this.canvas.addEventListener('pointermove', Demo.dispatchEvent);
        this.canvas.addEventListener('wheel', Demo.dispatchEvent, { passive: false });
        await this.createSettingsPanel();
        this.#initializedResolved(true);
    }

    async destroy() {
        this.canvas.removeEventListener('pointerdown', Demo.dispatchEvent);
        this.canvas.removeEventListener('pointerup', Demo.dispatchEvent);
        this.canvas.removeEventListener('pointermove', Demo.dispatchEvent);
        let title = document.querySelector('#settings>div>span');
        title.removeEventListener('pointerdown', Demo.dispatchEvent);
        title.removeEventListener('pointerup', Demo.dispatchEvent);
        title.removeEventListener('pointermove', Demo.dispatchEvent);
    }

    onChange(id, value) {
        return true;
    }

    update(dt) {
    }

    render(dt) {
    }

    updateSetting(ctrl) {
        if (ctrl) {
            let value = parseFloat(ctrl.uiElement.value);
            if (this.onChange(ctrl.id, value)) {
                this.settings[ctrl.id].value = value;
            }
        }
    }

    startStop(btn) {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }

    static dispatchEvent(e) {
        let demo = e.target.demo;
        if (demo) {
            let handler = '';
            switch (e.type) {
                case 'pointerdown': handler = 'onPointerDown'; break;
                case 'pointerup': handler = 'onPointerUp'; break;
                case 'pointermove': handler = 'onPointerMove'; break;
                case 'wheel': handler = 'onWheel'; break;
            }
            if (typeof demo[handler] === 'function') {
                demo[handler](e);
            }
        }
    }

    setMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.mousePos.x = (e.clientX - rect.left) * scaleX;
        this.mousePos.y = (e.clientY - rect.top) * scaleY;
        this.glMousePos.x = 2.0 * this.mousePos.x/this.canvas.width - 1.0;
        this.glMousePos.y = 2.0 * (1.0 - this.mousePos.y/this.canvas.height) - 1.0;
    }

    onPointerDown(e) {
        if (e.target instanceof HTMLSpanElement) {
            this.#isDragging = true;
            this.#offsetX = e.clientX - this.#panel.offsetLeft;
            this.#offsetY = e.clientY - this.#panel.offsetTop;
        }
        else
        if (e.target instanceof HTMLCanvasElement) {
            this.mouseButtons = e.buttons;
            this.setMousePos(e);
        }
    }

    onPointerUp(e) {
        if (e.target instanceof HTMLSpanElement) {
            this.#isDragging = false;
            //this.#panel.style.cursor = 'grab';
            //this.#panel.releasePointerCapture(e.pointerId);
            localStorage.setItem('pp', JSON.stringify(
                [this.#panel.offsetLeft, this.#panel.offsetTop]));
        } else
        if (e.target instanceof HTMLCanvasElement) {
            this.mouseButtons = e.buttons;
            this.setMousePos(e);
        }
    }

    onPointerMove(e) {
        if (this.#isDragging) {
            this.#panel.style.left = (e.clientX - this.#offsetX) + 'px';
            this.#panel.style.top = (e.clientY - this.#offsetY) + 'px';
        } else
        if (e.target instanceof HTMLCanvasElement) {
            this.setMousePos(e);
        }
    }

    onWheel(e) {
    }

    async createSettingsPanel() {
        //let panel = new PanelControl('settings');
        let panel = document.querySelector('#settings');
        panel.innerHTML = '';
        // panel.header = 'Settings';
        // panel.enableDragging = true;
        // panel.addHandler('pointerdown', Demo.dispatchEvent);
        // panel.addHandler('pointerup', Demo.dispatchEvent);
        // panel.addHandler('pointermove', Demo.dispatchEvent);
        let header = document.createElement('div'); 
        header.className = 'settings';
        panel.appendChild(header);
        let title = document.createElement('span');
        title.className = 'settings';
        title.innerHTML = 'Settings';
        title.addEventListener('pointerdown', Demo.dispatchEvent);
        title.addEventListener('pointerup', Demo.dispatchEvent);
        title.addEventListener('pointermove', Demo.dispatchEvent);
        title.demo = this;
        header.appendChild(title);
        this.#fps = document.createElement('span');
        this.#fps.className = 'fps';
        this.#fps.innerHTML = '00.00';
        header.appendChild(this.#fps);
        for (let k in this.settings) {
            let setting = this.settings[k];
            // create control depending on setting type
            // - range
            // - dropdown list
            let control = null;
            if (Array.isArray(setting.list) || setting.min != undefined && setting.max != undefined) {
                control = new RangeControl(k);
                control.uiElement = new HtmlRangeElem(control);
                control.dataBind(setting);
                await control.initialize();
            }
            setting.control = control;
            control.addHandler('input', e => this.updateSetting(control));
            control.uiElement.parent = panel;
        }
        let buttons = document.createElement('div');
        buttons.className = 'buttons settings';
        let button = document.createElement('button');
        button.className = 'settings';
        button.innerHTML = '°~°';
        button.addEventListener('click', e => this.startStop(e.target));
        buttons.appendChild(button);
        panel.appendChild(buttons);
        this.#startStopButton = button;
        this.#panel = panel;

        let panelPosition = localStorage.getItem('pp');
        if (panelPosition) {
            let pos = JSON.parse(panelPosition);
            this.#panel.style.left = pos[0] + 'px';
            this.#panel.style.top = pos[1] + 'px';
        }
    }


    async run() {
        await this.#initializedPromise;
        this.restart();
    }

    pause() {
        if (this.isRunning) this.stop();
        else this.start();
    }

    start() {
        this.#ts = 0;
        this.#fps.innerHTML = '00.00';
        this.#startFrame = 0;
        this.#startTime = 0;
        this.isRunning = true;
        this.#startStopButton.innerHTML = 'Stop';
        this.#handler = requestAnimationFrame(time => this.#main(time));
    }

    stop() {
        this.#startStopButton.innerHTML = 'Start';
        this.isRunning = false;
    }

    restart() {
        this.#frame = 0;
        this.start();
    }

    #main(time) {
        cancelAnimationFrame(this.#handler);
        if (this.isRunning) {
            let delta = time - this.#startTime;
            if (delta > 1000) {
                // update fps value
                this.#fps.innerHTML =(1000*(this.#frame - this.#startFrame) / delta).toFixed(2);
                this.#startFrame = this.#frame;
                this.#startTime = time;
            }
            let dt = time - this.#ts;
            this.#ts = time;
            // check inputs
            // update
            this.update(this.#frame, dt);
            // render
            this.render(this.#frame, dt);
            this.#frame++;
            this.#handler = requestAnimationFrame(time => this.#main(time));
        }
    }
}