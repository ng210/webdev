import Demo from '../base/demo.js'

export default class TimeTable extends Demo {
    #min = 0;
    #cx = 0;
    #cy = 0;
    #ctx = null;
    #counter = 0;

    get size() {
        return [600, 400];
    }

    static getColor(frame) {
        let ix = frame % 768;
        let r = 255, g = 255, b = 255;
        if (ix < 128) r = 255 - ix;
        else if (ix < 256) { r = 128; g = 384 - ix; }
        else if (ix < 384) { r = 128; g = ix - 128; }
        else if (ix < 512) { r = 128; g = 255; b = 768 - ix; }
        else if (ix < 640) { r = ix - 384; g = 255; b = 128; }
        else if (ix < 768) { r = 255; g = 255; b = ix - 512; }
        return [r, g, b];
    }

    constructor() {
        super();
        this.settings = {
            count:      { value: 3,     min:2,      max:500,  step: 1 },
            times:      { value: 2,     min:0,      max:9,    step: 0.1 },
            radius:     { value: 0.4,   min:0.1,    max:0.5,  step: 0.01 },
            delta:      { value: 0.1,   min:0.0,    max:0.5,  step: 0.01 },
            gradient:   { value: 0.2,   min:0.01,   max:1,    step: 0.01 },
            range:      { value: 0.3,   min:0.01,   max:1,    step: 0.01 },
        };
    }

    async initialize() {
        super.initialize();
        this.#ctx = this.canvas.getContext('2d');
        this.#counter = 0;
        this.settings.times.max = this.settings.count.value;
        this.onResize();
    }

    onResize(e) {
        this.#min = Math.min(this.canvas.width, this.canvas.height);
        this.#cx = 0.5*this.canvas.width;
        this.#cy = 0.5*this.canvas.height;
    }

    onChange(id, value) {
        switch (id) {
            case 'count':
                this.settings.times.max = value-1;
                this.settings.times.control.value = this.settings.times.value;
                this.settings.times.control.uiElement.onDataSourceChanged(this.settings.times);
                break;
            case 'times':
                this.#counter = value;
                break;
        }
        return true;
    }

    update(frame, dt) {
        if (this.settings.delta.value != 0) {
            let gradient = this.settings.gradient.value + 0.04 * this.settings.delta.value;
            if (gradient > 1) gradient -= 1;
            this.settings.gradient.value = gradient;
            this.settings.gradient.control.value = gradient;
            this.#counter += 0.01 * this.settings.delta.value*dt;
            if (this.#counter > this.settings.count.value) {
                this.#counter -= this.settings.count.value;
            }
            this.settings.times.value = this.#counter;
            this.settings.times.control.value = this.#counter;
        }
    }

    render(frame, dt) {
        this.#ctx.fillStyle = '#203040';
        this.#ctx.globalAlpha = 0.4;
        this.#ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
        this.#ctx.globalAlpha = 1;
        this.#ctx.strokeStyle = '#408060';
        let N = this.settings.count.value;
        let T = this.settings.times.value;
        let r = this.settings.radius.value*this.#min;
        let grad = this.settings.gradient.value;
        if (grad > 1) grad = 2 - grad;
        let grad1 = grad - this.settings.range.value;
        if (grad1 < 0) grad1 = 0;
        let grad2 = grad + this.settings.range.value;
        if (grad2 > 1) grad2 = 1;
        for (let i=0; i<=N; i++) {
            let j = (T*i) % N;
            let a = 2*Math.PI/N*i;
            let x1 = this.#cx + r*Math.cos(a);
            let y1 = this.#cy + r*Math.sin(a);
            this.#ctx.beginPath();
            this.#ctx.moveTo(x1, y1);
            a = 2*Math.PI/N*j;
            let x2 = this.#cx + r*Math.cos(a);
            let y2 = this.#cy + r*Math.sin(a);
            let gradient = this.#ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(grad1, '#203040');
            let col = `rgb(${TimeTable.getColor(frame)})`;
            gradient.addColorStop(grad, col);
            gradient.addColorStop(grad2, '#203040');
            this.#ctx.strokeStyle = gradient;
            this.#ctx.lineTo(x2, y2);
            this.#ctx.stroke();
        }
    }
}
