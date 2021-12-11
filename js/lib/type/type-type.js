include('/lib/type/type.js');
(function() {
    function TypeType(name, type, args) {
        TypeType.base.constructor.call(this, name, type, args);
        this.values = {};
        if (args) {
            if (args.values) {
                this.values = args.values;
            }
        }
    }
    extend(Type, TypeType);

    TypeType.prototype.createValue = function createValue(value) {
        var type = null;
        if (value) {
            type = typeof value === 'string' ? this.values.get(value) : value;
        } else {
            var ix = Math.floor(Math.random() * this.values.size);
            type = this.values.getAt(ix);
        }
        return type;
    };
    TypeType.prototype.createDefaultValue = function createDefaultValue(tracking) {
        return this.values.getAt(0);
    };
    TypeType.prototype.parse = function parse(term) {
        return term != '' ? TypeType.base.parse.call(this, term) : false;
    };

    TypeType.prototype.validate = function validate(value, results, path) {
        if (this.schema) {
            try {
                var type = this.schema.getOrBuildType(value, path);
            } catch (err) {
                console.log(err);
            }
            if (type == null) {
                results.push(new ValidationResult(path || [], [`Invalid type ${stringify(value)}!`]));
            }
        } else {
            results.push(new ValidationResult(path || [], ['Schema missing!']));
        }
        return results.length == 0;
    };

    publish(TypeType, 'TypeType');
})();