import IControl from '/js/lib/glui/control/icontrol.js'

export default class HtmlControl extends IControl {
    #id = '';
    get id() { return this.#id; }
    #dataSource = null;
    get dataSource() { return this.#dataSource; }
    set dataSource(ds) { this.#dataSource = ds; }
    #elem = null;
    get elem() { return this.#elem; }
    set elem(v) { this.#elem = v; }

    constructor(id) {
        super();
        this.#id = id;
    }

    async initialize(data) {
        this.#elem = this.createElement(data);
        this.#elem.control = this;
    }

    createElement(data) { throw new Error('Not implemented!'); }

    append(parent) {
        if (this.#elem != null) {
            parent.appendChild(this.#elem);
        }
    }

    addHandlerImpl(event, handler) {
        this.#elem.addEventListener(event, handler);
    }
}