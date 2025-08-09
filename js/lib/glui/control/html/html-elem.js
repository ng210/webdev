import UiElement from '../uielement.js'

export default class HtmlElem extends UiElement {
    #elem = null;
    set elem(v) { this.#elem = v; }
    get elem() { return this.#elem; }

    get left() { return this.#elem.style.left; }
    set left(v) { this.#elem.style.left = `${v}px`; }
    get top() { return this.#elem.style.top; }
    set top(v) { this.#elem.style.top = `${v}px`; }
    get width() { return this.#elem.style.width; }
    set width(v) { this.#elem.style.width = `${v}px`; }
    get height() { return this.#elem.style.height; }
    set height(v) { this.#elem.style.height = `${v}px`; }

    get value() { return this.#elem.value; }

    constructor(control, htmlElement = null) {
        super(control);
        if (htmlElement != null) {
            this.#elem = htmlElement;
        }
    }

    appendChild(child) {
        if (this.#elem != null && child.elem != null) {
            this.#elem.appendChild(child.elem);
            return true;
        } else return false;
    }

    removeChild(child) {
        this.#elem.removeChild(child.elem);
    }

    update(dt = 0, frame = 0) { }
    
    render(dt = 0, frame = 0) { }
    
    addHandler(event, handler) {
        this.elem.addEventListener(event, handler);
    }

    onDataSourceChanged(ds) { throw new Error('Not implemented!'); }

    createElement(data) { throw new Error('Not implemented!'); }
}