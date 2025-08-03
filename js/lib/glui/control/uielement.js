export default class UiElement {
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