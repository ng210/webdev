import UiElement from '../uielement.js'

export default class HtmlElem extends UiElement {
    #elem = null;
    set elem(v) { this.#elem = v; }
    get elem() { return this.#elem; }

    get value() { return this.#elem.value; }

    get parent() { return super.parent; }
    set parent(v) {
        super.parent = v;
        v.appendChild(this.elem);
    }

    constructor(control) {
        super(control)
    }
    update(dt = 0, frame = 0) { }
    render(dt = 0, frame = 0) { }
    addHandler(event, handler) {
        this.#elem.addEventListener(event, handler);
    }

    createElement(data) { throw new Error('Not implemented!'); }

    append(parent) {
        if (this.#elem != null) {
            parent.appendChild(this.#elem);
        }
    }
}