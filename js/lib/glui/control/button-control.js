import ValueControl from './value-control.js';

export default class ButtonControl extends ValueControl {
    static #supportedEvents = ['click', 'pointerenter', 'pointerleave', 'pointerdown', 'pointerup', 'dataBound'];
    get supportedEvents() { return [...ButtonControl.#supportedEvents]; }

    constructor(id, value) {
        super(id, value);
    }
}