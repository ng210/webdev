import UiElement from '../uielement.js'

export default class HtmlElem extends UiElement {
    #HTMLelem = null;
    set HTMLelem(v) { this.#HTMLelem = v; }
    get HTMLelem() { return this.#HTMLelem; }

    get left() { return this.#HTMLelem.style.left; }
    set left(v) { this.#HTMLelem.style.left = `${v}px`; }
    get top() { return this.#HTMLelem.style.top; }
    set top(v) { this.#HTMLelem.style.top = `${v}px`; }
    get width() { return this.#HTMLelem.style.width; }
    set width(v) { this.#HTMLelem.style.width = `${v}px`; }
    get height() { return this.#HTMLelem.style.height; }
    set height(v) { this.#HTMLelem.style.height = `${v}px`; }
    get value() { return this.#HTMLelem.value; }

    static create(elem, control) {
        if (elem instanceof HTMLElement) {
            return new HtmlElem(control, elem);
        }
    }

    constructor(control, htmlElement = null) {
        super(control);
        if (htmlElement != null) {
            this.#HTMLelem = htmlElement;
        }
    }

    appendChild(child) {
        if (this.#HTMLelem != null && child.HTMLelem != null) {
            this.#HTMLelem.appendChild(child.HTMLelem);
            return true;
        } else return false;
    }

    removeChild(child) {
        this.#HTMLelem.removeChild(child.HTMLelem);
    }

    update(dt = 0, frame = 0) { }
    
    render(dt = 0, frame = 0) { }
    
    addHandler(event, handler) {
        this.HTMLelem.addEventListener(event, handler);
    }

    onDataSourceChanged(ds) { throw new Error('Not implemented!'); }

    createElement(data) { throw new Error('Not implemented!'); }
}