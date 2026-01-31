import Control from "./control.js";

export default class PanelControl extends Control {
    static #supportedEvents = ['pointerdown', 'pointerup', 'wheel'];
    get supportedEvents() { return [...super.supportedEvents, ...PanelControl.#supportedEvents]; }

    constructor(id) {
        super(id);
    }
}