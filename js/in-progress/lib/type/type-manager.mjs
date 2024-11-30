import { Type } from './type.mjs'
import { ValidationResult } from './validation-result.mjs';
import { poll } from '../base/util.mjs'

class TypeManager {
    static #jsTypeList = {
        'bool': Boolean,
        'number': Number,
        'list': Array,
        'bigint': BigInt,
        'string': String,
        'object': Object,
        'map': Map
    };
    static #instance = null;

    static get instance() {
        if (TypeManager.#instance == null) {
            TypeManager.#instance = new TypeManager();
        }
        return TypeManager.#instance;
    }

    #typeList = new Map();      // name -> type
    #instanceList = new Map();  // name -> value
    #incomplete = [];

    constructor() {
    }

    createType(typeClass, definition) {
        var err = new RangeError('Missing or incomplete definition!');
        if (!definition || !definition.name) throw err;
        const name = definition.name;
        if (this.#typeList.has(name)) throw new TypeError(`Type '${name}' already defined!`);
        var type = Reflect.construct(typeClass, [definition]);
        this.#typeList.set(name, type);
        this.#incomplete.push(this.#initializeType(type));
        return type;
    }

    async #initializeType(type) {
        var baseTypeName = type.definition.baseType;
        type.jsType = TypeManager.#jsTypeList[type.definition.jsType];
        if (type.jsType) {
            type.baseType = null;
        } else {
            type.baseType = this.#typeList.has(baseTypeName) ? this.#typeList.get(baseTypeName) : await this.getType(baseTypeName);
            type.jsType = type.baseType.jsType;
            // get missing definitions from base type
            for (var di in type.baseType.definition) {
                if (type.definition[di] === undefined) type.definition[di] = type.baseType.definition[di];
            }
        }
        // defaultValue = null;
        // isNumeric = false;
        // // isPrimitive = true;
        // schema = null;
        await type.initialize();
    }

    async getType(name) {
        if (name === undefined) throw new Error('itt!');
        if (!this.#typeList.has(name)) {
            var retry = 5;
            await poll(
                function(tm, nm) {
                    if (retry-- == 0) throw new TypeError(`Type '${nm}' not available!`);
                    return tm.#typeList.has(nm);
                }, 50, this, name);
        }
        return this.#typeList.get(name);
    }

    getTypeList() {
        var keys = [];
        for (var k in TypeManager.#jsTypeList) {
            keys.push(k + ' (js type)');
        }

        for (var kv of this.#typeList) {
            keys.push(kv[0]);
        }
        return keys;
    }

    async complete() {
        await Promise.all(this.#incomplete);
        this.#incomplete.length = 0;
    }

    static parseJson(json, type) {
        // if (type) {
        //     value = type.parseJson(json);
        // } else {
        //     // determine the type
            
        // }
        // return value;
    }


    static {
        TypeManager.#instance = new TypeManager();
    }
}

export { TypeManager, Type, ValidationResult };