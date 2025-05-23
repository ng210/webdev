import { TypeManager, Type, ValidationResult } from './type-manager.mjs'

class BoolType extends Type {
    static #definition = {
        name:'bool',
        jsType:'bool',
        default:true
    };
    // constructor(name) {
    //     super(name);
    //     //this.defaultValue = this.createValue(true);
    // }

    compare(a, b) {
        var i = a.valueOf() ? 1 : 0;
        var j = b.valueOf() ? 1 : 0;
        return i - j;
    }

    parseJsonInt(json, path) {
        var v = json.toLowerCase().trim();
        var value;
        if (v === 'true') value = true;
        else if (v === 'false') value = false;
        return value;
    }

    validate(value, results, path, visited) {
        var res = true;
        results = results || [];
        if (value.valueOf() !== true && value.valueOf() !== false) {
            results.push(new ValidationResult('value', 'Value must be boolean: true or false!'));
            res = false;
        }
        return res;
    }

    toString(obj, path, visited) {
        return obj ? 'true' : 'false';
    }

    static {
        TypeManager.instance.createType(BoolType, BoolType.#definition);
    }
}

export { BoolType };