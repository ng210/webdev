import HtmlElem from "./html-elem.js";

export default class HtmlStaticElem extends HtmlElem {
    get value() { return this.elem.value; }
    set value(v) {
        this.elem.value = v;
        this.onChange(null);
    }

    constructor(control) {
        super(control);
        this.elem = this.createElement();
        this.addHandler('click', e => this.onChange(e));
    }

    createElement(data) {
        let span = document.createElement('span');
        span.id = `${this.control.id}_val`;
        span.className = 'static';
        return span;
    }

    onDataSourceChanged(ds) {
        this.elem.innerHTML = ds.value;
        this.onChange(null);
    }

    // render(dt, frame) { }

    onChange(e) {
        let v = this.value;
        if (this.control.dataSource.list) {
            this.elem.innerHTML = this.control.dataSource.list[v];
        } else {
            this.elem.innerHTML = v;
        }
        //this.elem.setAttribute('title', this.control.value);
    }
}