import PanelControl from '../../lib/glui/control/panel-control.js'
import StaticControl from '../../lib/glui/control/static-control.js'
import RangeControl from '../../lib/glui/control/range-control.js'
import ButtonControl from '../../lib/glui/control/button-control.js'
import HtmlView from '../../lib/glui/control/html/html-view.js'
import HtmlStaticView from '../../lib/glui/control/html/html-static-view.js'
import HtmlRangeView from '../../lib/glui/control/html/html-range-view.js'
import HtmlButtonView from '../../lib/glui/control/html/html-button-view.js'
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
    #settingsPanel;
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

    body = null;

    get size() {
        return [320, 240];
    }

    async createCanvas() {
        this.canvasControl = new PanelControl('canvas');
        this.canvasControl.parent = this.body;
        await this.canvasControl.setView(new HtmlView(document.createElement('canvas')));
        this.canvas = this.canvasControl.view.element;
        // *** todo: generic solution
        this.canvasControl.view.element.width = this.size[0];
        this.canvasControl.view.element.height = this.size[1];
        this.canvasControl.demo = this;
        this.canvasControl.on('pointerdown', this.dispatchEvent, this);
        this.canvasControl.on('pointerup', this.dispatchEvent, this);
        this.canvasControl.on('pointermove', this.dispatchEvent, this);
        this.canvasControl.on('wheel', this.dispatchEvent, this); //, { passive: false });
    }

    constructor() {
        this.#frame = 0;
        this.#initializedPromise = new Promise(
            resolved => {
                this.#initializedResolved = resolved;
            });
        this.mousePos = new Vec4(0, 0, 0, 0);
        this.glMousePos = new Vec4(0, 0, 0, 0);

        this.body = new PanelControl('body');
        this.body.setView(new HtmlView(document.body));
    }

    async initialize() {
        await this.createSettingsPanel();
        this.#initializedResolved(true);
        await this.createCanvas();
    }

    async destroy() {
        this.stop();
        this.canvasControl.off('pointerdown',this.dispatchEvent);
        this.canvasControl.off('pointerup',this.dispatchEvent);
        this.canvasControl.off('pointermove',this.dispatchEvent);
        this.canvasControl.off('wheel',this.dispatchEvent);
        // let title = document.querySelector('#settings>div>span');
        // title.removeEventListener('pointerdown', Demo.dispatchEvent);
        // title.removeEventListener('pointerup', Demo.dispatchEvent);
        // title.removeEventListener('pointermove', Demo.dispatchEvent);
        await this.#settingsPanel.destroy();
        await this.canvasControl.destroy();
        this.canvas = null;
    }

    onChange(ctrl) {
        return;
    }

    update(dt) {
    }

    render(dt) {
    }

    updateSetting(event) {
        let ctrl = event.target;
        if (ctrl) {
            this.onChange(ctrl);
            // //let value = parseFloat(ctrl.uiElement.value);
            // if (this.onChange(ctrl)) {
            //     this.settings[ctrl.id].value = value;
            // }
        }
    }

    startStop() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }

    dispatchEvent(event) {
        const handlerName = 'on' + event.type[0].toUpperCase() + event.type.slice(1);
        const handler = this[handlerName];
        if (typeof handler === 'function') {
            try {
                const result = handler.call(this, event, this);
                if (result === true) return true; // stop propagation
            } catch (e) {
                console.error(`Error in ${handlerName}:`, e);
            }
        }
        return false;
    }

    onPointerdown(event) {
        this.mouseButtons = event.buttons;
    }

    onPointerup(event) {
        this.mouseButtons = event.buttons;
    }

    onPointermove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.mousePos.x = (event.x - rect.left) * scaleX;
        this.mousePos.y = (event.y - rect.top) * scaleY;
        this.glMousePos.x = 2.0 * this.mousePos.x/this.canvas.width - 1.0;
        this.glMousePos.y = 2.0 * (1.0 - this.mousePos.y/this.canvas.height) - 1.0;
    }

    onWheel(event) {
    }

    async createSettingsPanel() {
        let panel = this.#settingsPanel = new PanelControl('settings');
        panel.parent = this.body;
        panel.addDragging();
        await panel.setView(new HtmlView(document.createElement('div')));

        let header = new PanelControl('settings-header');
        header.parent = panel;
        await header.setView(new HtmlView(document.createElement('div')));

        let title = new StaticControl('title');
        title.parent = header;
        title.value = 'Settings';
        await title.setView(new HtmlStaticView());
        title.addVisualClass('title');
        title.addVisualClass('settings');
        this.#fps = new StaticControl('fps');
        this.#fps.value = '00.00';
        this.#fps.parent = header;
        await this.#fps.setView(new HtmlStaticView());
        this.#fps.addVisualClass('fps');
        this.#fps.addVisualClass('settings');

        for (let k in this.settings) {
            let setting = this.settings[k];
            // create control depending on setting type
            // - range
            // - dropdown list
            let container = new PanelControl(`cnt-${k}`);
            container.parent = panel;
            await container.setView(new HtmlView(document.createElement('div')));
            container.addVisualClass('cnt');
            container.addVisualClass('settings');

            let label = new StaticControl(`lbl-${k}`);
            label.value = k;
            label.parent = container;
            await label.setView(new HtmlStaticView());
            label.addVisualClass('label');
            label.addVisualClass('settings');

            let isList = Array.isArray(setting.list);
            let control = null;
            if (isList || setting.min != undefined && setting.max != undefined) {
                control = new RangeControl(k);
                control.parent = container;
                await control.setView(new HtmlRangeView());
                if (isList) {
                    control.source = setting.list;
                } else {
                    control.source = setting;
                }
                control.addVisualClass('range');
            }
            control.addVisualClass('settings');
            setting.control = control;
            control.on('changed', this.updateSetting, this);

            let value = new StaticControl(`val-${k}`)
            value.parent = container;
            await value.setView(new HtmlStaticView());
            value.view.decimals = 2;
            value.addVisualClass('value');
            value.addVisualClass('settings');
            value.dataBind(setting);
            control.dataBind(value);
        }

        let buttons = new PanelControl('buttons');
        buttons.parent = panel;
        await buttons.setView(new HtmlView(document.createElement('div')));
        buttons.addVisualClass('buttons');
        buttons.addVisualClass('settings');
        let button = new ButtonControl('startStop', '°~°');
        button.parent = buttons;
        await button.setView(new HtmlButtonView());
        button.addVisualClass('button');
        button.addVisualClass('settings');
        button.suppressedEvents = ['pointerdown'];
        button.onClick = event => {
            this.startStop();
            return true;
        };
        this.#startStopButton = button;
        
        // button.addHandler('click', e => this.startStop(e.target));
        // buttons.appendChild(button);
        // this.#settingsPanel.appendChild(buttons);
        

        // // let header = document.createElement('div'); 
        // // header.className = 'settings';
        // // panel.appendChild(header);
        // // let title = document.createElement('span');
        // // title.className = 'settings';
        // // title.innerHTML = 'Settings';
        // // title.addEventListener('pointerdown', Demo.dispatchEvent);
        // // title.addEventListener('pointerup', Demo.dispatchEvent);
        // // title.addEventListener('pointermove', Demo.dispatchEvent);
        // // title.demo = this;
        // // header.appendChild(title);
        // // this.#fps = document.createElement('span');
        // // this.#fps.className = 'fps';
        // // this.#fps.innerHTML = '00.00';
        // // header.appendChild(this.#fps);
        // // for (let k in this.settings) {
        // //     let setting = this.settings[k];
        // //     // create control depending on setting type
        // //     // - range
        // //     // - dropdown list
        // //     let control = null;
        // //     if (Array.isArray(setting.list) || setting.min != undefined && setting.max != undefined) {
        // //         control = new RangeControl(k);
        // //         control.uiElement = new HtmlRangeElem(control);
        // //         control.dataBind(setting);
        // //         await control.initialize();
        // //     }
        // //     setting.control = control;
        // //     control.addHandler('input', e => this.updateSetting(control));
        // //     control.uiElement.parent = panel;
        // // }
        // // let buttons = document.createElement('div');
        // // buttons.className = 'buttons settings';
        // // let button = document.createElement('button');
        // // button.className = 'settings';
        // // button.innerHTML = '°~°';
        // // button.addEventListener('click', e => this.startStop(e.target));
        // // buttons.appendChild(button);
        // // panel.appendChild(buttons);
        // // this.#startStopButton = button;
        // // //this.#panel = panel;

        // let panelPosition = localStorage.getItem('pp');
        // if (panelPosition) {
        //     let pos = JSON.parse(panelPosition);
        //     this.#settingsPanel.left = pos[0];
        //     this.#settingsPanel.top = pos[1];
        // }
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
        this.#startStopButton.value = 'Stop';
        this.#handler = requestAnimationFrame(time => this.#main(time));
    }

    stop() {
        this.#startStopButton.value = 'Start';
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