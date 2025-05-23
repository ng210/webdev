import { implement } from '/js/lib/util.js'

class IControl {
    get id() { throw new Error('Not implemented!'); }
    addHandler(eventName, handler, options) { throw new Error('Not implemented!'); }
}

class HtmlControl extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {}

    disconnectedCallback() {}

    baka() {}
}

implement(HtmlControl, IControl);
window.customElements.define('html-control', HtmlControl);

class WebglControl {

}

class RangeHtmlControl extends HtmlControl {
    constructor() {
        super();
        debugger
    }
}

window.customElements.define('range-control', RangeHtmlControl);

class RangeWebglControl extends WebglControl {

}

export { HtmlControl, RangeHtmlControl };