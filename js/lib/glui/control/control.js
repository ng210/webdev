// base class
export default class Control {
    #id = '';
    get id() { return this.#id; }
    set id(v) { this.#id = v; }
    #label = '';
    get label() { return this.#label; }
    set label(v) { this.#label = v; }
    #value = null;
    get value() { return this.#value; }
    set value(v) {
        this.#value = v;
        if (this.uiElement != null) {
            this.uiElement.value = v;
        }
    }
    #uiElement = null;
    get uiElement() { return this.#uiElement; }
    set uiElement(v) {
        this.#uiElement = v;
        // add handlers
        for (let event in this.#handlers) {
            for (let handler of this.#handlers[event]) {
                this.#uiElement.addHandler(event, handler);
            }
        }
        // update/render?
    }
    #dataSource = null;
    get dataSource() { return this.#dataSource; }
    #title = '';
    get title() { return this.#title; }
    set title(v) { this.#title = v; }
    get validEvents() { throw new Error('Not implemented!'); }

    #handlers = {};
    get handlers() { return this.#handlers; }

    constructor(id) {
        this.id = id;
        this.label = id;
    }

    async initialize(data) { throw new Error('Not implemented!'); }
    dataBind(dataSource) {
        this.#dataSource = dataSource;
        this.value = dataSource.value;
        this.uiElement.onDataSourceChanged(dataSource);
    }

    addHandler(event, handler) {
        if (this.validEvents.includes(event) && typeof handler === 'function') {
            if (this.#handlers[event] == null) this.#handlers[event] = [];
            this.#handlers[event].push(handler);
            if (this.#uiElement != null) {
                this.#uiElement.addHandler(event, handler);
            }
        }
    }
}