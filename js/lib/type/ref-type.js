include('/lib/type/type.js');
(function() {
    function RefType(name, type, args) {
        RefType.base.constructor.call(this, name, type, args);
        this.isNumeric = type.getAttribute(type.ref)[1].type.isNumeric;
    }
    extend(Type, RefType);

    RefType.prototype.validate = function validate(value, results, path) {
        var isValid = false;
        var messages = [];
        if (this.schema) {
            if (this.schema.getInstance(value, this.baseType)) {
                isValid = true;
            } else {
                messages.push(`Instance with reference '${value}' of type '${this.baseType.name}' not found!`);
            }
        } else {
            messages.push('Ref type has no associated schema!');
        }
        if (!isValid) {
            results.push(new ValidationResult(path || [], messages));
        }
        return isValid;
    };

    RefType.prototype.createValue = function createValue(value, tracking) {
        var ref = value;
        if (value === undefined) {
            var v = this.baseType.createValue(value, tracking);
            ref = v[this.baseType.ref];
        }
        return ref;
    };
    RefType.prototype.createPrimitiveValue = function createPrimitiveValue(value, tracking) {
        var ref = value;
        if (value === undefined) {
            var v = this.baseType.createPrimitiveValue(value, tracking);
            ref = v[this.baseType.ref];
        }
        return ref;
    };
    RefType.prototype.createDefaultValue = function createDefaultValue(tracking) {
        var v = this.baseType.createDefaultValue(tracking);
        return v[this.baseType.ref];
    };

    publish(RefType, 'RefType');
})();