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
        }
    }
    extend(Type, MapType);

    MapType.prototype.validate = function validate(map, results, path) {
        path = path || [];
        var isValid = true;
        if (typeof map !== 'object') {
            results.push(`Value '${map}' is not mappable!`);
            isValid = false;
        } else {
            try {
                iterate(map, (key, value) => {
                    isValid = isValid && this.keyType.validate(key, results, [...path, key]);
                    isValid = isValid && this.valueType.validate(value, results, [...path, key]);
                });
            } catch (err) {
                results.push(new ValidationResult(path, [err.message]));
                idValid = false;
            }
        }
        return isValid;
    };

    MapType.prototype.createValue = function createValue(map, tracking) {
        var value = new Map();
        tracking = tracking || {};
        if (this.addTracking(tracking, this.keyType) && 
            this.addTracking(tracking, this.valueType)) {
            if (map == undefined) {
                for (var i=0; i<5; i++) {
                    var key = null;
                    do {
                        key = this.keyType.createValue(undefined, tracking);
                    } while (value.has(key.valueOf()));
                    value.set(key, this.valueType.createValue(undefined, tracking));
                }
            } else {
                for (var key in map) {
                    var v = map.constructor == Map ? map.get(key) : map[key];
                    value.set(this.keyType.createValue(key, tracking), this.valueType.createValue(v, tracking));
                }
            }
            this.removeTracking(tracking, this.keyType);
            this.removeTracking(tracking, this.valueType);
        }
        this.setType(value);
        return value;
    };
    MapType.prototype.createPrimitiveValue = function createPrimitiveValue(map, tracking) {
        var value = {};
        tracking = tracking || {};
        if (this.addTracking(tracking, this.keyType) && 
            this.addTracking(tracking, this.valueType)) {
            if (map == undefined) {
                for (var i=0; i<5; i++) {
                    var key = null;
                    do {
                        key = this.keyType.createPrimitiveValue(undefined, tracking);
                    } while (value.has(key));
                    value.set(key, this.valueType.createPrimitiveValue(undefined, tracking));
                }
            } else {
                for (var key in map) {
                    var v = map.constructor == Map ? map.get(key) : map[key];
                    value[this.keyType.createPrimitiveValue(key, tracking)] = this.valueType.createPrimitiveValue(v, tracking);
                }
            }
            this.removeTracking(tracking, this.keyType);
            this.removeTracking(tracking, this.valueType);
        }
        return value;
    };

    MapType.prototype.createDefaultValue = function createDefaultValue(tracking) {
        var map = {};
        tracking = tracking || {};
        if (this.updateTracking(tracking, this.keyType) && 
            this.updateTracking(tracking, this.valueType)) {
            var key = this.keyType.createDefaultValue(tracking);
            var value = this.valueType.createDefaultValue(tracking);
            map[key] = value;
            this.removeTracking(tracking, this.keyType);
            this.removeTracking(tracking, this.valueType);
        }
        this.setType(map);
        return map;
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

    publish(MapType, 'MapType');
})();