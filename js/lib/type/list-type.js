include('./type.js');
(function() {
    function ListType(name, type, args) {
        ListType.base.constructor.call(this, name, type, args);
        this.isPrimitive = false;
        this.elemType = null;
        this.length = 0;
        if (args) {
            if (args.elemType) {
                this.elemType = args.elemType;
            }
            if (args.length) {
                this.length = args.length;
            }
        }
    }
    extend(Type, ListType);

    ListType.prototype.validate = function validate(values, results, path) {
        path = path || [];
        var isValid = true;
        var errors = [];
        if (typeof values.values === 'function') {
            var it = values.values();
            var item = null;
            var count = 0;
            while (!(item = it.next()).done) {
                isValid = isValid && this.elemType.validate(item.value, results, [...path, count]);
                count++;
                if (this.length && count > this.length) {
                    errors.push(`Item count is greater than list length! (${values.length} > ${this.length})`);
                    isValid = false;
                    break;
                }
            }
        } else {
            errors.push(`Value '${values}' is not iterable!`);
        }
        if (errors.length > 0) {
            results.push(new ValidationResult(path, errors));
        }
        return isValid;
    };

    ListType.prototype.createValue = function createValue(list, tracking) {
        var v = [];
        tracking = tracking || {};
        if (this.addTracking(tracking)) {
            if (list != undefined) {
                for (var i=0; i<list.length; i++) {
                    v.push(this.elemType.createValue(list[i], tracking));
                }
            } else {
                for (var i=0; i<5; i++) {
                    v.push(this.elemType.createValue(null, tracking));
                }
            }
            this.removeTracking(tracking);
        }
        this.setType(v);
        return v;
    };
    ListType.prototype.createDefaultValue = function createDefaultValue() {
        return this.createValue([]);
    };
    ListType.prototype.build = function build(definition, schema) {
        var type = ListType.base.build.call(this, definition, schema);
        var elemType = schema.getOrBuildType(type.elemType);
        if (elemType) {
            type.elemType = elemType;
        } else {
            schema.addMissingType(type.elemType, t => type.elemType = t);
        }
        return type;
    };

    publish(ListType, 'ListType');
})();