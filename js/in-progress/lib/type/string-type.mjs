import { TypeManager, Type, ValidationResult } from './type-manager.mjs'

class StringType extends Type {
    static #definition = {
        name:'string',
        jsType:'string',
        default:'',
        length:-1
    };

    length = StringType.#definition.length;

    constructor(definition) {
        definition.baseType = definition.baseType || 'string';
        super(definition);        
    }

    async initialize() {
        if (!isNaN(this.definition.length)) this.length = this.definition.length;
        this.defaultValue = this.createValue(this.definition.default || StringType.#definition.default);
    }

    compare(a, b) {
        return a.valueOf().localeCompare(b.valueOf());
    }

    parseJsonInt(json, path) {
        return JSON.parse(json.trim());
    }

    validate(value, results, path, visited) {
        results = results || [];
        var v = value.valueOf();
        var isValid = true;
        if (typeof v !== 'string') {
            results.push(new ValidationResult('value', [`'${value}' is not a string!`]));
            isValid = false;
        }
        if (this.length != -1 && v.length > this.length) {
            results.push(new ValidationResult('value', ['String is too long!']))
            isValid = false;
        }

        return isValid;
    }

    static {
        TypeManager.instance.createType(StringType, StringType.#definition);
    }
}

export { StringType };
