import { Type, gettypeof } from './type.mjs'
import { TypeManager, ValidationResult } from './type-manager.mjs'

class EnumType extends Type {
    static #definition = {
        name:'enum',
        baseType:'string',
        default:'',
        values:['']
    };

    values = Array.from(EnumType.#definition.values);

    constructor(definition) {
        definition.baseType = definition.baseType || 'enum';
        super(definition);
    }

    async initialize() {
        if (Array.isArray(this.definition.values)) {
            for (var vi of this.definition.values) this.values.push(vi.toString());
        }

        try {
            if (this.definition.default !== undefined) this.defaultValue = this.createValue(this.definition.default);
        } catch (err) {
            if (this.values.length > 0) this.defaultValue = this.createValue(this.values[0]);
            else throw err;
        }        
    }

    // static build(definition) {
    //     var type = schema.types[definition.name];
    //     var res = Reflect.construct(type.constructor, [definition]);
    //     return res;
    // }

    compare(a, b) {
        var ia = this.values.indexOf(gettypeof(a) === EnumType ? a.valueOf() : a);
        var ib = this.values.indexOf(gettypeof(b) === EnumType ? b.valueOf() : b);
        if (ia == -1 || ib == -1) {
            throw new TypeError('Operand type is not Enum!');
        }
        return ia - ib;
    }

    // createValue(value) {
    //     if (value === undefined) {
    //         value = this.values[0];
    //     } else {
    //         if (!this.values.includes(value.toString())) {
    //             throw new TypeError(`Value '${value}' to create is not member of enum!`);
    //         }
    //     }

    //     var res = new String(value);
    //     this.setType(res);
    //     return res;
    // }

    // instanceOf(type) {
    //     var res = this;
    //     while (res != null) {
    //         if (res == type) return true;
    //         res = res.baseType;
    //     }
    //     return false;
    // }

    validate(value, results) {
        var isValid = true;
        var messages = [];
        var ix = this.values.findIndex(x => x.localeCompare(value.valueOf()) == 0);
        if (ix == -1) {
            messages.push(`Enum does not contain '${value}'!`);
            isValid = false;
        }
        if (!isValid) {
            var path = null;
            results.push(new ValidationResult(path || [], messages));
        }
        return isValid;
    }

    // addTracking(tracking, type) {
    //     type = type || this;
    //     var result = true;
    //     if (!type.isPrimitive) {
    //         if (tracking[type.name] == undefined) {
    //             tracking[type.name] = 0;
    //         }
    //         if (tracking[type.name] < Type.MAX_RECURSION) {
    //             tracking[type.name]++;
    //         } else {
    //             result = false;
    //         }
    //     }
    //     return result;
    // }

    // removeTracking(tracking, type) {
    //     type = type || this;
    //     if (tracking[type.name] != undefined) {
    //         if (--tracking[type.name] == 0) delete tracking[type.name];
    //     }
    // }

    // static MAX_RECURSION = 3;

    static {
        TypeManager.instance.createType(EnumType, EnumType.#definition);
    }
}

export { EnumType };