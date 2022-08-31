include('/lib/type/type.js');
(function() {    
    function EnumType(name, type, args) {
        this.values = [];
        EnumType.base.constructor.call(this, name, type, args);
        if (args && args.values) {
            this.values = args.values;
            if (this.default == null) {
                this.default = this.values[0];
            }
        }
    }
    extend(Type, EnumType);

    EnumType.prototype.validate = function validate(value, results, path) {
        results = results || [];
        var isValid = true;
        var messages = [];
        if (typeof value === 'object') value = value.valueOf();
        var s2 = JSON.stringify(value);
        var ix = this.values.findIndex(x => {
            var s1 = JSON.stringify(x);
            return s1 == s2;
        });
        if (ix == -1) {
            messages.push(`Enum does not contain '${value}'!`);
            isValid = false;
        }
        if (!isValid) {
            results.push(new ValidationResult(path || [], messages));
        }
        return isValid;
    };
    EnumType.prototype.createValue = function createValue(value, tracking, isPrimitive) {
        if (value == undefined) {
            value = this.values[Math.floor(Math.random()*this.values.length)];
        }
        if (!isPrimitive) {
            if (typeof value !== 'object') {
                value = Reflect.construct(value.constructor, [value]);
            }
            this.setType(value);
        }
        return value;
    };
    // EnumType.prototype.createPrimitiveValue = function createPrimitiveValue(value) {
    //     return this.createValue(value, null, true);
    // };
    // EnumType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
    //     return this.createValue(this.values[0], tracking, isPrimitive);
    // };

    publish(EnumType, 'EnumType');
})();