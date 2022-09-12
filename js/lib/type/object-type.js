include('/lib/type/type.js');
include('/lib/data/dictionary.js');
(function() {
    function ObjectType(name, type, args) {
        ObjectType.base.constructor.call(this, name, type, args);
        this.isPrimitive = false;
        this.attributes = new Dictionary();
        this.ref = null;
        if (type) {
            // inherit base attributes
            var parentType = type;
            while (parentType) {
                parentType.attributes.iterate( (k, v) => this.attributes.set(k, v));
                this.ref = this.ref || parentType.ref;
                parentType = parentType.baseType;
            }
        }
        if (args) {
            if (args.attributes) {
                for (var i in args.attributes) {
                    this.addAttribute(i, args.attributes[i]);
                }
            }
            if (args.ref && this.attributes.has(args.ref)) this.ref = args.ref;
        }
        if (this._default == null) {
            var v = null;
            if (typeof this.ctor === 'function') {
                v = Reflect.construct(this.ctor, []);
            } else {
                v = {};
                type = this;
                this.attributes.iterate( (key, value) => {
                    v[key] = value.default;
                    if (v[key] == undefined) v[key] = value.type.default;
                });
            }
            this.default = v;
        }
    }
    extend(Type, ObjectType);

    ObjectType.prototype.checkAttributes = function checkAttributes(action, results) {
        var result = false;
        this.attributes.iterate(
            (name, value) => {
                var ret = false;
                if (action(name, value)) {
                    result = true;
                    if (results) results.push([name, value]);
                    else ret = true;;
                }
                return ret;
            }
        );

        if (this.baseType instanceof ObjectType) {
            result = this.baseType.checkAttributes(action, results);
        }
        return result;
    };
    ObjectType.prototype.getAttribute = function getAttribute(name) {
        var results = [];
        this.checkAttributes(attrName => attrName == name, results);
        return results.length > 0 ? results[0] : null;
    };
    ObjectType.prototype.hasAttribute = function hasAttribute(name) {
        return this.checkAttributes(attrName => attrName == name);
    };
    ObjectType.prototype.addAttribute = function addAttribute(name, args) {
        var result = this.hasAttribute(name);
        if (!result) {
            this.attributes.set(name, {
                'default': args.default,
                'name': name,
                'type': args.type,
                'isRequired': args.isRequired == undefined ? true : Boolean(args.isRequired)
            });
        }
        return !result;
    };
    ObjectType.prototype.validate = function validate(value, results, path, isStrict) {
        results = results || [];
        path = path || [];
        var isValid = true;
        var errors = [];
        if (value != null && typeof value === 'object') {
            var keys = Object.keys(value);
            this.checkAttributes(
                (key, at) => {
                    if (value[key] != undefined) {
                        isValid = at.type.validate(value[key], results, [...path, key]) && isValid;
                        var ix = keys.findIndex(x => x == key);
                        keys.splice(ix, 1);
                    } else if (at.isRequired) {
                        errors.push(`Required attribute '${key}' is missing!`);
                    }
                },
                results
            );
            if (isStrict) {
                errors.push(...keys.map( v => `Type '${this.name}' does not define attribute '${v}'!`));
            }
        } else {
            errors.push('Value is null or not object!');
        }

        if (errors.length > 0) {
            results.push(new ValidationResult(path, errors));
        } else {
            if (this.schema) {
                this.schema.addInstance(value, null, this);
            }
        }
        return isValid;
    };
    ObjectType.prototype.createValue = function createValue(obj, tracking, isPrimitive) {
        var res = {};
        tracking = tracking || {};
        var schema = this.schema;
        if (this.addTracking(tracking)) {
            this.attributes.iterate( (key, value) => {
                var v;
                if (obj) v = obj[key];
                if (value.type instanceof Type) {
                    res[key] = value.type.createValue(v, tracking, isPrimitive);
                } else {
                    schema.addMissingType(value.type, t => res[key] = t.createValue(v, tracking, isPrimitive), [key]);
                }
            });
        }
        if (!isPrimitive) this.setType(res);
        return res;
    };
    ObjectType.prototype.build = function build(definition, schema, path) {
        path = path || [];
        var type = ObjectType.base.build.call(this, definition, schema, path);
        schema.addType(type);
        type.attributes.iterate( (name, value) => {
            // check for any missing attribute types
            if (!(value.type instanceof Type)) {
                var attributeType = schema.getOrBuildType(value.type);
                if (attributeType) {
                    value.type = attributeType;
                    if (value.default == undefined) value.default = attributeType.default;
                } else {
                    schema.addMissingType(value.type, t => value.type = t, [...path, name]);
                }
            }
        });
        // update default
        type.default = type.createDefaultValue(null, true);
        return type;
    };
    ObjectType.prototype.merge = function merge(source, target, flags) {
        var type = this;
        if (source && source.__type__) type = source.__type__;
        type.attributes.iterate((k, v) => {
            var hasSource = source && source[k] != undefined && source[k] !== '';
            var hasTarget = target && target[k] != undefined && target[k] !== '';
            if (hasSource) {
                // s t o d  r
                // 1 1 1 x  s  2
                // 1 1 0 x  t  2
                if (hasTarget) {
                    if (flags & self.mergeObjects.OVERWRITE) {
                        if (typeof v.type.merge === 'function') {
                            v.type.merge(source[k], target[k], flags);
                        } else {
                            target[k] = source[k];
                        }
                    }
                } else {
                // s t o d  r
                // 1 0 x x  s  4
                    if (typeof v.type.merge === 'function') {
                        target[k] = v.type.createValue(null, null, true);
                        v.type.merge(source[k], target[k], flags);
                    } else {
                        target[k] = source[k];
                    }
                }
            } else {
                if (hasTarget) {
                // s t o d  r
                // 0 1 x x  t  4
                    ;
                } else //if (flags & self.mergeObjects.DEFAULT)
                {
                    // s t o d  r
                    // 0 0 x 1  d
                    target[k] = v.type.createValue(v.default, null, true);
                }
            }
        });
    };
    publish(ObjectType, 'ObjectType');
})();