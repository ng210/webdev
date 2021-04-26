(function() {
    //#region TYPE
    function Type(name, type) {
        this.name = name;
        this.baseType = type;
        this.constraints = [];
        if (type) {
            for (var i=0; i<type.constraints.length; i++) {
                this.addConstraint(type.constraints[i]);
            }
        } else {
            this.addConstraint(Schema.checkType);
        }

        this.isNumeric = false;
        this.isReference = false;
        this.schema = null;
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
    Type.prototype.addConstraint = function addConstraint(fn) {
        if (!this.constraints.includes(fn)) {
            this.constraints.push(fn);
        }
    };
    Type.prototype.validate = function validate(value, results) {
        var results = results || [];
        if (this.isReference) {
            var refs = this.schema.references[this.baseType.name];
            var key = `${this.baseType.name} ${value}`;
            if (!this.schema.missingReferences.includes(key) && (!refs || !refs.find(x => x.name == value))) {
                this.schema.missingReferences.push(key);
            }
        } else {
            for (var i=0; i<this.constraints.length; i++) {
                try {
                    var cst = this.constraints[i];
                    var hasError = cst.call(this, value, results);
                } catch (err) {
                    results.push(new Schema.ValidationResult(i, err));
                }
            }
        }
        return results;
    };
    Type.prototype.createValue = function createValue() {
        throw new Error('Not implemented!');
    };
    //#endregion

    //#region SIMPLE TYPE
    function SimpleType(name, baseType, args) {
        SimpleType.base.constructor.call(this, name, baseType);
        this.min = NaN;
        this.max = NaN;
        this.length = 0;
        this.elemType = null;
        this.values = null;
        if (baseType) {
            this.isNumeric = baseType.basicType.isNumeric;
        }
        for (var i in args) {
            switch (i) {
                case 'length':
                    if (args.length) {
                        this.length = args.length;
                        this.addConstraint(Schema.checkLength);
                    }
                    break;
                case 'elemType':
                    this.elemType = args.elemType;
                    this.addConstraint(Schema.checkElemType);
                    break;
                case 'values':
                    this.values = args.values;
                    this.addConstraint(Schema.checkEnum);
                    break;
                case 'min':
                    this.min = args.min;
                    this.addConstraint(Schema.checkRange);
                    break;
                case 'max':
                    this.max = args.max;
                    this.addConstraint(Schema.checkRange);
                    break;
                case 'keyValue':
                    this.keyType = args.keyValue[0] || Schema.Types.STRING;
                    this.valueType = args.keyValue[1] || Schema.Types.STRING;
                    this.addConstraint(Schema.checkKeyValue);
                    break;
                case 'schema':
                    this.schema = args.schema;
                    break;
                case 'ref':
                    this.isReference = args.ref;
                    break;
            }
        }
    }
    extend(Type, SimpleType);

    SimpleType.prototype.createValue = function createValue() {
        var res = null;
        switch (this.basicType.name) {
            case Schema.Types.STRING:
                var length = this.length || 20;
                var v = [];
                var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZWabcdefghijklmnopqrstuvxyzw_";
                for (var i=0; i<length; i++) {
                    v.push(chars[Math.floor(chars.length*Math.random())]);
                }
                res = v.join('');
                break;
            case Schema.Types.LIST:
                res = [];
                for (var i=0; i<5; i++) {
                    res.push(this.elemType.createValue());
                }
                break;
            case Schema.Types.ENUM:
                res = this.values[Math.floor(Math.random()*this.values.length)];
                break;
            case Schema.Types.INT:
                res = Math.floor(Math.random()*65536);
                break;
            case Schema.Types.FLOAT:
                res = Math.random()*65536;
                break;
            case Schema.Types.MAP:
                res = {};
                for (var i=0; i<5; i++) {
                    var key = null;
                    do {
                        key = this.keyType.createValue();
                    } while (res[key] != undefined);
                    res[key] = this.valueType.createValue();
                }
                break;
        }
        return res;
    };
    //#endregion

    //#region COMPLEX TYPE
    function ComplexType(name, baseType, args) {
        ComplexType.base.constructor.call(this, name, baseType);
        this.attributes = {};
        if (baseType instanceof ComplexType) {
            for (var i in baseType.attributes) {
                if (baseType.attributes.hasOwnProperty(i)) {
                    this.attributes[i] = baseType.attributes[i];
                }
            }
        }
        this.isSealed = true;
        for (var i in args) {
            switch (i) {
                case 'sealed': this.isSealed = args.sealed; break;
                case 'ref': this.isReference = args.ref; break;
            }
        }
    }
    extend(Type, ComplexType);

    ComplexType.prototype.addAttribute = function addAttribute(name, type, required) {
        this.attributes[name] = {type:type, required:required};
    };
    ComplexType.prototype.validate = function validate(obj, results) {
        var results = results || [];
        ComplexType.base.validate.call(this, obj, results);
        if (typeof obj === 'object') {
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    if (this.attributes[i]) {
                        if (this.attributes[i].type) {
                            var res = this.attributes[i].type.validate(obj[i]);
                            for (var j=0; j<res.length; j++) {
                                res[j].field.unshift(i);
                                results.push(res[j]);
                            }
                        } else {
                            results.push(new Schema.ValidationResult(i, 'Unknown attribute type!'));
                        }
                    } else {
                        if (this.isSealed) {
                            results.push(new Schema.ValidationResult(i, 'Undefined element!'));
                        }
                    }
                }
            }
            if (obj != null) {
                for (var i in this.attributes) {
                    if (this.attributes.hasOwnProperty(i) && obj[i] == undefined) {
                        if (this.attributes[i].required) {
                            results.push(new Schema.ValidationResult(i, 'Required element has no value!'));
                        }
                    }
                }
            }

            var refs = this.schema.references;
            if (obj) {
                if (!refs[this.name]) refs[this.name] = [obj];
                else if (!refs[this.name].find(x => x.name == obj.name)) refs[this.name].push(obj);
            }
        }
        return results;
    };
    ComplexType.prototype.createValue = function createValue() {
        var res = null;
        switch (this.basicType.name) {
            case Schema.Types.OBJECT:
                res = {};
                for (var i in this.attributes) {
                    if (this.attributes.hasOwnProperty(i)) {
                        res[i] = this.attributes[i].type.createValue();
                    }
                }
                break;
        }
        if (res) {
            Object.defineProperty(res, '__type__', { configurable:false, enumerable:false, writable:false, value:this});
        }
        return res;
    };
    //#endregion

    function ValidationResult(field, message) {
        this.field = [];
        if (field != null) this.field.push(field);
        this.message = message;
    }

    ValidationResult.prototype.toString = function toString() {
        return `${this.field.join('.')}: ${this.message}`;
    };

    //#region SCHEMA
    function Schema(definition) {
        this.types = {};    //mergeObjects(_BasicTypes);
        this.missingTypes = {};
        this.typeDefinitions = [];
        this.references = {};
        this.missingReferences = [];
        this.types.type = new Schema.SimpleType(Schema.Types.TYPE, undefined, {schema:this});
        // basic types
        this.types.string = new Schema.SimpleType(Schema.Types.STRING);
        this.types.bool   = new Schema.SimpleType(Schema.Types.BOOL);
        this.types.int    = new Schema.SimpleType(Schema.Types.INT); this.types.int.isNumeric = true;
        this.types.float  = new Schema.SimpleType(Schema.Types.FLOAT); this.types.float.isNumeric = true;
        this.types.list   = new Schema.SimpleType(Schema.Types.LIST);
        this.types.enum   = new Schema.SimpleType(Schema.Types.ENUM);
        this.types.map    = new Schema.SimpleType(Schema.Types.MAP);
        this.types.object = new Schema.ComplexType(Schema.Types.OBJECT);
        this.types.type   = new Schema.SimpleType(Schema.Types.TYPE, undefined, {schema:this});

        // schema types
        var types = this.buildType({name:"Types", type:"enum", values:[]});
        types.schema = this;
        this.buildType({name:"Attribute",
            attributes: [
                { "name":"name", type:"string", required:true },
                { "name":"type", type:"Types", required:true },
                { "name":"required", type:"bool", required:false }
            ]
        });
        this.buildType({name:"AttributeList", type:"list", elemType:"Attribute"});
        this.buildType({name:"TypeList", type:"list", elemType:"type"});
        this.buildType({name:"StringList", type:"list", elemType:"string"});
        this.buildType({name:"IntList", type:"list", elemType:"int"});
        this.buildType({name:"FloatList", type:"list", elemType:"float"});
        this.buildType({name:"BoolList", type:"list", elemType:"bool"});
        this.buildType({
            name:"ComplexType",
            attributes: [
                { name:"name", type:"string", required:true },
                { name:"attributes", type: "AttributeList", required:true }
            ]
        });

        this.builtInTypes = Object.keys(this.types);

        this.typeDefinitions = [];
        if (definition) {
            for (var i=0; i<definition.length; i++) {
                var t = definition[i];
                debug_(`- adding type '${t.name}'`, 1);
                if (!this.buildType(t)) throw new Error('Bad schema definition!');
            }
        }
        // update values of Attribute type
        types.values = Object.keys(this.types);

        var missingTypes = [];
        for (var i in this.missingTypes) {
            var type = this.types[i];
            if (type) {
                for (var j=0; j<this.missingTypes[i].length; j++) {
                    var cache = this.missingTypes[i][j];
                    if (cache.path) {
                        setObjectAt(cache.path, this.types, type);
                    }
                }
            } else missingTypes.push(i);
            delete this.missingTypes[i];
        }
        if (missingTypes.length > 0) throw new Error(`Unknown type: ${missingTypes.join()}`)
    }
    Schema.prototype.addType = function addType(obj) {
        var type = null;
        if (obj instanceof Type) {
            // pre-defined type
            debug_('add type ' + obj.name, 2);
            type = this.types[obj.name] = obj;
        }
        return type;
    };
    Schema.prototype.getOrBuildType = function getOrBuildType(obj) {
        var type = null;
        if (typeof obj === 'string') {
            if (obj.toUpperCase().startsWith('REF')) {
                // else error
                var refType = obj.substring(4);
                var ref = '*'  + refType;
                type = this.types[ref];
                if (!type) {
                    if (this.types[refType]) {
                        // create reference
                        type = this.types[ref] = new Schema.SimpleType(ref, this.types[refType], {ref:true});
                        type.schema = this;
                    } else {
                        if (!this.missingTypes[refType]) this.missingTypes[refType] = [];
                    }
                }
            } else {
                type = this.types[obj];
                if (!type) {
                    if (!this.missingTypes[obj]) this.missingTypes[obj] = [];
                }
            }
        } else {
            type = this.buildType(obj);
        }
        return type;
    };
    Schema.prototype.buildType = function buildType(obj) {
        // obj has to be a type definition as an Object
        // Simple Types
        // - name: type's name
        // - type: name of registered base type or "inline" type definition
        // - other attributes: length, values, min, max, elemType: works the same as type
        // Complex Types
        // - name: type's name
        // - attributes: list of types
        var res = null;
        var type = this.getOrBuildType(obj.type || Schema.Types.OBJECT);
        var basicType = type.basicType;
        if (type) {
            if (basicType.name == Schema.Types.OBJECT) {
                // complex type
                var name = obj.name || `Complex${Object.keys(this.types).length}`;
                debug_('build complex type ' + name, 2);
                res = new Schema.ComplexType(name, type, obj);
                debug_('Add ComplexType ' + name, 1);
                this.types[name] = res;
                if (obj.res) {
                    this.isReference = true;
                } else if (obj.attributes) {
                    for (var i=0; i<obj.attributes.length; i++) {
                        var attr = obj.attributes[i];
                        if (typeof attr === 'string') {
                            res.addAttribute(i, this.types[attr]);
                        } else {
                            var attrType = this.getOrBuildType(attr.type);
                            if (!attrType) this.missingTypes[attr.type].push({'path':`${name}.attributes.${attr.name}.type`});
                            res.addAttribute(attr.name, attrType, obj.attributes[i].required);
                        }                    
                    }
                }
            } else {
                // simple type
                var name = obj.name || `${type.name.substr(0, 1).toUpperCase()}${type.name.substr(1)}${Object.keys(this.types).length}`;
                var args = {};
                debug_('build simple type ' + name, 2);
                switch (basicType.name) {
                    case Schema.Types.STRING:
                        args.length = obj.length || type.length;
                        break;
                    case Schema.Types.LIST:
                        args.length = obj.length || type.length;
                        args.elemType = null;
                        if (obj.elemType) {
                            var elemType = this.getOrBuildType(obj.elemType);
                            if (!elemType) {
                                if (!this.missingTypes[obj.elemType]) this.missingTypes[obj.elemType] = [];
                                this.missingTypes[obj.elemType].push({'path':`${name}.elemType`});
                            }
                            args.elemType = elemType;
                        } else {
                            args.elemType = type.elemType;
                        }
                        break;
                    case Schema.Types.ENUM:
                        args.values = obj.values != undefined ? obj.values : type.values;
                        break;
                    case Schema.Types.INT:
                    case Schema.Types.FLOAT:
                        args.min = obj.min != undefined ? obj.min : (type.min != undefined ? type.min : Number.NEGATIVE_INFINITY);
                        args.max = obj.max != undefined ? obj.max : (type.max != undefined ? type.max : Number.POSITIVE_INFINITY);
                        break;
                    case Schema.Types.MAP:
                        var keyType = obj.key != undefined ? this.getOrBuildType(obj.key) : type.keyType || Schema.Types.STRING;
                        if (keyType.name != Schema.Types.STRING && keyType.name != Schema.Types.INT ) throw new Error(`Invalid key type ${keyType.name}!`);
                        var valueType = obj.value != undefined ? this.getOrBuildType(obj.value) : type.valueType || Schema.Types.STRING;
                        if (!valueType) {
                            this.missingTypes[valueType].push({'path':`${name}.valueType`});
                        }
                        args.keyValue = [keyType, valueType];
                        break;
                    case Schema.Types.TYPE:
                        args.schema = this;
                        break;
                }
                args.ref = obj.ref;
                res = new Schema.SimpleType(name, type, args);
                debug_('Add SimpleType ' + name, 1);
            }
            this.types[name] = res;
            this.types.Types.values.push(name);
            this.typeDefinitions.push(res);
            res.schema = this;
        }
        return res;
    };
    Schema.prototype.validate = function validate(type, obj, errors) {
        var t = null;
        if (type instanceof Type) {
            t = type;
        } else if (typeof type === 'string') {
            t = this.types[type];
            if (!t) {
                errors.push(new Schema.ValidationResult(i, new Error(`Type '${type}' not defined!`)));
            }
        } else {
            errors.push(new Schema.ValidationResult(i, new Error('Invalid input for validation!')));
        }

        if (t) {
            try {
                var validateErrors = [];
                if (this.imports) {
                    for (var ai in t.attributes) {
                        if (this.imports[ai] && !obj[ai]) {
                            obj[ai] = this.imports[ai];
                        }
                    }
                }
                t.validate(obj, validateErrors);
                // any missing types during validation?
                if (Object.keys(this.missingTypes).length > 0) {
                    validateErrors = [];
                    // revalidate
                    this.missingReferences = [];
                    t.validate(obj, validateErrors);
                }
                // check references
                for (var i=0; i<this.missingReferences.length; i++) {
                    errors.push(new Schema.ValidationResult(null, `Null reference: '${this.missingReferences[i]}'`));
                }
                errors.push(...validateErrors);
            } catch (err) {
                errors.push(err);
            }
        }
    };
    Schema.prototype.resolveImports = async function resolveImports(definition) {
        var imports = definition.Imports;
        if (imports) {
            var links = Object.values(imports).map(x => { return { url:x, responseType:'json', charSet:'utf-8' }; });
            var res = await load(links);
            var errors = res.reduce((a, x) => { if (x.error) a.push(x.error); return a; }, []);
            if (errors.length > 0) {
                definition.error = new Error("Imports failed!");
                definition.error.details = errors;
            } else {
                this.imports = {};
                var ri = 0;
                for (var i in imports) {
                    var types = this.imports[i] = res[ri++].data;
                    for (var ti=0; ti<types.length; ti++) {
                        this.buildType(types[ti]);
                    }
                }
                delete definition.Imports;
            }
        }
        return definition;
    };
    Schema.load = async function schema_load(schemaInfo, definition, errors) {
        if (schemaInfo.schema == null) {
            var res = await load(schemaInfo.schemaDefinition);
            if (res.error) errors.push(res.error);
            else schemaInfo.schema = new Schema(res.data);
        }
        if (!errors.length) {
            if (typeof definition === 'string') {
                res = await load({ url:definition, responseType:'json', charSet:'utf-8' });
                if (res.error) errors.push(res.error);
            }
            if (!errors.length) {
                definition = await schemaInfo.schema.resolveImports(res.data);
                if (definition.error) {
                    errors.push(definition.error);
                } else {
                    schemaInfo.schema.validate(schemaInfo.validate, definition, errors);
                }
            }
        }
        return !errors.length ? definition : null;
    };
    //#endregion

    //#region CHECK METHODS
    Schema.checkList = function checkList(list, type, label, results) {
        var isOk = true;
        results = results || [];
        label = label || 'value';
        for (var i=0; i<list.length; i++) {
            var res = type.validate(list[i]);
            for (var j=0; j<res.length; j++) {
                res[j].field.push(i);
                results.push(new Schema.ValidationResult(res[j].field, `Invalid ${label} - ${res[j].message}`));
                isOk = false;
            }
        }
        return isOk;
    };
    Schema.checkType = function checkType(value, results) {
        var isOk = false;
        var type = (typeof value).toUpperCase();
        if (this.name == Schema.Types.TYPE) {
            var it = this.schema.getOrBuildType(value);
            if (it != null) {
                if (typeof value === 'object' && value.name == undefined) {
                    type = value.name = it.name;
                } else if (typeof value === 'string') {
                    type = value;
                }
                isOk = true;
            }
        } else {
            var basicType = this.basicType;
            switch (type) {
                case 'BOOLEAN':
                    isOk = basicType.name == Schema.Types.BOOL;
                    break;
                case 'NUMBER':
                    switch (basicType.name) {
                        case Schema.Types.INT: type = Schema.Types.INT; isOk = parseInt(value) == value; break;
                        case Schema.Types.FLOAT: type = Schema.Types.FLOAT; isOk = parseFloat(value) == value; break;
                    }
                    break;
                case 'OBJECT':
                    isOk = basicType.name == Schema.Types.OBJECT || basicType.name == Schema.Types.MAP || Array.isArray(value) && basicType.name == Schema.Types.LIST;
                    break;
                case 'STRING':
                    isOk = basicType.name == Schema.Types.STRING || basicType.name == Schema.Types.ENUM;
                    break;
                default:
                    isOk = false;
            }
        }
        if (!isOk) {
            results.push(new Schema.ValidationResult(null, `Type mismatch (expected ${this.basicType.name}, received ${type})`));
        }
        return isOk;
    };
    Schema.checkLength = function checkLength(value, results) {
        var isOk = true;
        if (this.length < value.length) {
            results.push(new Schema.ValidationResult(null, `Length of ${this.name} is ${value.length} greater than the allowed ${this.length}!`));
            isOk = false;
        }
        return isOk;
    };
    Schema.checkRange = function checkRange(value, results) {
        var isOk = true;
        if (this.min != undefined && this.min > value) {
            results.push(new Schema.ValidationResult(null, `Value of ${this.name} is less than allowed (${value} < ${this.min})!`));
            isOk = false;
        }
        if (this.max < value) {
            results.push(new Schema.ValidationResult(null, `Value is greater than allowed (${value} > ${this.max})!`));
            isOk = false;
        }
        return isOk;
    };
    Schema.checkElemType = function checkElemType(value, results) {
        var isOk = false;
        if (Array.isArray(value)) {
            isOk = Schema.checkList(value, this.elemType, 'element', results);
        } else {
            results.push(new Schema.ValidationResult(null, `Value is not a list!`));
        }
        return isOk;
    };
    Schema.checkEnum = function checkEnum(value, results) {
        var isOk = this.values.includes(value);
        if (!isOk) {
            if (this.name == 'Types') {
                var sch = this.schema;
                if (!sch.missingTypes[value]) sch.missingTypes[value] = 0;
                sch.missingTypes[value]++;
                results.push(new Schema.ValidationResult(null, `Missing type ${value}!`))
            } else {
                results.push(new Schema.ValidationResult(null, `Invalid item ${value}, allowed values are ${this.values}!`))
            }
        }
        return isOk;
    };
    Schema.checkKeyValue = function checkKeyValue(value, results) {
        var keys = Object.keys(value);
        var areKeysOk = true;
        var basicType = this.keyType.basicType;
        for (var i=0; i<keys.length; i++) {
            var key = keys[i];
            var isKeyValid = true;
            if (basicType.name == Schema.Types.INT) {
                key = parseInt(key);
                if (isNaN(key) || key.toString() != keys[i]) {
                    isKeyValid = false;
                    areKeysOk = false;
                    results.push(new Schema.ValidationResult(i, `Invalid key: Type mismatch (expected ${basicType.name}, received ${typeof keys[i]})`));
                }
            }
            if (isKeyValid) {
                var res = this.keyType.validate(key);
                for (var j=0; j<res.length; j++) {
                    res[j].field.unshift(i);
                    results.push(res[j]);
                    areKeysOk = false;
                }
            }
        }
        var areValuesOk = Schema.checkList(Object.values(value), this.valueType, 'value', results);
        return areKeysOk || areValuesOk;
    };
//     Schema.checkAttributes = function checkAttributes(value, results) {
//         var errorCount = results.length;
// debugger
//         for (var i in this.attributes) {
//             if (this.attributes.hasOwnProperty(i)) {
//                 if (value[i] != undefined) {
//                     this.attributes[i].type.validate(value[i], results);
//                 } else if (this.attributes[i].required) {
//                     results.push(new Schema.ValidationResult(i, `Required attribute '${i}' missing`));
//                 }
//             }
//         }
//         return errorCount != results.length;
//     };
    //#endregion

    Schema.Types = {
        'STRING': 'string',
        'BOOL': 'bool',
        'INT': 'int',
        'FLOAT': 'float',
        'LIST': 'list',
        'MAP': 'map',
        'ENUM': 'enum',
        'OBJECT': 'object',
        'TYPE': 'type'
    };

    var _BasicTypes = {
        'string': new SimpleType(Schema.Types.STRING),
        'bool'  : new SimpleType(Schema.Types.BOOL),
        'int'   : new SimpleType(Schema.Types.INT),
        'float' : new SimpleType(Schema.Types.FLOAT),
        'list'  : new SimpleType(Schema.Types.LIST),
        'enum'  : new SimpleType(Schema.Types.ENUM),
        'map'   : new SimpleType(Schema.Types.MAP),
        'object': new ComplexType(Schema.Types.OBJECT),
    };
    _BasicTypes.int.isNumeric = true;
    _BasicTypes.float.isNumeric = true;

    // Schema.serialize = function serialize(obj) {
    //     return JSON.stringify(obj, (key, value) => if (key.startsWith('__')))
    // };

    // Schema.deserialize = function deserialize(json) {
    //     return JSON.parse(json);
    // }

    publish(Schema, 'Schema');
    publish(SimpleType, 'SimpleType', Schema);
    publish(ComplexType, 'ComplexType', Schema);
    publish(ValidationResult, 'ValidationResult', Schema);
})();