import HtmlView from './html-view.js';

export default class HtmlStaticView extends HtmlView {
    #decimals = 3;
    get decimals() { return this.#decimals; }
    set decimals(d) {
        this.#decimals = d;
        this.update();
    }

    render(context, dt, frame) {
        // this.element = document.createElement('span');
        // this.element.textContent = this.control.value;
        // parentElement.appendChild(this.element);
        // this.bindEvents();
    }

    update() {
        if (this.element) {
            this.element.textContent = typeof this.control.value === 'number' ?
                this.control.value.toFixed(this.decimals) :
                this.control.value;                
        }
    }

    constructor(htmlElement = null) {
        super(htmlElement);
        this.createElement('span', ['glui-static']);
    }
}
