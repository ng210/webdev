import Ui from '../irenderer.js';

class HtmlUi extends Ui {
    get name() { return 'HtmlUi'; }
    #id = 0;
    #registeredElements = [];
    get registeredElements() { return this.#registeredElements; }

    createElem(name, data) {
        let settings = {
            id: `elem${this.#id++}`,
            tag: 'div'
        };
        if (typeof data === 'string') {
            tag = data.toLowerCase();
        } else if (typeof data === 'object') {
            settings = Object.assign(settings, data);
        }
        
        let ctor = this.#registeredElements[settings.tag];
        if (ctor != null) {
        if (this.#registeredElements.includes(elem)) return;

        switch (settings.tag) {
            case 'div':
            case 'span':
            case 'input':
            case 'button':
        }
    }

    registerElement(name, ctor) {
        if (this.#registeredElements[tag]) return;
        this.#registeredElements[tag] = ctor;
    }
}