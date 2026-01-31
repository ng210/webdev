import HtmlView from "./html-view.js";

export default class HtmlRangeView extends HtmlView {
    render(context, dt, frame) {
        // this.element = document.createElement('span');
        // this.element.textContent = this.control.value;
        // parentElement.appendChild(this.element);
        // this.bindEvents();
    }

    update() {
        if (this.element) {
            this.element.min = this.control.min;
            this.element.max = this.control.max;
            this.element.step = this.control.step;
            this.element.value = this.control.rangeValue;
        }
    }

    async onAttach(control) {
        await super.onAttach(control);
    }

    constructor(htmlElement = null) {
        super(htmlElement);
        this.createElement('input', ['glui-range']);
        this.element.type = 'range';
    }
}