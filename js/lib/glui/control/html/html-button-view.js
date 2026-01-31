import HtmlView from './html-view.js'

export default class HtmlButtonView extends HtmlView {
    render(context, dt, frame) { }

    update() {
        if (this.element) {
            this.element.textContent = this.control.value;
        }
    }

    constructor(htmlElement = null) {
        super(htmlElement);
        this.createElement('button', ['glui-button']);
    }
}