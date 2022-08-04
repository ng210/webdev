include('/lib/type/type-lib.js');
include('/lib/data/dictionary.js');
(function() {
    function Schema() {
        this.types = new Dictionary();
        this.typeList = [];
        this.instances = new Dictionary();
        this.missingTypes = {};
        //this.addType(new TypeType('type', null, { 'values': this.types }));
    }
    Schema.prototype.addType = function addType(type) {
        if (!this.types.has(type.name)) {
            this.types.set(type.name, type);
            this.typeList.push(type);
            type.schema = this;
        }        
    };
    Schema.prototype.addTypes = function addTypes(types) {
        for (var i=0; i<types.length; i++) {
            this.addType(types[i]);
        }
    };
    Schema.prototype.addInstance = function addInstance(instance, ref, type) {
        if (!type) {
            type = instance.__type__ || this.types.get(instance.contructor.name);
        }
        if (!this.instances.has(type.name)) this.instances.set(type.name, {});
        if (ref == undefined) {
            ref = type.ref != undefined ? instance[type.ref] : null;
        }
        if (ref != undefined) {
            this.instances.get(type.name)[ref] = instance;
        }
    };
    Schema.prototype.getInstance = function getInstance(ref, type) {
        var instance = null;
        if (type && this.instances.has(type.name)) {
            instance = this.instances.get(type.name)[ref];
        } else {
            this.instances.iterate( (k,v) => {
                return (instance = v[ref]) != null;
            });
        }
        return instance;
    };
    Schema.prototype.addDefaultTypes = function addDefaultTypes() {
        this.addTypes(Schema.defaultTypes);
        this.types.get('type').values = this.typeList;
        this.types.get('typeName').values = this.types._keys;
    };
    Schema.prototype.buildType = function buildType(typeDef, path) {
        var baseType = this.getOrBuildType(typeDef.type || 'object', path);
        var type = null;
        if (baseType) {
            typeDef.name = typeDef.name || baseType.name + this.types.size;
            type = baseType.build(typeDef, this, path);
            this.types.set(type.name, type);
        } else {
            throw new Error(`Could not read or create base type for '${typeDef.name}'!`);
        }
        return type;
    };
    Schema.prototype.getOrBuildType = function getOrBuildType(typeDef, path) {
        path = path || [];
        var type = null;
        // type name
        if (typeof typeDef === 'string') {
            type = this.types.get(typeDef);
            var m = typeDef.match(new RegExp('^ref\\s+([\\w\\d]+)', 'i'));
            if (m != null) {
                // reference type
                var baseType = this.types.get(m[1]);
                var refTypeName = 'ref' + m[1];
                type = this.types.get(refTypeName);
                if (!type) {
                    type = new RefType('ref' + m[1], baseType);
                    this.types.set(refTypeName, type);
                }
                if (!baseType) {
                    this.addMissingType(m[1], x => type.baseType = x, path);
                }
                type.schema = this;
            }
        }
        else if (typeDef instanceof Type) {
            type = typeDef;
        } else if (typeof typeDef === 'object') {
            // inline definition
            type = this.buildType(typeDef, path);
        } else throw new Error(`Invalid type definition '${typeDef}'!`);
        return type;
    };    
    Schema.prototype.importTypes = async function importTypes(arr) {
        var res = await load(arr);
        var errors = [];
        for (var i=0; i<res.length; i++) {
            if (res[i].error) {
                errors.push(res[i].error.message);
            } else {
                for (var j=0; j<res[i].data.length; j++) {
                    this.getOrBuildType(res[i].data[j], ['imports', j]);
                }
            }
        }
        if (errors.length > 0) throw new Error(errors.join('\n'));
    };
    Schema.prototype.checkMissingTypes = function checkMissingTypes(results) {
        for (var tn in this.missingTypes) {
            var type = this.types.get(tn);
            var messages = [`Missing type '${tn}'!`];
            for (var i=0; i<this.missingTypes[tn].length; i++) {
                var tm = this.missingTypes[tn][i];
                if (type) {
                    tm[0](type)
                } else {
                    if (results) {
                        results.push(new ValidationResult(tm[1] || [], messages));
                    } else {
                        throw new Error(messages);
                    }
                }
            }
            delete this.missingTypes[tn];
        }
    };
    Schema.prototype.build = async function build(input) {
        // The input can be an array of type definitions
        // or
        // an object with elements:
        // "use-default-type": true/false
        // "imports": array of files to load
        // "definition": array of type definitions
        var definition = input;
        if (input.constructor === Object) {
            definition = definition.definition || [];
            if (input['use-default-types']) {
                this.addDefaultTypes();
            }
            if (input.imports) {
                await this.importTypes(input.imports);
            }
        }
        if (Array.isArray(definition)) {
            for (var i=0; i<definition.length; i++) {
                var typeDef = definition[i];
                this.getOrBuildType(typeDef, [i]);
            }
            // replace missing type refs by type
            this.checkMissingTypes();
        }
    };
    Schema.prototype.addMissingType = function addMissingType(typeName, setter, path) {
        if (!this.missingTypes[typeName]) {
            this.missingTypes[typeName] = [];
        }
        this.missingTypes[typeName].push([setter, path]);
    };    
    Schema.prototype.validate = function validate(obj, type, isStrict) {
        var results = [];
        var typeName = type instanceof Type ? type.name : type;
        var type = this.types.get(typeName);
        if (type) {
            type.validate(obj, results, null, isStrict);
            this.checkMissingTypes(results);
        } else {
            results.push(`Input type '${typeName}' is not defined!`);
        }
        return results;
    };
    // mergeObjects(source, target, flags)
    // mergeObjects(source, target, type, flags)
    Schema.prototype.mergeObjects = function mergeObjects(source, target, type, flags) {
        if (type != undefined && !(type instanceof Type)) {
            flags = type;
            type = null;
        }
        type = type || target.__type__;
        if (type == undefined) {
            throw new Error('Could not determin target type!');
        }
        // merge objects, lists and maps
        if (typeof type.merge === 'function') {
            type.merge(source, target, flags);
        } else {
            throw new Error('Target type cannot be merged!');
        }
    };

    Schema.defaultTypes = (function() {
        var types = [];
        var basicTypes = {
            'bool': new BoolType('bool'),
            'int': new IntType('int'),
            'float': new FloatType('float'),
            'string': new StringType('string'),
            'list': new ListType('list'),
            'enum': new EnumType('enum'),
            'map': new MapType('map'),
            'object': new ObjectType('object'),
            'type': new TypeType('type'),
            'void': new VoidType('void')
        };
        types.push(...Object.values(basicTypes));
        var typeList = new ListType('typeList',    basicTypes.list, { 'elemType': basicTypes.type });
        var listTypes = [
            new ListType('boolList',    basicTypes.list, { 'elemType': basicTypes.bool }),
            new ListType('intList',     basicTypes.list, { 'elemType': basicTypes.int }),
            new ListType('floatList',   basicTypes.list, { 'elemType': basicTypes.float }),
            new ListType('stringList',  basicTypes.list, { 'elemType': basicTypes.string }),
            new ListType('objectList',  basicTypes.list, { 'elemType': basicTypes.object }),
            typeList,
            new ListType('voidList',    basicTypes.list, { 'elemType': basicTypes.void })
        ];
        types.push(...listTypes);
        var arrayTypes = [
            new ListType('bool2',    basicTypes.list, { 'elemType': basicTypes.bool, 'length':2 }),
            new ListType('int2',     basicTypes.list, { 'elemType': basicTypes.int, 'length':2 }),
            new ListType('float2',   basicTypes.list, { 'elemType': basicTypes.float, 'length':2 }),
            new ListType('string2',  basicTypes.list, { 'elemType': basicTypes.string, 'length':2 }),
            new ListType('object2',  basicTypes.list, { 'elemType': basicTypes.object, 'length':2 }),
            new ListType('type2',    basicTypes.list, { 'elemType': basicTypes.type, 'length':2 }),
            new ListType('void2',    basicTypes.list, { 'elemType': basicTypes.void, 'length':2 }),
            new ListType('bool3',    basicTypes.list, { 'elemType': basicTypes.bool, 'length':3 }),
            new ListType('int3',     basicTypes.list, { 'elemType': basicTypes.int, 'length':3 }),
            new ListType('float3',   basicTypes.list, { 'elemType': basicTypes.float, 'length':3 }),
            new ListType('string3',  basicTypes.list, { 'elemType': basicTypes.string, 'length':3 }),
            new ListType('object3',  basicTypes.list, { 'elemType': basicTypes.object, 'length':3 }),
            new ListType('type3',    basicTypes.list, { 'elemType': basicTypes.type, 'length':3 }),
            new ListType('void3',    basicTypes.list, { 'elemType': basicTypes.void, 'length':3 }),
            new ListType('bool4',    basicTypes.list, { 'elemType': basicTypes.bool, 'length':4 }),
            new ListType('int4',     basicTypes.list, { 'elemType': basicTypes.int, 'length':4 }),
            new ListType('float4',   basicTypes.list, { 'elemType': basicTypes.float, 'length':4 }),
            new ListType('string4',  basicTypes.list, { 'elemType': basicTypes.string, 'length':4 }),
            new ListType('object4',  basicTypes.list, { 'elemType': basicTypes.object, 'length':4 }),
            new ListType('type4',    basicTypes.list, { 'elemType': basicTypes.type, 'length':4 }),
            new ListType('void4',    basicTypes.list, { 'elemType': basicTypes.void, 'length':4 })

        ];
        types.push(...arrayTypes);
        var derivedTypes = [
            new IntType('uint8',    basicTypes.int, { 'min': 0, 'max': 255 }),
            new IntType('uint16',   basicTypes.int, { 'min': 0, 'max': 65535 }),
            new IntType('uint32',   basicTypes.int, { 'min': 0, 'max': 4294967296 }),
            new MapType('KeyValue', basicTypes.map, { 'keyType':basicTypes.string, 'valueType':basicTypes.int })
        ];
        types.push(...derivedTypes);
        var attributeType = new ObjectType('attribute', basicTypes.object, {
            'ref':'name',
            'attributes': {
                'default': { 'type': basicTypes.void, 'isRequired':false },
                'name': { 'type': basicTypes.string, 'isRequired':true },
                'type': { 'type': basicTypes.type, 'isRequired':true },
                'required': { 'type': basicTypes.bool, 'isRequired':false }
            },
            'schema': this
        });
        var functionType = new ObjectType('function', basicTypes.object, {
            'ref':'name',
            'attributes': {
                'name': { 'type': basicTypes.string, 'isRequired':true },
                'arguments': { 'type': typeList, 'isRequired':false },
                'returnValue': { 'type': basicTypes.type, 'isRequired':false }
            },
            'schema': this
        });
        var typeNameType = new EnumType('typeName');
        var schemanticTypes = [
            attributeType,
            new ListType('attributeList', basicTypes.list, { 'elemType': attributeType }),
            functionType,
            typeNameType
        ];
        types.push(...schemanticTypes);
        return types;
    })();

    Schema.build = async function build(definition) {
        var schema = new Schema();
        await schema.build(definition);
        return schema;
    };
    Schema.load = async function load(path) {
        var res = await self.load(path);
        if (res.error) throw res.error;
        return await Schema.build(res.data);
    };

    publish(Schema, 'Schema');
})();
