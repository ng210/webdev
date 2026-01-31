import UiElement from '../glui/control/uielement.js'

export default class WebGLElem extends UiElement {
    #gl = null;
    get elem() { return this.#gl; }

    // get value() { return this.#elem.value; }

    get parent() { return super.parent; }
    set parent(v) {
        super.parent = v;
        v.appendChild(this.elem);
    }

    constructor(control) {
        super(control)
    }

    update(dt = 0, frame = 0) { throw new Error('Not implemented!'); }
    render(dt = 0, frame = 0) { throw new Error('Not implemented!'); }
    addHandler(event, handler) { throw new Error('Not implemented!'); }

    onDataSourceChanged(ds) { throw new Error('Not implemented!'); }
}