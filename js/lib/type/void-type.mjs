import { TypeManager, Type, ValidationResult } from './type-manager.mjs'

class VoidType extends Type {
    constructor(definition) {
        super(definition);
    }

    async initialize() {
        this.defaultValue = this.createValue();
    }

    compare(a, b) {
        return a == b ? 0 : 1;
    }

    validate(value, results) {
        var res = value !== undefined;
        if (!res) results.push(new ValidationResult('value', ['Value is not undefined!']));
        return res;
    }

    static {
        TypeManager.instance.createType(VoidType,{ name:'void', jsType:'object', default:undefined });
    }
}

export { VoidType };
