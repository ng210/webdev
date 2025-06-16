// interface
export default class IControl {
    get id() { throw new Error('Not implemented!'); }
    set id(v) { throw new Error('Not implemented!'); }
    get dataSource() { throw new Error('Not implemented!'); }
    set dataSource(ds) { throw new Error('Not implemented!'); }
    get value() { throw new Error('Not implemented!'); }
    set value(v) { throw new Error('Not implemented!'); }
    get validEvents() { throw new Error('Not implemented!'); }
    #handlers = {};
    get handlers() { return this.#handlers; }

    constructor() {}
    async initialize(data) { throw new Error('Not implemented!'); }
    update(dt, frame) { throw new Error('Not implemented!'); }
    render(dt, frame) { throw new Error('Not implemented!'); }
    addHandler(event, handler) {
        if (this.validEvents.includes(event) && typeof handler === 'function') {
            this.addHandlerImpl(event, handler);
        }
    }
    addHandlerImpl(event, handler) { throw new Error('Not implemented!'); }
}