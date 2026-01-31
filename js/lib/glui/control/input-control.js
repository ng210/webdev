import ValueControl from './value-control.js';

export default class InputControl extends ValueControl {
    static #supportedEvents = ['keydown', 'keyup', 'input'];
    get supportedEvents() { return [...super.supportedEvents, ...InputControl.#supportedEvents]; }

    keyDown(event) {
        switch (event.key) {
            case 'ArrowLeft':
                break;
            case 'ArrowRight':
                break;
            case 'ArrowUp':
                break;
            case 'ArrowDown':
                break;
            case 'PageUp':
                break;
            case 'PageDown':
                break;
            case 'Home':
                break;
            case 'End':
                break;
            default:
                break;
        }
    }

    keyUp(event) {
        switch (event.key) {
            default:
        }
    }

    constructor(id, value) {
        super(id, value);
        this.on('keydown', this.keyDown.bind(this));
        this.on('keyup', this.keyUp.bind(this));
    }
}