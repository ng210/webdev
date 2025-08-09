export default class UiElement {
    get left() { throw new Error('Not implemented!'); }
    set left(l) { throw new Error('Not implemented!'); }
    get top() { throw new Error('Not implemented!'); }
    set top(t) { throw new Error('Not implemented!'); }
    get width() { throw new Error('Not implemented!'); }
    set width(w) { throw new Error('Not implemented!'); }
    get height() { throw new Error('Not implemented!'); }
    set height(h) { throw new Error('Not implemented!'); }

    get value() { throw new Error('Not implemented!'); }
    #control = null;
    get control() { return this.#control; }

    constructor(control) { this.#control = control; }

    addHandler(event, handler) { throw new Error('Not implemented!'); }
    appendChild(child) { throw new Error('Not implemented!'); }
    update(dt = 0, frame = 0) { throw new Error('Not implemented!'); }
    render(dt = 0, frame = 0) { throw new Error('Not implemented!'); }
    removeChild(child) { throw new Error('Not implemented!'); }

    onDataSourceChanged(ds) { throw new Error('Not implemented!'); }
}