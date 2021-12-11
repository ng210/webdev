include('/lib/type/type.js');
(function() {
    function BoolType(name, type, args) {
        BoolType.base.constructor.call(this, name, type, args);
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

    BoolType.prototype.createValue = function createValue(value) {
        var v = new Boolean(this.createPrimitiveValue(value));
        this.setType(v);
        return v;
    };
    BoolType.prototype.createPrimitiveValue = function createPrimitiveValue(value) {
        return value == undefined ? Math.random() < 0.5 : value;
    };
    BoolType.prototype.createDefaultValue = function createDefaultValue() {
        var v = new Boolean(false);
        this.setType(v);
        return v;
    };
    BoolType.prototype.parse = function parse(term) {
        return term != '' ? BoolType.base.parse.call(this, term) : false;
    };

    publish(BoolType, 'BoolType');
})();