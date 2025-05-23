import { TypeManager, Type, ValidationResult } from './type-manager.mjs'

class Attribute {
    name = '';
    type = null;
    isRequired = false;

    static async create(name, type, isRequired) {
        var attr = new Attribute();
        attr.name = name;
        attr.type = await TypeManager.instance.getType(type);
        attr.isRequired = isRequired;
        return attr;
    }
}

class ObjectType extends Type {
    static #definition = { name:'object', jsType:'object', attributes:[] };

    attributes = new Map();
    ref = null;

    constructor(definition) {
        definition.baseType = definition.baseType || 'object';
        super(definition);

        // if (this._default == null) {
        //     var v = null;
        //     if (typeof this.ctor === 'function') {
        //         v = Reflect.construct(this.ctor, []);
        //     } else {
        //         v = {};
        //         type = this;
        //         this.attributes.iterate( (key, value) => {
        //             v[key] = value.default;
        //             if (v[key] == undefined) v[key] = value.type.default;
        //         });
        //     }
        //     this.default = v;
        // }
    }

    async initialize() {
        if (this.definition.attributes) {
            for (var name in this.definition.attributes) {
                var attrDef = this.definition.attributes[name];
                var attr = await Attribute.create(name, attrDef.type || 'string', attrDef.required || false);
                this.addAttribute(attr);
            }
        }
        if (this.definition.ref && this.attributes.has(this.definition.ref)) this.ref = this.attributes.get(this.definition.ref);
        this.defaultValue = this.createValue();
    }

    addAttribute(attr) {
        if (!this.hasAttribute(attr.name)) {
            this.attributes.set(attr.name, attr);
        } else throw new TypeError(`Duplicate attribute '${attr.name}'!`);
    }

    getAttribute(name) {
        this.attributes.has(name) ? this.attributes.get(name) : null;
    }

    hasAttribute(name) {
        return this.attributes.has(name);
    }

    createValue(source, isIndirect, path) {
        // Create a new object
        // - use the type description as blueprint
        // - create subobject and subarrays recursively
        // - copy primitive values from value if possible
        // - default values are used for missing values
        // - type mismatch of received and expected values throws an error
        path = path || [];
        if (source) {
            if (typeof source !== 'object') throw new TypeError('Source is not an object!');
        } else source = {};
        // create object or instantiate class or call ctor function
        var obj = {};
        if (typeof globalThis[this.name] === 'function') {
            obj = Reflect.construct(globalThis[this.name], []);
        }
        
        for (var kv of this.attributes) {
            var name = kv[0]
            var attr = kv[1];
            var value = source[name];
            if (value === undefined) value = attr.type.defaultValue;
            try {
                path.push(name);
                obj[name] = attr.type.createValue(value, false, path);
                path.pop();
            } catch (err) {
                var ref = this.ref ? source[this.ref.name] : 'obj';
                var msg = `${err.message} at [#${ref}.${path.join('.')}]`;
                throw new TypeError(msg);
            }
        }

        if (!isIndirect) {
            this.setType(obj);
            this.validateAndThrow(obj);
        }

        return obj;
    }

    parseValue(json) {
        var obj = JSON.parse(json);
    }

    validate(obj, results, path, visited) {
        path = path || [];
        visited = visited || new Map();
        var pt = path.join('.');
        for (var kv of this.attributes) {
            var pk = pt + '.' + kv[0];
            if (!visited.has(pk)) {
                path.push(kv[0]);
                kv[1].type.validate(obj[kv[0]], results, path, visited);
                visited.set(obj[kv[0]], pk);
                path.pop();
            }
        }
    }

    toString(obj, path, visited) {
        path = path || [];
        visited = visited || new Map();
        var indent = '';
        var pt = path.join('.');
        var txt = Array.isArray(obj) ? `${indent}[\n` : `${indent}{\n`;
        var sb = [];
        var indent = '          '.slice(0, path.length);
        var indent2 = '          '.slice(0, path.length+1);
        if (!Array.isArray(obj)) visited.set(obj, pt);
        for (var key in obj) {
            var pk = pt + '.' + key;
            var val = obj[key].valueOf();
            if (!visited.has(val)) {
                var value = '';
                path.push(key);
                if (typeof val === 'object') {
                    if (!Array.isArray(val)) visited.set(val, pk);
                    value = toString(val, path, visited);
                } else {
                    if (typeof val === 'string') {
                        value = `'${val}'`;
                    } else {
                        value = val;
                    }
                }
                path.pop();
            } else {
                value = `#[${visited.get(val)}]`;
            }
            sb.push(`${indent2}${key}: ${value}`);
        }
        txt += sb.join(',\n') + '\n';
        txt += Array.isArray(obj) ? [`${indent}]`] : [`${indent}}`];
        return txt;
    }

    // static merge(source, target, flags) {

    // }

    static {
        TypeManager.instance.createType(ObjectType, ObjectType.#definition);
    }
}

const Null = new ObjectType({ name:'null' });

export { Attribute, ObjectType, Null }

    // // ObjectType.prototype.checkAttributes = function checkAttributes(action, results) {
    // //     var result = false;
    // //     this.attributes.iterate(
    // //         (name, value) => {
    // //             var ret = false;
    // //             if (action(name, value)) {
    // //                 result = true;
    // //                 if (results) results.push([name, value]);
    // //                 else ret = true;;
    // //             }
    // //             return ret;
    // //         }
    // //     );

    // //     if (this.baseType instanceof ObjectType) {
    // //         result = this.baseType.checkAttributes(action, results);
    // //     }
    // //     return result;
    // // };
    // // ObjectType.prototype.getAttribute = function getAttribute(name) {
    // //     var results = [];
    // //     this.checkAttributes(attrName => attrName == name, results);
    // //     return results.length > 0 ? results[0] : null;
    // // };
    // // ObjectType.prototype.hasAttribute = function hasAttribute(name) {
    // //     return this.checkAttributes(attrName => attrName == name);
    // // };
    // // ObjectType.prototype.addAttribute = function addAttribute(name, args) {
    // //     var result = this.hasAttribute(name);
    // //     if (!result) {
    // //         this.attributes.set(name, {
    // //             'default': args.default,
    // //             'name': name,
    // //             'type': args.type,
    // //             'isRequired': args.isRequired == undefined ? true : Boolean(args.isRequired)
    // //         });
    // //     }
    // //     return !result;
    // // };
    // ObjectType.prototype.validate = function validate(value, results, path, isStrict) {
    //     results = results || [];
    //     path = path || [];
    //     var isValid = true;
    //     var errors = [];
    //     if (value != null && typeof value === 'object') {
    //         var keys = Object.keys(value);
    //         this.checkAttributes(
    //             (key, at) => {
    //                 if (value[key] != undefined) {
    //                     isValid = at.type.validate(value[key], results, [...path, key]) && isValid;
    //                     var ix = keys.findIndex(x => x == key);
    //                     keys.splice(ix, 1);
    //                 } else if (at.isRequired) {
    //                     errors.push(`Required attribute '${key}' is missing!`);
    //                 }
    //             },
    //             results
    //         );
    //         if (isStrict) {
    //             errors.push(...keys.map( v => `Type '${this.name}' does not define attribute '${v}'!`));
    //         }
    //     } else {
    //         errors.push('Value is null or not object!');
    //     }

    //     if (errors.length > 0) {
    //         results.push(new ValidationResult(path, errors));
    //     } else {
    //         if (this.schema) {
    //             this.schema.addInstance(value, null, this);
    //         }
    //     }
    //     return isValid;
    // };
    // ObjectType.prototype.createValue = function createValue(obj, tracking, isPrimitive) {
    //     var res = {};
    //     tracking = tracking || {};
    //     var schema = this.schema;
    //     if (this.addTracking(tracking)) {
    //         this.attributes.iterate( (key, value) => {
    //             var v;
    //             if (obj) v = obj[key];
    //             if (value.type instanceof Type) {
    //                 res[key] = value.type.createValue(v, tracking, isPrimitive);
    //             } else {
    //                 schema.addMissingType(value.type, t => res[key] = t.createValue(v, tracking, isPrimitive), [key]);
    //             }
    //         });
    //     }
    //     if (!isPrimitive) this.setType(res);
    //     return res;
    // };
    // ObjectType.prototype.build = function build(definition, schema, path) {
    //     path = path || [];
    //     var type = ObjectType.base.build.call(this, definition, schema, path);
    //     schema.addType(type);
    //     type.attributes.iterate( (name, value) => {
    //         // check for any missing attribute types
    //         if (!(value.type instanceof Type)) {
    //             var attributeType = schema.getOrBuildType(value.type);
    //             if (attributeType) {
    //                 value.type = attributeType;
    //                 if (value.default == undefined) value.default = attributeType.default;
    //             } else {
    //                 schema.addMissingType(value.type, t => value.type = t, [...path, name]);
    //             }
    //         }
    //     });
    //     // update default
    //     type.default = type.createDefaultValue(null, true);
    //     return type;
    // };
    // ObjectType.prototype.merge = function merge(source, target, flags) {
    //     var type = this;
    //     if (source && source.__type__) type = source.__type__;
    //     type.attributes.iterate((k, v) => {
    //         var hasSource = source && source[k] != undefined && source[k] !== '';
    //         var hasTarget = target && target[k] != undefined && target[k] !== '';
    //         if (hasSource) {
    //             // s t o d  r
    //             // 1 1 1 x  s  2
    //             // 1 1 0 x  t  2
    //             if (hasTarget) {
    //                 if (flags & self.mergeObjects.OVERWRITE) {
    //                     if (typeof v.type.merge === 'function') {
    //                         v.type.merge(source[k], target[k], flags);
    //                     } else {
    //                         target[k] = source[k];
    //                     }
    //                 }
    //             } else {
    //             // s t o d  r
    //             // 1 0 x x  s  4
    //                 if (typeof v.type.merge === 'function') {
    //                     target[k] = v.type.createValue(null, null, true);
    //                     v.type.merge(source[k], target[k], flags);
    //                 } else {
    //                     target[k] = source[k];
    //                 }
    //             }
    //         } else {
    //             if (hasTarget) {
    //             // s t o d  r
    //             // 0 1 x x  t  4
    //                 ;
    //             } else //if (flags & self.mergeObjects.DEFAULT)
    //             {
    //                 // s t o d  r
    //                 // 0 0 x 1  d
    //                 target[k] = v.type.createValue(v.default, null, true);
    //             }
    //         }
    //     });
    // };
    // publish(ObjectType, 'ObjectType');
