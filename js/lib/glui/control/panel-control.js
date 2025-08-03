import Control from "./control.js";

export default class PanelControl extends Control {
    static #validEvents = ['input', 'change', 'pointermove', 'pointerover', 'pointerout'];
    get validEvents() { return PanelControl.#validEvents; }

    constructor(id) {
        super(id);
    }

    async initialize(data) {
    }
}