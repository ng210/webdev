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

    createElement(tag) {
        this.#elem = document.createElement(tag);
        this.#elem.setAttribute('title', this.id);
        this.#elem.control = this;
    }

    append(parent) {
        if (this.#elem != null) {
            parent.appendChild(this.#elem);
        }
    }
}