export default class UiElement {
    get value() { throw new Error('Not implemented!'); }
    #control = null;
    get control() { return this.#control; }
    #parent = null;
    get parent() { return this.#parent; }
    set parent(v) { this.#parent = v; }
    constructor(control) { this.#control = control; }
    update(dt = 0, frame = 0) { throw new Error('Not implemented!'); }
    render(dt = 0, frame = 0) { throw new Error('Not implemented!'); }
    addHandler(event, handler) { throw new Error('Not implemented!'); }
}