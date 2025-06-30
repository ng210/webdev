import Control from "./control.js";

export default class RangeControl extends Control {
    static #validEvents = ['input', 'change', 'pointermove', 'pointerover', 'pointerout'];
    get value() { return super.value; }
    set value(v) {
        if (v < this.dataSource.min) v = this.dataSource.min;
        else if (v > this.dataSource.max) v = this.dataSource.max;
        if (Array.isArray(this.dataSource.list)) {
            v = this.dataSource.list[v];
        }
        super.value = v;
    }
    #min = 0;
    get min() { return this.dataSource ? this.dataSource.min : this.#min; }
    #max = 1;
    get max() { return this.dataSource ? this.dataSource.max : this.#max; }
    #step = 0.1;
    get step() { return this.dataSource ? this.dataSource.step : this.#step; }
    get validEvents() { return RangeControl.#validEvents; }

    constructor(id) {
        super(id);
    }

    async initialize(data) {
        // this.addHandler('change', e => this.onInputOrChange(e));
        // this.addHandler('input', e => this.onInputOrChange(e));
    }

    dataBind(dataSource) {
        if (dataSource.list != undefined && Array.isArray(dataSource.list)) {
            dataSource = {
                min: 0,
                max: dataSource.list.length-1,
                step: 1,
                value: dataSource.value || 0,
                list: dataSource.list
            };
        }
        if (dataSource.min == undefined || dataSource.max == undefined
            || dataSource.step == undefined || dataSource.value == undefined)
            throw new Error('Invalid data source!');
        super.dataBind(dataSource);
    }

    // onInputOrChange(e) {
    //     this.value = this.uiElement.value;
    //     this.title = this.value;
    //     //this.uiElement.update();
    // }
}