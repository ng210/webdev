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
                    this.addAttribute(i, args.attributes[i].type, args.attributes[i].isRequired);
                }
            }
            if (args.ref && this.attributes.has(args.ref)) this.ref = args.ref;
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
    ObjectType.prototype.addAttribute = function addAttribute(name, type, isRequired) {
        var result = this.hasAttribute(name);
        if (!result) {
            this.attributes.set(name, { 'name': name, 'type': type, 'isRequired': isRequired == undefined ? true : isRequired });
        }
        return !result;
    };
    ObjectType.prototype.validate = function validate(value, results, path, isStrict) {
        path = path || [];
        var isValid = true;
        var errors = [];
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
        var v = {};
        var results = [];
        tracking = tracking || {};
        if (this.addTracking(tracking)) {
            if (obj) {
                this.attributes.iterate( (key, value) => {
                    if (obj[key] !== undefined) {
                        v[key] = value.type.createValue(obj[key], tracking, isPrimitive);
                    }
                });
            } else {
                this.attributes.iterate( (key, value) => { v[key] = value.type.createValue(null, tracking, isPrimitive); });
            }
        }
        if (!isPrimitive) this.setType(v);
        return v;
    };
    // ObjectType.prototype.createPrimitiveValue = function createPrimitiveValue(obj, tracking) {
    //     var v = {};
    //     var results = [];
    //     tracking = tracking || {};
    //     if (this.addTracking(tracking)) {
    //         if (obj) {
    //             this.checkAttributes(
    //                 (key, at) => {
    //                     if (obj[key] !== undefined) {
    //                         v[key] = at.type.createPrimitiveValue(obj[key]);
    //                     }
    //                 },
    //                 results
    //             );
    //         } else {
    //             this.checkAttributes( (key, at) => {
    //                 v[key] = at.type.createPrimitiveValue(undefined, tracking);
    //             }, results);
    //         }
    //         this.removeTracking(tracking);
    //     }
    //     return v;
    // };
    ObjectType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
        var v = null;
        if (typeof this.ctor === 'function') {
            v = Reflect.construct(this.ctor, []);
        } else {
            v = {};
            this.attributes.iterate( (key, value) => {
                v[key] = value.type.createDefaultValue(tracking, isPrimitive);
            });
        }
        if (!isPrimitive) this.setType(v);
        return v;
    };
    ObjectType.prototype.build = function build(definition, schema, path) {
        path = path || [];
        var type = ObjectType.base.build.call(this, definition, schema, path);
        schema.addType(type);
        type.attributes.iterate( (name, value) => {
            if (!(value.type instanceof Type)) {
                var attributeType = schema.getOrBuildType(value.type);
                if (attributeType) {
                    value.type = attributeType;
                } else {
                    schema.addMissingType(value.type, t => value.type = t, [...path, name]);
                }
            }
        });
        return type;
    };
    ObjectType.prototype.merge = function merge(source, target, flags) {
        var type = source.__type__;
        if (!type && this.schema) {
            type = this.schema.types.get(source.type);
        }
        if (!type) {
            type = this;
        }

        type.attributes.iterate((k, v) => {
            if (source[k] != undefined && (target[k] == undefined || (flags & self.mergeObjects.OVERWRITE))) {
                if (typeof v.type.merge === 'function') {
                    if (target[k] == undefined) {
debugger
                        target[k] = v.type.createDefaultValue(null, true);
                    }
                    v.type.merge(source[k], target[k], flags);
                } else {
                    target[k] = source[k];
                }
            }
        });
    };
    publish(ObjectType, 'ObjectType');
})();