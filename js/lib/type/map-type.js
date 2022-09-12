include('/lib/type/type.js');
(function() {
    function MapType(name, type, args) {
        MapType.base.constructor.call(this, name, type, args);
        this.isPrimitive = false;
        this.keyType = null;
        this.valueType = null;
        if (args) {
            if (args.keyType) {
                this.keyType = args.keyType;
            }
            if (args.valueType) {
                this.valueType = args.valueType;
            }
            if (this._default == null) {
                var key = this.keyType._default;
                var value = this.valueType._default;
                this.default = {};
                this.default[key] = value;
            }
        }
    }
    extend(Type, MapType);

    MapType.prototype.validate = function validate(map, results, path) {
        results = results || [];
        path = path || [];
        var isValid = true;
        if (typeof map !== 'object') {
            results.push(`Value '${map}' is not mappable!`);
            isValid = false;
        } else {
            try {
                iterate(map, (key, value) => {
                    if (this.keyType.isNumeric) {
                        if (!isNaN(key)) key = Number(key);
                        else {
                            results.push(new ValidationResult(path, ['Key type should be numeric!']));
                        }
                    }
                    isValid = this.keyType.validate(key, results, [...path, key]) && isValid;
                    isValid = this.valueType.validate(value, results, [...path, key]) && isValid;
                });
            } catch (err) {
                results.push(new ValidationResult(path, [err.message]));
                idValid = false;
            }
        }
        return isValid;
    };

    MapType.prototype.createValue = function createValue(map, tracking, isPrimitive) {
        var value = {};
        tracking = tracking || {};
        if (this.addTracking(tracking, this.keyType) && this.addTracking(tracking, this.valueType)) {
            if (map != null) {
                for (var key in map) {
                    var v = map.constructor == Map ? map.get(key) : map[key];
                    value[this.keyType.createValue(key, tracking, isPrimitive)] = this.valueType.createValue(v, tracking, isPrimitive);
                }
            }
            this.removeTracking(tracking, this.keyType);
            this.removeTracking(tracking, this.valueType);
        }
        if (!isPrimitive) this.setType(value);
        return value;
    };
    MapType.prototype.build = function build(definition, schema, path) {
        var type = MapType.base.build.call(this, definition, schema, path);
        var keyType = schema.getOrBuildType(type.keyType);
        if (keyType) {
            type.keyType = keyType;
        } else {
            schema.addMissingType(type.keyType, t => type.keyType = t, [...path, 'keyType']);
        }
        var valueType = schema.getOrBuildType(type.valueType);
        if (valueType) {
            type.valueType = valueType;
        } else {
            schema.addMissingType(type.valueType, t => type.valueType = t, [...path, 'valueType']);
        }
        return type;
    };
    MapType.prototype.merge = function merge(source, target, flags) {
        for (var k in source) {
            var hasSource = source && source[k] != undefined && source[k] !== '';
            var hasTarget = target && target[k] != undefined && target[k] !== '';
            var type = source[k].__type__ || this.valueType;
            if (hasSource) {
                if (hasTarget) {
                    if (flags & self.mergeObjects.OVERWRITE) {
                        if (typeof type.merge === 'function') {
                            type.merge(source[k], target[k], flags);
                        } else {
                            target[k] = source[k];
                        }
                    }
                } else {
                    if (typeof type.merge === 'function') {
                        target[k] = type.createValue(null, null, true);
                        type.merge(source[k], target[k], flags);
                    } else {
                        target[k] = source[k];
                    }
                }
            } else {
                if (hasTarget) {
                    ;
                } else {
                    target[k] = type.createValue(type.default, null, true);
                }
            }
        }
    };
    publish(MapType, 'MapType');
})();