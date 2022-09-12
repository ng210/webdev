include('/lib/type/type.js');
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
        if (this.default == null && this.elemType) {
            this.default = this.elemType.default;
        }
    }
    extend(Type, ListType);

    ListType.prototype.validate = function validate(values, results, path) {
        path = path || [];
        results = results || [];
        var isValid = true;
        var errors = [];
        if (values != null && typeof values.values === 'function') {
            var it = values.values();
            var item = null;
            var count = 0;
            while (!(item = it.next()).done) {
                isValid = this.elemType.validate(item.value, results, [...path, count]) && isValid;
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

    ListType.prototype.createValue = function createValue(list, tracking, isPrimitive) {
        var res = [];
        if (this.elemType instanceof Type) {
            tracking = tracking || {};
            if (this.addTracking(tracking)) {
                if (list != undefined) {
                    for (var i=0; i<list.length; i++) {
                        res.push(this.elemType.createValue(list[i], tracking, isPrimitive));
                    }
                }
                this.removeTracking(tracking);
            }
            if (!isPrimitive) this.setType(res);
        }
        return res;
    };
    // ListType.prototype.createPrimitiveValue = function createPrimitiveValue(list, tracking) {
    //     return this.createValue(list, tracking, true);
    // };
    // ListType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
    //     var v = null;
    //     if (typeof this.ctor === 'function') {
    //         v = Reflect.construct(this.ctor, []);
    //     } else {
    //         v = this.createValue([], tracking, isPrimitive); 
    //     }
    //     return v;
    // };
    ListType.prototype.build = function build(definition, schema, path) {
        var type = ListType.base.build.call(this, definition, schema, path);
        var elemType = schema.getOrBuildType(type.elemType);
        if (elemType) {
            type.elemType = elemType;
        } else {
            schema.addMissingType(type.elemType, t => type.elemType = t, [...path, 'elemType']);
            schema.addMissingType(type.elemType, t => type.createDefaultValue(), [...path]);
        }
        return type;
    };
    ListType.prototype.merge = function merge(source, target, flags) {
        if (!Array.isArray(source)) source = [];
        for (var i=0; i<source.length; i++) {
            var v = source[i];
            var results = [];
            var type = v.__type__ || this.elemType;
            type.validate(v, results);
            if (results.length == 0) {
                if (flags & self.mergeObjects.OVERWRITE) {
                    if (typeof this.elemType.merge === 'function') {
                        if (target[i] == undefined) {
                            target[i] = type.createValue(null, null, true);
                        }
                        type.merge(v, target[i], flags);
                    } else {
                        target[i] = v;
                    }
                } else {
                    target.push(v)
                }
            } else {
                console.warn(`Invalid elem at ${i}, skipped!`);
            }
        }
    };


    publish(ListType, 'ListType');
})();