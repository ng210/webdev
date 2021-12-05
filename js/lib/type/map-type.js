include('./type.js');
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
                for (var [key, value] of map) {
                    //if (this.keyType.isNumeric) key = Number(key);
                    isValid = isValid && this.keyType.validate(key, results, [...path, key]);
                    isValid = isValid && this.valueType.validate(value, results, [...path, key]);
                }
            } catch (err) {
                results.push(new ValidationResult(path, [err.message]));
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
    MapType.prototype.build = function build(definition, schema) {
        var type = MapType.base.build.call(this, definition, schema);
        var keyType = schema.getOrBuildType(type.keyType);
        if (keyType) {
            type.keyType = keyType;
        } else {
            schema.addMissingType(type.keyType, t => type.keyType = t);
        }
        var valueType = schema.getOrBuildType(type.valueType);
        if (valueType) {
            type.valueType = valueType;
        } else {
            schema.addMissingType(type.valueType, t => type.valueType = t);
        }
        return type;
    };

    publish(MapType, 'MapType');
})();