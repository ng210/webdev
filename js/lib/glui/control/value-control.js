import Control from './control.js';

export default class ValueControl extends Control {
    static #supportedEvents = ['change', 'changed', 'dataBound'];
    get supportedEvents() { return [...super.supportedEvents, ...ValueControl.#supportedEvents]; }
    
    static #defaultDataField = 'value';
    #defaultDataSource;
    #dataSource;
    get dataSource() { return this.#dataSource; }
    #dataField;
    get dataField() { return this.#dataField; }
    get value() { return this.#dataSource[this.#dataField]; }
    set value(newValue) {
        this.#dataSource[this.#dataField] = newValue;
        this.trigger({
            type: 'changed',
            target: this,
            value: newValue
        });
        if (this.view) this.view.update();  // invalidate view
    }

    format = '';

    toFormat(v) {
        // Allowed format
        // - number: nd
        // - string: s
        // - date: YYYY?MM?dd
        if (v != undefined) {
            if (!isNaN(v) && this.format == 'n2') {
                return Math.round(v * 100) / 100;
            } else {
                return v;
            }
        }
        return v;
    }

    dataBind(source = this.#defaultDataSource, field = ValueControl.#defaultDataField) {
        if (!source || !(field in source)) {
            throw new Error("Data source and field must be valid!");
        }

        this.trigger({
            type: 'dataBound',
            target: this,
            source: source,
            field: field
        });
    }

    onDataBound(event) {
        this.#dataSource = event.source;
        this.#dataField = event.field;
        this.value = this.#dataSource[this.#dataField];
        if (this.view) this.view.update();
    }

    constructor(id, value) {
        super(id);
        this.#defaultDataSource = Object.seal({ [ValueControl.#defaultDataField]: value });
        this.#dataSource = this.#defaultDataSource;
        this.#dataField = ValueControl.#defaultDataField;
    }
}