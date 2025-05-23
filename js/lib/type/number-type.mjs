import { TypeManager, Type, ValidationResult } from './type-manager.mjs'

class NumberType extends Type {
    static #definition = {
        name:'number',
        jsType:'number',
        default:0,
        min:-Number.MAX_VALUE,
        max:Number.MAX_VALUE,
        digits:4
    };

    min = NumberType.#definition.min;
    max = NumberType.#definition.max;
    digits = NumberType.#definition.digits;

    constructor(definition) {
        definition.baseType = definition.baseType || 'number';
        definition.isNumeric = true;
        super(definition);
    }

    async initialize() {
        if (!isNaN(this.definition.min)) this.min = this.definition.min;
        if (!isNaN(this.definition.max)) this.max = this.definition.max;
        if (!isNaN(this.definition.digits)) this.digits = this.definition.digits;
        this.defaultValue = this.createValue(!isNaN(this.definition.digits) ? this.definition.default : NumberType.#definition.default);
    }

    compare(a, b) {
        return a.valueOf() - b.valueOf();
    }

    validate(value, results, path, visited) {
        var isValid = true;
        results = results || [];
        var v = value.valueOf();
        var res = new ValidationResult('value');
        if (typeof v !== 'number' || isNaN(v)) {
            res.messages.push(`'${value}' is not a numeric value!`);
            isValid = false;
        } else {
            if (value < this.min) {
                res.messages.push(`Value ${value} is less than allowed (${this.min})!`);
                isValid = false;
            }
            if (value > this.max) {
                res.messages.push(`Value ${value} is greater than allowed (${this.max})!`);
                isValid = false;
            }
        }

        return isValid;
    }

    toString(obj, path, visited) {
        return obj.toFixed(this.digits);
    }

    // NumberType.prototype.random = function random(min, max) {
    //     return Math.random()*(max - min) + min;
    // };


    static {
        TypeManager.instance.createType(NumberType, NumberType.#definition );
    }
}

class IntType extends NumberType {
    static #definition = {
        name:'int',
        jsType:'number',
        default:0,
        min:-Number.MAX_SAFE_INTEGER,
        max:Number.MAX_SAFE_INTEGER,
        digits:0
    };

    constructor(definition) {
        var err = new RangeError('Missing or incomplete definition!');
        if (!definition) throw err;
        super(definition);
        this.min = Math.trunc(this.min);
        this.max = Math.trunc(this.max);
    }

    static parseInt(value, radix) {

        var num = NaN;
        radix = radix || 10;
        var c0 = '0'.charCodeAt(0);
        var c9 = '9'.charCodeAt(0);
        var ca = 'a'.charCodeAt(0);
        if (typeof value === 'string') {
            num = 0;
            value = value.toLowerCase();
            for (var i=0; i<value.length; i++) {
                var c = value.charCodeAt(i);
                var d = radix;
                if (c >= c0 && c <= c9) d = c - c0;
                else if (c >= ca) d = c - ca + 10;
                if (d >= radix) {
                    throw new RangeError(`Input contains invalid character '${value.charAt(i)}'!`);
                }
                num = num * radix + d;
            }
        } else throw new TypeError('Input is not a string!');
        return num;
    }

    createValue(value, isIndirect) {
        return super.createValue(Math.trunc(value), isIndirect);
    }

    parseJsonInt(json, path) {
        var value;
        if (typeof json === 'string' && json.length > 0) {
            var radix = 10;
            var start = 0;
            if (json.startsWith('0x')) { start = 2; radix = 16; }
            else if (json.startsWith('0b')) { start = 2; radix = 2; }
            value = IntType.parseInt(json.substring(start), radix);
        }
        return isNaN(value) ? undefined : value;
    }

    validate(value, results, path, visited) {
        results = results || [];
        var isValid = super.validate(value, results);
        if (Math.trunc(value) != value) {
            if (isValid) {
                results.push(new ValidationResult('value'));
            }
            results[results.length - 1].messages.push(`${value} is not an integer value!`);
            isValid = false;
        }
        return isValid;
    }

    static {
        TypeManager.instance.createType(IntType, { name:'int', baseType:'number' });
        TypeManager.instance.createType(IntType, { name:'int8', baseType:'int', min:-128, max:127 });
        TypeManager.instance.createType(IntType, { name:'int16', baseType:'int', min:-32768, max:32767 });
        TypeManager.instance.createType(IntType, { name:'int32', baseType:'int', min:-2147483648, max:2147483648 });
        TypeManager.instance.createType(IntType, { name:'uint8', baseType:'int8', min:0, max:255 });
        TypeManager.instance.createType(IntType, { name:'uint16', baseType:'int16', min:0, max:65535 });
        TypeManager.instance.createType(IntType, { name:'uint32', baseType:'int32', min:0, max:4294967295 });
        TypeManager.instance.createType(IntType, { name:'byte', baseType:'uint8' });
        TypeManager.instance.createType(IntType, { name:'word', baseType:'uint16' });
        TypeManager.instance.createType(IntType, { name:'dword', baseType:'uint32' });
        TypeManager.instance.complete();
    }
}

export { NumberType, IntType };
