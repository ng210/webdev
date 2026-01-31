import Control from "./control";

export default class Container extends Control {
    #children;
    get children() { return [...this.#children]; }

    constructor(id, parent = null) {
        super(id, parent);
        this.#children = [];
    }

    addChild(ctrl) {
        if (this.#children.includes(ctrl)) return;
        if (ctrl.parent) {
            ctrl.parent.removeChild(ctrl);
        }
        ctrl.parent = this;
        this.#children.push(ctrl);
    }

    removeChild(ctrl) {
        const i = this.#children.indexOf(ctrl);
        if (i !== -1) {
            this.#children.splice(i, 1);
            if (ctrl.parent === this) {
                ctrl.parent = null;
            }
        }
    }
}