import { TypeManager, Type, ValidationResult } from './type-manager.mjs'

class MapType extends Type {
    static #definition = { name:'map', jsType:'map', keyType:'string', valueType:'object' };
    keyType = null;
    valueType = null;

    #getKeyValue(obj) {        
        var keyValue = null;
        if (Array.isArray(obj)) {
            keyValue = [source[0], source[1]];
        } else if (typeof source === 'object') {
            keyValue = [source.key, source.value];
        } else {
            throw new TypeError('Cannot read key from this input!');
        }
        return keyValue;
    }

    constructor(definition) {
        definition.baseType = definition.baseType || 'map';
        super(definition);
    }

    async initialize() {
        if (this.definition.keyType) {
            this.keyType = await TypeManager.instance.getType(this.definition.keyType);
        }
        if (this.definition.valueType) {
            this.valueType = await TypeManager.instance.getType(this.definition.valueType);
        }
        
        this.defaultValue = this.createValue();
    }

    validate(source, results) {
        // source can be
        // - array: [[key1, value1], [key2, value2], ...],
        // - map
        results = results || [];
        var isValid = true;
        if (typeof source.entries !== 'function') {
            results.push(new ValidationResult('value', 'Invalid source for map!'));
            isValid = false;
        } else {
            for (var kv of source) {
                this.keyType.validate(kv[0], results);
                this.valueType.validate(kv[1], results);
            }
        }
        return isValid;
    }

    createValue(source, isIndirect) {
        var keyValue = [this.keyType.defaultValue, this.valueType.defaultValue];
        if (source) {
            keyValue = this.getKeyValue(source);
        }
        return new Map([[keyValue[0].valueOf(), keyValue[1].valueOf()]]);
    }

    // MapType.prototype.build = function build(definition, schema, path) {
    //     var type = MapType.base.build.call(this, definition, schema, path);
    //     var keyType = schema.getOrBuildType(type.keyType);
    //     if (keyType) {
    //         type.keyType = keyType;
    //     } else {
    //         schema.addMissingType(type.keyType, t => type.keyType = t, [...path, 'keyType']);
    //     }
    //     var valueType = schema.getOrBuildType(type.valueType);
    //     if (valueType) {
    //         type.valueType = valueType;
    //     } else {
    //         schema.addMissingType(type.valueType, t => type.valueType = t, [...path, 'valueType']);
    //     }
    //     return type;
    // };
    // MapType.prototype.merge = function merge(source, target, flags) {
    //     for (var k in source) {
    //         var hasSource = source && source[k] != undefined && source[k] !== '';
    //         var hasTarget = target && target[k] != undefined && target[k] !== '';
    //         var type = source[k].__type__ || this.valueType;
    //         if (hasSource) {
    //             if (hasTarget) {
    //                 if (flags & self.mergeObjects.OVERWRITE) {
    //                     if (typeof type.merge === 'function') {
    //                         type.merge(source[k], target[k], flags);
    //                     } else {
    //                         target[k] = source[k];
    //                     }
    //                 }
    //             } else {
    //                 if (typeof type.merge === 'function') {
    //                     target[k] = type.createValue(null, null, true);
    //                     type.merge(source[k], target[k], flags);
    //                 } else {
    //                     target[k] = source[k];
    //                 }
    //             }
    //         } else {
    //             if (hasTarget) {
    //                 ;
    //             } else {
    //                 target[k] = type.createValue(type.default, null, true);
    //             }
    //         }
    //     }
    // };

    static {
        TypeManager.instance.createType(MapType, MapType.#definition);
    }
}

export { MapType };