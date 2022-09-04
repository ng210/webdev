include('/lib/type/type.js');
(function() {
    //#region NumberType
    function NumberType(name, type, args) {
        NumberType.base.constructor.call(this, name, type, args);
        this.isNumeric = true;
        this.min = -Number.MAX_SAFE_INTEGER;
        this.max = Number.MAX_SAFE_INTEGER;
        if (args) {
            if (!isNaN(args.min)) this.min = args.min;
            if (!isNaN(args.max)) this.max = args.max;
        }
        if (this.default == null) this.default = 0;
    }
    extend(Type, NumberType);

    NumberType.prototype.compare = function compare(a, b) {
        var r = a - b;
        if (r > 0) r = 1;
        else if (r < 0) r = -1;
        return r;
    };
    NumberType.prototype.validate = function validate(value, results, path) {
        results = results || [];
        var isValid = true;
        var v = value + 0;
        var messages = [];
        if (typeof v !== 'number' || isNaN(v)) {
            messages.push(`'${value}' is not a numeric value!`);
            isValid = false;
        } else {
            if (value < this.min) {
                messages.push(`Value of ${this.name} is less than allowed (${value} < ${this.min})!`);
                isValid = false;
            }
            if (value > this.max) {
                messages.push(`Value of ${this.name} is greater than allowed (${value} > ${this.max})!`);
                isValid = false;
            }
        }
        if (!isValid) {
            results.push(new ValidationResult(path || [], messages));
        }
        return isValid;

    };
    NumberType.prototype.random = function random(min, max) {
        return Math.random()*(max - min) + min;
    };
    // NumberType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
    //     return this.createValue(0, tracking, isPrimitive);
    // };
    //#endregion

    //#region IntType
    function IntType(name, type, args) {
        IntType.base.constructor.call(this, name, type, args);
        this.min = Math.round(this.min);
        this.max = Math.round(this.max);
    }
    extend(NumberType, IntType);

    IntType.prototype.parse = function parse(term) {
        var base = 10;
        if (term.startsWith('0b')) base = 2;
        else if (term.startsWith('0x')) base = 16;
        var value = parseInt(term, base);
        return IntType.base.parse.call(this, value);
    };

    IntType.prototype.validate = function validate(value, results, path) {
        path = path || [];
        var isValid = IntType.base.validate.call(this, value, results, path);
        if (typeof value === 'number') {
            if (Math.trunc(value) != value) {
                if (isValid) {
                    results.push(new ValidationResult(path));
                }
                results.tail().messages.push(`${value} is not an integer value!`);
                isValid = false;
            }
        }
        return isValid;
    };
    IntType.prototype.createValue = function createValue(value, tracking, isPrimitive) {
        var v = value != undefined ? Math.trunc(value) : 0;
        if (!isPrimitive) {
            v = new Number(v);
            this.setType(v);
        }
        return v;
    };
    // IntType.prototype.createPrimitiveValue = function createPrimitiveValue(value) {
    //     return value == undefined ? Math.round(this.random(this.min, this.max)) : value + 0;
    // };
    // IntType.prototype.createDefaultValue = function createDefaultValue(isPrimitive) {
    //     return this.createValue(0, null, isPrimitive);
    // };
    //#endregion

    //#region FloatType
    function FloatType(name, type, args) {
        FloatType.base.constructor.call(this, name, type, args);
    }
    extend(NumberType, FloatType);

    FloatType.prototype.createValue = function createValue(value, tracking, isPrimitive) {
        var v = value != undefined ? value + 0.0 : 0.0;
        if (!isPrimitive) {
            v = new Number(v);
            this.setType(v);
        }
        return v;
    };
    // FloatType.prototype.createPrimitiveValue = function createPrimitiveValue(value) {
    //     return value == undefined ? this.random(this.min, this.max) : value + 0.0;
    // };

    // FloatType.prototype.createDefaultValue = function createDefaultValue() {
    //     var v = new Number(0.0);
    //     this.setType(v);
    //     return v;
    // };
    //#endregion

    publish(NumberType, 'NumberType');
    publish(IntType, 'IntType');
    publish(FloatType, 'FloatType');
})();