export default class Control {
    #elem = null;
    get elem() { return this.#elem; }
    #onChange = null;
    #id = null;
    get id() { return this.#id; }
    setting = null;
    set onChange(handler) {
        if (typeof handler === 'function') {
            this.#elem.addEventListener('input', e => handler(e.target.control));
            this.#onChange = handler;
        }
    }

    get value() {
        return parseFloat(this.#elem.value);
    }

    constructor(id, setting) {
        this.#id = id;
        this.setting = setting;
        let el = document.createElement('input');
        el.id = id;
        el.type = 'range';
        el.className = 'settings';
        el.setAttribute('min', setting.min);
        el.setAttribute('max', setting.max);
        el.setAttribute('step', setting.step);
        el.value = setting.value;
        el.control = this;

        this.#elem = el;
    }

    inc() {
        let v = this.value + this.setting.step;
        if (v > this.setting.max) v = this.setting.max;
        if (v != this.setting.value) {
            this.#elem.value = v;
            this.#onChange(this);
        }
    }

    dec() {
        let v = this.value - this.setting.step;
        if (v < this.setting.min) v = this.setting.min;
        if (v != this.setting.value) {
            this.#elem.value = v;
            this.#onChange(this);
        }
    }
}