import HtmlElem from "./html-elem.js";

export default class HtmlRangeElem extends HtmlElem {
    #lbl = null;
    #inp = null;
    #val = null;

    get value() {
        let v = this.#inp.value; 
        if (this.control.dataSource.list) {
            v = this.control.dataSource.list[v];
        }
        return v;
    }
    set value(v) {
        this.#inp.value = v;
        this.onChange(null);
    }

    constructor(control) {
        super(control);
        this.elem = this.createElement();
        this.addHandler('change', e => this.onChange(e));
        this.addHandler('input', e => this.onChange(e));
    }

    createElement(data) {
        let cnt = document.createElement('div');
        cnt.id = `${this.control.id}_cnt`;
        cnt.className = 'range';
        this.#lbl = document.createElement('label');
        this.#lbl.id = `${this.control.id}_lbl`;
        this.#lbl.innerHTML = this.control.label || '';
        this.#lbl.className = 'range';
        this.#inp = document.createElement('input');
        let id = `${this.control.id}_inp`;
        this.#inp.id = id;
        this.#inp.setAttribute('name', id);
        this.#inp.setAttribute('type', 'range');
        this.#inp.className = 'range';
        this.#val = document.createElement('span');
        this.#val.id = `${this.control.id}_val`;
        this.#val.innerHTML = this.control.value;
        this.#val.className = 'range';
        cnt.appendChild(this.#lbl);
        cnt.appendChild(this.#inp);
        cnt.appendChild(this.#val);
        this.#lbl.setAttribute('for', id);
        return cnt;
    }

    onDataSourceChanged(ds) {
        this.#inp.setAttribute('min', parseFloat(ds.min));
        this.#inp.setAttribute('max', parseFloat(ds.max));
        this.#inp.setAttribute('step', parseFloat(ds.step));
        this.#inp.value = ds.value;
        this.onChange(null);
    }

    // render(dt, frame) { }

    onChange(e, ctrl) {
        debugger
        this.#val.innerHTML = this.value;
        // let v = this.#inp.value;
        // if (this.control.dataSource.list) {
        //     this.#val.innerHTML = this.control.dataSource.list[v];
        // } else {
        //     this.#val.innerHTML = v;
        // }
        //this.elem.setAttribute('title', this.control.value);
    }
}