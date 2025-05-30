import HtmlControl from "./html-control.js";

export default class RangeControl extends HtmlControl {
    validEvents = ['input', 'change', 'pointermove', 'pointerover', 'pointerout'];

    get value() { return this.elem ? this.elem.value : undefined; }
    set value(v) {
        let min = this.elem.getAttribute('min');
        let max = this.elem.getAttribute('max');
        this.elem.value = v < min ? min : v > max ? max : v;
    }
    async initialize(data) {
        this.createElement('input');
        this.elem.setAttribute('type', 'range');
        if (this.dataSource != null) {
            this.elem.setAttribute('min', this.dataSource.min != undefined ? parseFloat(this.dataSource.min) : 0);
            this.elem.setAttribute('max', this.dataSource.max != undefined ? parseFloat(this.dataSource.max) :  100);
            this.elem.setAttribute('step', this.dataSource.step != undefined ? parseFloat(this.dataSource.step) : 1);
            this.elem.value = this.dataSource.value != undefined ? parseFloat(this.dataSource.value) : this.dataSource;
        }
    }

    constructor(id) {
        super(id);
    }

    update(dt, frame) { }
    render(dt, frame) { throw new Error('Not implemented!'); }
    addHandler(event, handler) {
        if (this.elem && this.validEvents.includes(event.toLowerCase())) {
            this.elem.addEventListener(event, handler);
        }
    }
}