import { TypeManager, Type, ValidationResult } from './type-manager.mjs'

class ListType extends Type {
    static #definition = {
        name:'list',
        jsType:'list',
        elemType:'object',
        default:[],
        length:0
    };

    elemType = null;
    length = ListType.#definition.length;

    constructor(definition) {
        definition.baseType = definition.baseType || 'list';
        super(definition);
    }

    async initialize() {
        this.defaultValue = [];
        this.elemType = await TypeManager.instance.getType(this.definition.elemType || ListType.#definition.elemType);
    }

    compare(a, b) {
        // a[i] < b[i] -> -i
        // a[i] > b[i] -> i
        // a[i] = b[i] -> 0
        var res = 0;
        if (Array.isArray(a) && Array.isArray(b)) {
            var i = 0;
            for (;i<a.length; i++) {
                if (i == b.length) {
                    res = i;
                    break;
                }
                var cmp = this.elemType.compare(a[i], b[i]);
                if (cmp != 0) {
                    i++;
                    res = cmp < 0 ? -i : i;
                    break;
                }
            }
            if (res == 0 && b.length > a.length) res = -i-1;
        } else throw new TypeError('Operands are not arrays!');
        return res;
    }

    createValue(value, isIndirect) {
        var val = Reflect.construct(this.jsType, []);
        if (typeof value === 'object') {
            var values = typeof value.values === 'function' ? value.values() : Object.values(value);
            for (var vi of values) {
                val.push(this.elemType.createValue(vi));
            }
        }
        if (!isIndirect) this.setType(val);
        return val;
    }

    parseJsonInt(json, path) {
        // \s*[\s*<value1>\s*,\s*<value2>,...\s*]
        var val = [];
        this.elemType.parseJson();
        var val = JSON.parse(json);
        return val;
    }

    // setType(value) {
    //     Object.defineProperty(value, '__type__', {
    //         configurable: false,
    //         enumerable: false,
    //         writable: false,
    //         value: this.constructor
    //     });
    // }

    validate(value, results, path, visited) {
        results = results || [];
        for (var i=0; i<value.length; i++) {
            this.elemType.validate(value[i], results, path, visited);
        }
        return results.length == 0;
    }

    static toString(obj, path, visited) {
        if (path === undefined) {
            visited = new Map();
            path = [];
        }
        var indent = '          '.slice(0, path.length);
        var pt = path.join('.');
        var sb = [`${indent}[`];
        indent = '          '.slice(0, path.length+1);
        for (var key in obj) {
            var pk = pt + key;
            var val = obj[key].valueOf();
            if (!visited.has(pk)) {
                var value = '';
                visited.set(pk, visited.size);
                path.push(key);
                if (Array.isArray(val)) {
                    value = ListType.toString(val, path, visited);
                } else if (typeof val === 'object') {
                    value = ObjectType.toString(val, path, visited);
                } else {
                    if (typeof val === 'string') {
                        value = `'${val}'`;
                    } else {
                        value = val;
                    }
                }
                path.pop();
            } else {
                value = `#${visited.get(pk)}`;
            }
            sb.push(`${indent}${key}: ${value}`);
        }
        sb.push(`${indent}]`);
        return sb.join('\n');
    }

    // addTracking(tracking, type) {
    //     type = type || this;
    //     var result = true;
    //     if (!type.isPrimitive) {
    //         if (tracking[type.name] == undefined) {
    //             tracking[type.name] = 0;
    //         }
    //         if (tracking[type.name] < Type.MAX_RECURSION) {
    //             tracking[type.name]++;
    //         } else {
    //             result = false;
    //         }
    //     }
    //     return result;
    // }

    // removeTracking(tracking, type) {
    //     type = type || this;
    //     if (tracking[type.name] != undefined) {
    //         if (--tracking[type.name] == 0) delete tracking[type.name];
    //     }
    // }

    // static MAX_RECURSION = 3;

    static {
        TypeManager.instance.createType(ListType, ListType.#definition);
    }
}

// class _ListType extends Type {
//     elemType = null;
//     length = 0;
//     static defaultDefinition = {
//         'name': 'enum',
//         'elemType': null,
//         'length': 0
//     };

//     constructor(name, type, args) {
//         super(name, type, args);
//         if (args) {
//             if (args.elemType) {
//                 if (!(args.elemType instanceof Type)) {
//                     throw new Error('Type of list element is invalid!');
//                 }
//                 this.elemType = args.elemType;
//             }
//             if (args.length) {
//                 this.length = args.length;
//             }
//         }
//         if (this.default == null && this.elemType) {
//             this.default = [this.elemType.default];
//         }
//     }

//     validate(values, results, path) {
//         path = path || [];
//         results = results || [];
//         var isValid = true;
//         var messages = [];
//         if (values != null && typeof values.values === 'function') {
//             var it = values.values();
//             var item = null;
//             var count = 0;
//             while (!(item = it.next()).done) {
//                 isValid = this.elemType.validate(item.value, results, [...path, count]) && isValid;
//                 count++;
//                 if (this.length && count > this.length) {
//                     messages.push(`Item count is greater than list length! (${values.length} > ${this.length})`);
//                     isValid = false;
//                     break;
//                 }
//             }
//         } else {
//             messages.push(`Value '${values}' is not iterable!`);
//         }
//         if (messages.length > 0) {
//             results.push(new ValidationResult(path, messages));
//         }
//         return isValid;
//     }

//     createValue(list, tracking, isPrimitive) {
//         var res = [];
//         //if (this.elemType instanceof Type) {
//             tracking = tracking || {};
//             if (this.addTracking(tracking)) {
//                 if (list != undefined) {
//                     for (var i in list) {
//                         res.push(this.elemType.createValue(list[i], tracking, isPrimitive));
//                     }
//                 }
//                 this.removeTracking(tracking);
//             }
//             if (!isPrimitive) this.setType(res);
//         //}
//         return res;
//     }

//     // ListType.prototype.createPrimitiveValue = function createPrimitiveValue(list, tracking) {
//     //     return this.createValue(list, tracking, true);
//     // };
//     // ListType.prototype.createDefaultValue = function createDefaultValue(tracking, isPrimitive) {
//     //     var v = null;
//     //     if (typeof this.ctor === 'function') {
//     //         v = Reflect.construct(this.ctor, []);
//     //     } else {
//     //         v = this.createValue([], tracking, isPrimitive); 
//     //     }
//     //     return v;
//     // }

//     // static build(definition, schema, path) {
//     //     var type = super.build(definition, schema, path);
//     //     var elemType = schema.getOrBuildType(type.elemType);
//     //     if (elemType) {
//     //         type.elemType = elemType;
//     //     } else {
//     //         schema.addMissingType(type.elemType, t => type.elemType = t, [...path, 'elemType']);
//     //         schema.addMissingType(type.elemType, t => type.createDefaultValue(), [...path]);
//     //     }
//     //     return type;
//     // }

//     // merge(source, target, flags) {
//     //     if (!Array.isArray(source)) source = [];
//     //     for (var i in source) {
//     //         var v = source[i];
//     //         var results = [];
//     //         var type = v.__type__ || this.elemType;
//     //         type.validate(v, results);
//     //         if (results.length == 0) {
//     //             if (flags & self.mergeObjects.OVERWRITE) {
//     //                 if (typeof this.elemType.merge === 'function') {
//     //                     if (target[i] == undefined) {
//     //                         target[i] = type.createValue(null, null, true);
//     //                     }
//     //                     type.merge(v, target[i], flags);
//     //                 } else {
//     //                     target[i] = v;
//     //                 }
//     //             } else {
//     //                 target.push(v)
//     //             }
//     //         } else {
//     //             console.warn(`Invalid elem at ${i} (${results.join('|')}), skipped!`);
//     //         }
//     //     }
//     // }
// }

export { ListType }