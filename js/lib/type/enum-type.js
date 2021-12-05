include('./type.js');
(function() {    
    function EnumType(name, type, args) {
        EnumType.base.constructor.call(this, name, type, args);
        this.values = [];
        if (args) {
            if (args.values) {
                this.values = args.values;
            }
        }
    }
    extend(Type, EnumType);

    EnumType.prototype.validate = function validate(value, results, path) {
        var isValid = true;
        var messages = [];
        if (typeof value === 'object') value = value.valueOf();
        var ix = this.values.findIndex(x => {
            var s1 = JSON.stringify(x);
            var s2 = JSON.stringify(value)
            console.log(s1, s2, s1 == s2);
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
    EnumType.prototype.createValue = function createValue(value) {
        var v0 = value == undefined ? this.values[Math.floor(Math.random()*this.values.length)] : value;
        var result = typeof v0 !== 'object' ? Reflect.construct(v0.constructor, [v0]) : v0;
        this.setType(result);
        return result;
    };
    EnumType.prototype.createDefaultValue = function createDefaultValue() {
        return this.createValue(this.values[0]);
    };

    publish(EnumType, 'EnumType');
})();