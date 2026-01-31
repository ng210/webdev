import InputControl from "./input-control.js";

export default class RangeControl extends InputControl {
    //static #supportedEvents = ['input', 'change'];
    get supportedEvents() { return [...super.supportedEvents/*, ...RangeControl.#supportedEvents*/]; }

    #min = 0;
    get min() { return this.#min; }
    #max = 1;
    get max() { return this.#max; }
    #step = 0.1;
    get step() { return this.#step; }

    #itemList;
    set source(v) {
        if (Array.isArray(v)) {
            this.#min = 0;
            this.#max = v.length - 1;
            this.#step = 1;
            this.#itemList = [...v];
            this.value = this.#itemList[this.value] ?? this.#itemList[0];
        } else {
            this.#itemList = null;
            this.#min = v.min ?? 0;
            this.#max = v.max ?? 100;
            this.#step = v.step ?? 1;
        }
        this.view.update();
    }

    get selectedIndex() {
        if (this.#itemList) {
            return this.#itemList.indexOf(super.value);
        } else {
            return Math.round((super.value - this.#min) / this.#step);
        }
    }

    get value() {
        let v = super.value;
        if (this.#itemList) {
            return this.#itemList.includes(v) ? v : null;
        } else {
            if (v < this.#min || v > this.#max) return null;
            let ix = Math.round((super.value - this.#min) / this.#step);
            return this.#min + ix * this.#step;
        }
    }

    get rangeValue() {
        return this.#itemList ? this.selectedIndex : this.value;
    }

    set value(v) {
        if (this.#itemList) {
            if (!this.#itemList.includes(v)) v = null;
        } else {
            if (v >= this.#min && v <= this.#max) {
                let ix = Math.round((v - this.#min) / this.#step);
                v = this.#min + ix * this.#step;
            }
        }

        super.value = v;
    }

    onChange(event) {
        if (this.#itemList) {
            let ix = parseInt(event.newValue);
            this.value = this.#itemList[ix];
        } else if (typeof this.value === 'number') {
            this.value = parseFloat(event.newValue);
        }
    }

    #change(event) {
        this.view.update();
    }

    constructor(id, value) {
        super(id, value);
        this.on('change', this.#change, this);
    }
}