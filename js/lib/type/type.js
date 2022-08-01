include('/lib/type/validation-result.js');
(function() {
    function Type(name, type, args) {
        this.name = name;
        this.baseType = type;
        this.isNumeric = false;
        this.isPrimitive = true;
        this.schema = args && args.schema ? args.schema : null;
    }
    Object.defineProperties(Type.prototype, {
        "basicType": {
            get: function() {
                var basicType = this;
                while (basicType.baseType != null) basicType = basicType.baseType;
                return basicType;
            }
        }
    });

    Type.prototype.setType = function setType(v) {
        Object.defineProperty(v, '__type__', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: this
        });
    }
    Type.prototype.validate = function validate(value, results, path, isStrict) {
        var isValid = true;
        if (this.baseType != null) {
            isValid = this.baseType.validate.call(this, value, results, path, isStrict);
        }
        return isValid;
    };
    Type.prototype.createValue = function createValue(value, tracking, isPrimitive) {
        throw new Error('Not implemented!');
    };
    Type.prototype.createPrimitiveValue = function createPrimitiveValue(value, tracking) {
        return this.createValue(value, tracking, true);
    };
    Type.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
        throw new Error('Not implemented!');
    };
    Type.prototype.compare = function compare(a, b) {
        return JSON.serialize(a).localeCompare(JSON.serialize(b));
    }
    Type.prototype.parse = function parse(term) {
        var value = this.createValue(JSON.parse(term));
        var results = [];
        this.validate(value, results);
        if (results.length > 0) {
            var message = results.map(r => {
                var path = r.field.length > 0 ? `(${r.field.join('.')})` : '';
                return path + r.messages.join('\n');
            });
            throw new Error(message);
        }
        this.setType(value);
        return value;
    };
    Type.prototype.build = function build(definition, schema, path) {
        var type = Reflect.construct(this.constructor, [definition.name, this, definition]);
        type.schema = schema;
        return type;
    };
    Type.prototype.addTracking = function addTracking(tracking, type) {
        type = type || this;
        var result = true;
        if (!type.isPrimitive) {
            if (tracking[type.name] == undefined) {
                tracking[type.name] = 0;
            }
            if (tracking[type.name] < Type.MAX_RECURSION) {
                tracking[type.name]++;
            } else {
                result = false;
            }
        }
        return result;
    };
    Type.prototype.removeTracking = function removeTracking(tracking, type) {
        type = type || this;
        if (tracking[type.name] != undefined) {
            if (--tracking[type.name] == 0) delete tracking[type.name];
        }
    };

    Type.MAX_RECURSION = 3;

    publish(Type, 'Type');
})();