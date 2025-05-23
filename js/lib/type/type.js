const top = typeof self != 'undefined' ? self : global;

class Type {
    definition = null;
    name = '';
    jsType = Object;
    baseType = null;
    defaultValue = null;
    isNumeric = false;
    // isPrimitive = true;
    schema = null;

    constructor(definition) {
        this.name = definition.name;
        this.definition = definition;
    }

    async initialize() {
        this.isNumeric = this.definition.numeric || false;
        this.defaultValue = this.definition.default !== undefined ? this.createValue(this.definition.default.valueOf()) : this.definition.baseType.defaultValue;
    }

    createValue(value, isIndirect) {
        var val = this.baseType ? this.baseType.createValue(value, true) : Reflect.construct(this.jsType, [value]);
        if (!isIndirect) this.setType(val);
        return val;
    }

    instanceOf(type) {
        var res = this;
        while (res != null) {
            if (res == type) return true;
            res = res.baseType;
        }
        return false;
    }

    parseJsonInt(json, path) {
        return this.createValue(JSON.parse(json));
    }

    #objects = new Set();
    parseJson(json, path) {
        var result = JSON.parse(json, (key, value) => {
            if (typeof value === 'object') {
                if (!this.#objects.has(value)) {
                    this.#objects.set(value);
                }
            }
            return value;
        });
        // var value = this.parseJsonInt(json, path);
        // if (value === undefined || !this.validate(value)) {
        //     throw new RangeError(`Parse input not valid! '${value}'`);
        // }
        var value = this.createValue(result);
//console.log(result)
        return value;
    }

    setType(value) {
        if (value.__type__ !== undefined) {
            delete value.__type__;
        }
        Object.defineProperty(value, '__type__', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: this
        });
    }

    validate(value, results, path, visited) {
        return this.baseType ? this.baseType.validate(value, results, path, visited) : true;
    }

    // toString(obj, path, visited) {
    //     const visited = new Map();
    //     return JSON.stringify(obj, (key, value) => {
    //       if (typeof value === 'object' && value !== null) {
    //         if (visited.has(value)) {
    //           return '#' + visited.get(value);
    //         } else {
    //             visited.set(key)
    //         }
    //         seen.add(value);
    //       }
    //       return value;
    //     });
    // }

    // // addTracking(tracking, type) {
    // //     type = type || this;
    // //     var result = true;
    // //     if (!type.isPrimitive) {
    // //         if (tracking[type.name] == undefined) {
    // //             tracking[type.name] = 0;
    // //         }
    // //         if (tracking[type.name] < Type.MAX_RECURSION) {
    // //             tracking[type.name]++;
    // //         } else {
    // //             result = false;
    // //         }
    // //     }
    // //     return result;
    // // }

    // // removeTracking(tracking, type) {
    // //     type = type || this;
    // //     if (tracking[type.name] != undefined) {
    // //         if (--tracking[type.name] == 0) delete tracking[type.name];
    // //     }
    // // }

    // // static MAX_RECURSION = 3;

    // static getType(name) {
    //     var type = Type.#typeList[name];
    //     if (!type) {
    //         type = new Type({ name:name, baseType:'int' });
    //         type.isTemporary = true;
    //     }
    //     return type;
    // }

    // static {
    //     // create default types
    //     new Type({name:'string', baseType:'string', default:''});
    //     new Type({name:'bool', baseType:'string', default:false});
    //     new Type({name:'number', baseType:'number', default:0});
    //     new Type({name:'list', baseType:'list', default:[]});
    // }
}

function gettypeof(value) { return value.__type__ ? value.__type__.constructor : typeof value; }
function gettype(value) { return value.__type__ || typeof value; }

export { Type, gettype, gettypeof };