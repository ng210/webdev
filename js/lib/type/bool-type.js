include('/lib/type/type.js');
(function() {
    function BoolType(name, type, args) {
        BoolType.base.constructor.call(this, name, type, args);
        if (this.default == null) this.default = false;
    }
    extend(Type, BoolType);

    BoolType.prototype.validate = function validate(value, results, path) {
        var isValid = true;
        var messages = [];
        try {
            var v = Boolean(value);
        } catch (err) {
            messages.push(err.message);
            isValid = false;
        }
        if (!isValid) {
            results.push(new ValidationResult(path || [], messages));
        }
        return isValid;
    };

    BoolType.prototype.createValue = function createValue(value, tracking, isPrimitive) {
        var v = value != undefined ? !!value : false;
        if (!isPrimitive) {
            v = new Boolean(v);
            this.setType(v);
        }
        return v;
    };
    // BoolType.prototype.createPrimitiveValue = function createPrimitiveValue(value) {
    //     return this.createValue(value, null, true);
    // };
    // BoolType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
    //     return this.createValue(false, tracking, isPrimitive);
    // };
    BoolType.prototype.compare = function compare(a, b) {
        var i = a ? 1 : 0;
        var j = b ? 1 : 0;
        return i - j;
    };
    BoolType.prototype.parse = function parse(term) {
        return term != '' ? BoolType.base.parse.call(this, term) : false;
    };

    publish(BoolType, 'BoolType');
})();