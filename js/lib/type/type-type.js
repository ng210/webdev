include('/lib/type/type.js');
(function() {
    function TypeType(name, type, args) {
        TypeType.base.constructor.call(this, name, type, args);
        this.values = null;
        if (args) {
            if (args.values) {
                this.values = args.values;
            }
        }

        if (this.default == null && this.schema) {
            this.default = clone(this.schema.types.get('object'));
        }
    }
    extend(Type, TypeType);

    TypeType.prototype.createValue = function createValue(value, tracking, isPrimitive) {
        var type = null;
        if (this.schema) {
            value = value || 'string';
            var typeName = value instanceof Type ? value.name : value.toString();
            type = clone(this.schema.typeList.find(t => t.name == typeName));
        }
        return type;
    };
    // TypeType.prototype.createPrimitiveValue = function createPrimitiveValue(obj, tracking) {
    //     return obj ? this.createValue(obj, tracking) : this.createDefaultValue(tracking);
    // };
    // TypeType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
    //     return clone(this.schema.typeList[0]);
    // };
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