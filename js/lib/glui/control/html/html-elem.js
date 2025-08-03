import UiElement from '../uielement.js'

export default class HtmlElem extends UiElement {
    #elem = null;
    set elem(v) { this.#elem = v; }
    get elem() { return this.#elem; }

    get value() { return this.#elem.value; }

    constructor(control) {
        super(control);
    }

    appendChild(child) {
        if (this.#elem != null && child.elem != null) {
            this.#elem.appendChild(child);
            return true;
        } else return false;
    }
    update(dt = 0, frame = 0) { }
    render(dt = 0, frame = 0) { }
    addHandler(event, handler) {
        this.#elem.addEventListener(event, handler);
    }

    onDataSourceChanged(ds) { throw new Error('Not implemented!'); }

    createElement(data) { throw new Error('Not implemented!'); }
}