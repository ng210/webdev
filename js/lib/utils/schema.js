(function() {
    //#region TYPE
    function Type(name, type) {
        this.name = name;
        this.baseType = type;
        this.constraints = [];
        this.isNumeric = false;
        this.addConstraint(this, Schema.checkType);
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
    Type.prototype.addConstraint = function addConstraint(obj, fn) {
        if (this.constraints.find(x => x.fn == fn) == null) {
            this.constraints.push({obj: obj, fn: fn});
        }
    };
    Type.prototype.validate = function validate(value, results) {
        var results = results || [];
        for (var i=0; i<this.constraints.length; i++) {
            var cst = this.constraints[i];
            cst.fn.call(cst.obj, value, results);
        }
        return results;
    };
    Type.prototype.createValue = function createValue() {
        throw new Error('Not implemented!');
    };
    //#endregion

    //#region SIMPLE TYPE
    function SimpleType(name, type, args) {
        SimpleType.base.constructor.call(this, name, type);
        this.min = NaN;
        this.max = NaN;
        this.length = -1;
        this.elemType = null;
        this.values = null;
        this.types = null;
        if (type) {
            this.isNumeric = type.basicType.isNumeric;
        }
        //if (args != undefined)
        for (var i in args) {
            switch (i) {
                case 'length':
                    if (args.length) {
                        this.length = args.length;
                        this.addConstraint(this, Schema.checkLength);
                    }
                    break;
                case 'elemType':
                    this.elemType = args.elemType;
                    this.addConstraint(this, Schema.checkElemType);
                    break;
                case 'values':
                    this.values = args.values;
                    this.addConstraint(this, Schema.checkEnum);
                    break;
                case 'min':
                    this.min = args.min;
                    this.addConstraint(this, Schema.checkRange);
                    break;
                case 'max':
                    this.max = args.max;
                    this.addConstraint(this, Schema.checkRange);
                    break;
                case 'keyValue':
                    this.keyType = args.keyValue[0] || Schema.Types.STRING;
                    this.valueType = args.keyValue[1] || Schema.Types.STRING;
                    this.addConstraint(this, Schema.checkKeyValue);
                    break;
                case 'schema':
                    this.schema = args.schema;
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
    function ComplexType(name, type, args) {
        ComplexType.base.constructor.call(this, name, type);
        this.attributes = {};
        if (type instanceof ComplexType) {
            for (var i in type.attributes) {
                if (type.attributes.hasOwnProperty(i)) {
                    this.attributes[i] = type.attributes[i];
                }
            }
        }
        this.isSealed = true;
        for (var i in args) {
            switch (i) {
                case 'sealed': this.isSealed = args.sealed; break;
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
                        results.push(new Schema.ValidationResult(i, 'Unknown type!'));    
                    }
                } else {
                    if (this.isSealed) {
                        results.push(new Schema.ValidationResult(i, 'Undefined element!'));
                    }
                }
            }
        }
        for (var i in this.attributes) {
            if (this.attributes.hasOwnProperty(i) && obj[i] == undefined) {
                if (this.attributes[i].required) {
                    results.push(new Schema.ValidationResult(i, 'Required element has no value!'));
                }
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
        if (res) res.__type__ = this;
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
        this.types = {};
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
        this.buildType({name:"Attribute",
            attributes: [
                { "name":"name", type:"string", required:true },
                { "name":"type", type:"Types", required:true },
                { "name":"required", type:"bool", required:false }
            ]
        });
        this.buildType({name:"AttributeList", type:"list", elemType:"Attribute"});
        this.buildType({
            name:"ComplexType",
            attributes: [
                { name:"name", type:"string", required:true },
                { name:"attributes", type: "AttributeList", required:true }
            ]
        });

        this.builtInTypes = Object.keys(this.types);

        if (definition) {
            for (var i=0; i<definition.length; i++) {
                var t = definition[i];
                debug_(`- adding type '${t.name}'`, 1);
                this.buildType(t);
            }
        }

        // update values of Attribute type
        types.values = Object.keys(this.types);
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
            type = this.types[obj];
            if (!type) throw new Error(`Unknown type '${obj}'!`);
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
        if (type.basicType.name == Schema.Types.OBJECT) {
            // complex type
            var name = obj.name || `Complex${Object.keys(this.types).length}`;
            debug_('build complex type ' + name, 2);
            res = new Schema.ComplexType(name, type, obj);
            debug_('Add ComplexType ' + name, 1);
            this.types[name] = res;
            if (obj.attributes) {
                for (var i=0; i<obj.attributes.length; i++) {
                    var attr = obj.attributes[i];
                    if (typeof attr === 'string') {
                        res.addAttribute(i, this.types[attr]);
                    } else {
                        res.addAttribute(attr.name, this.getOrBuildType(attr.type), obj.attributes[i].required);
                    }                    
                }
            }
        } else {
            // simple type
            var name = obj.name || `${type.name.substr(0, 1).toUpperCase()}${type.name.substr(1)}${Object.keys(this.types).length}`;
            var args = {};
            debug_('build simple type ' + name, 2);
            switch (type.name) {
                case Schema.Types.STRING:
                    args.length = obj.length;
                    break;
                case Schema.Types.LIST:
                    args.length = obj.length;
                    args.elemType = obj.elemType ? this.getOrBuildType(obj.elemType) : null;
                    break;
                case Schema.Types.ENUM:
                    args.values = obj.values;
                    break;
                case Schema.Types.INT:
                case Schema.Types.FLOAT:
                    args.min = obj.min != undefined ? obj.min : Number.NEGATIVE_INFINITY;
                    args.max = obj.max != undefined ? obj.max : Number.POSITIVE_INFINITY;
                    break;
                case Schema.Types.MAP:
                    var keyType = this.getOrBuildType(obj.key || Schema.Types.STRING);
                    if (keyType.name != Schema.Types.STRING && keyType.name != Schema.Types.INT ) throw new Error(`Invalid key type ${keyType.name}!`);
                    args.keyValue = [keyType, this.getOrBuildType(obj.value)];
                    break;
                case Schema.Types.TYPE:
                    args.schema = this;
                    break;
            }
            res = new Schema.SimpleType(name, type, args);
            debug_('Add SimpleType ' + name, 1);
            this.types[name] = res;
        }
        return res;
    };
    Schema.load = async function schema_load(schemaInfo, definition, errors) {
        if (schemaInfo.schema == null) {
            var res = await load(schemaInfo.schemaDefinition);
            if (res.error) throw res.error;
            schemaInfo.schema = new Schema(res.data);
        }
        if (typeof definition === 'string') {
            var res = await load({ url:definition, responseType:'json', charSet:'utf-8' });
            if (res.error) {
                errors.push(res.error);
            } else {
                definition = res.data;
                var vt = schemaInfo.schema.types[schemaInfo.validate];
                if (vt) {
                    vt.validate(definition, errors);
                }
            }
        }
        return definition;
    }
    //#endregion

    //#region CHECK METHODS
    Schema.checkList = function checkList(list, type, label, results) {
        var hasErrors = false;
        results = results || [];
        label = label || 'value';
        for (var i=0; i<list.length; i++) {
            var res = type.validate(list[i]);
            for (var j=0; j<res.length; j++) {
                res[j].field.push(i);
                results.push(new Schema.ValidationResult(res[j].field, `Invalid ${label} - ${res[j].message}`));
                hasErrors = true;
            }
        }
        return hasErrors;
    };
    Schema.checkType = function checkType(value, results) {
        var res = false;
        var type = (typeof value).toUpperCase();
        if (this.name == Schema.Types.TYPE) {
            var it = this.schema.getOrBuildType(value);
            if (typeof value === 'object' && value.name == undefined) {
                value.name = it.name;
            }
            res = it != null;
        } else {
            var basicType = this.basicType;
            switch (type) {
                case 'BOOLEAN':
                    res = basicType.name == Schema.Types.BOOL;
                    break;
                case 'NUMBER':
                    switch (basicType.name) {
                        case Schema.Types.INT: type = Schema.Types.INT; res = parseInt(value) == value; break;
                        case Schema.Types.FLOAT: type = Schema.Types.FLOAT; res = parseFloat(value) == value; break;
                    }
                    break;
                case 'OBJECT':
                    res = basicType.name == Schema.Types.OBJECT || basicType.name == Schema.Types.MAP || Array.isArray(value) && basicType.name == Schema.Types.LIST;
                    break;
                case 'STRING':
                    res = basicType.name == Schema.Types.STRING || basicType.name == Schema.Types.ENUM;
                    break;
                default:
                    res = false;
            }
        }
        if (!res) {
            results.push(new Schema.ValidationResult(null, `Type mismatch (expected ${basicType.name}, received ${type})`));
        }
        return res;
    };
    Schema.checkLength = function checkLength(value, results) {
        var res = true;
        if (this.length < value.length) {
            results.push(new Schema.ValidationResult(null, `Length of ${this.name} is ${value.length} greater than the allowed ${this.length}!`));
        }
        return res;
    };
    Schema.checkRange = function checkRange(value, results) {
        var res = true;
        if (this.min != undefined && this.min > value) {
            results.push(new Schema.ValidationResult(null, `Value of ${this.name} is less than allowed (${value} < ${this.min})!`));
        }
        if (this.max < value) {
            results.push(new Schema.ValidationResult(null, `Value is greater than allowed (${value} > ${this.max})!`));
        }
        return res;
    };
    Schema.checkElemType = function checkElemType(value, results) {
        return Schema.checkList(value, this.elemType, 'element', results);
    };
    Schema.checkEnum = function checkEnum(value, results) {
        var res = this.values.includes(value);
        if (!res) {
            results.push(new Schema.ValidationResult(null, `Invalid item ${value}, allowed values are ${this.values}!`))
        }
        return res;
    };
    Schema.checkKeyValue = function checkElemType(value, results) {
        var keys = Object.keys(value);
        var hasKeyErrors = false;
        var basicType = this.keyType.basicType;
        for (var i=0; i<keys.length; i++) {
            var key = keys[i];
            var isKeyValid = true;
            if (basicType.name == Schema.Types.INT) {
                key = parseInt(key);
                if (isNaN(key) || key.toString() != keys[i]) {
                    isKeyValid = false;
                    hasKeyErrors = true;
                    results.push(new Schema.ValidationResult(i, `Invalid key: Type mismatch (expected ${basicType.name}, received ${typeof keys[i]})`));
                }
            }
            if (isKeyValid) {
                var res = this.keyType.validate(key);
                for (var j=0; j<res.length; j++) {
                    res[j].field.unshift(i);
                    results.push(res[j]);
                    hasKeyErrors = true;
                }
            }
        }
        var hasValueErrors = Schema.checkList(Object.values(value), this.valueType, 'value', results);
        return hasKeyErrors || hasValueErrors;
    };
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

    publish(Schema, 'Schema');
    publish(SimpleType, 'SimpleType', Schema);
    publish(ComplexType, 'ComplexType', Schema);
    publish(ValidationResult, 'ValidationResult', Schema);
})();