(function() {
    function Type(name) {
        this.name = name;
        this.constraints = [];
    }
    Type.prototype.addConstraint = function addConstraint(obj, fn) {
        this.constraints.push({obj: obj, fn: fn});
    };
    Type.prototype.validate = function validate(value, results) {
        var results = results || [];
        for (var i=0; i<this.constraints.length; i++) {
            var cst = this.constraints[i];
            cst.fn.call(cst.obj, value, results);
        }
        return results;
    };

    function SimpleType(name, type, length, arg) {
        SimpleType.base.constructor.call(this, name);
        this.type = type;
        if (type != Schema.Types.ENUM) this.addConstraint(this, Schema.checkType);
        this.length = -1;
        if (length != undefined) {
            this.length = length;
            this.addConstraint(this, Schema.checkLength);
        }
        this.min = NaN;
        this.max = NaN;

        this.elemType = null;
        this.values = null;
        switch (type) {
            case Schema.Types.LIST:
                this.elemType = arg;
                this.addConstraint(this, Schema.checkElemType);
                break;
            case Schema.Types.ENUM:
                this.values = arg;
                this.addConstraint(this, Schema.checkEnum);
        } 
    }
    extend(Type, SimpleType);

    SimpleType.prototype.isNumeric = function isNumeric() {
        return this.type == Schema.Types.INT || this.type == Schema.Types.FLOAT;
    }

    function ComplexType(name) {
        ComplexType.base.constructor.call(this, name);
        this.attributes = {};
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
                    var res = this.attributes[i].type.validate(obj[i]);
                    for (var j=0; j<res.length; j++) {
                        res[j].field.unshift(i);
                        results.push(res[j]);
                    }
                } else {
                    results.push(new Schema.ValidationResult(i, 'Undefined element!'));
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

    function ValidationResult(field, message) {
        this.field = [];
        if (field != null) this.field.push(field);
        this.message = message;
    }

    function Schema() {
        this.types = {
            'String': new Schema.SimpleType('String', Schema.Types.STRING, null),
            'Int': new Schema.SimpleType('Int', Schema.Types.INT, null),
            'Float': new Schema.SimpleType('Float', Schema.Types.FLOAT, null)
        };
    }
    Schema.prototype.addType = function addType(obj) {
        var type = null;
        if (obj instanceof Type) {
            // pre-defined type
            debug_('add type ' + obj.name, 2);
            type = this.types[obj.name] = obj;
        } else if (typeof obj === 'string') {
            // type ref
            debug_('ref type ' + obj);
            type = this.types[obj];
        } else if (typeof obj === 'object', 2) {
            // build type from JSON object
            debug_('build type ' + obj.name, 2);
            type = this.buildType(obj);
        }
        return type;
    };
    Schema.prototype.buildType = function buildType(obj) {
        var type = null;
        if (obj.type != undefined) {
            // simple type
            var arg = null;
            switch (obj.type) {
                case Schema.Types.LIST: arg = this.addType(obj.elemType); break;
                case Schema.Types.ENUM: arg = mergeObjects(obj.values); break;
            }
            type = new Schema.SimpleType(obj.name || `SimpleType${Object.keys(this.types).length}`, obj.type, obj.length, arg);
            this.types[type.name] = type;
            if (type.isNumeric() && (obj.min != undefined || obj.max != undefined)) {
                type.min = obj.min != undefined ? obj.min : Number.NEGATIVE_INFINITY;
                type.max = obj.max != undefined ? obj.max : Number.POSITIVE_INFINITY;
                type.addConstraint(type, Schema.checkRange);
            }
        } else {
            // complex type
            type = new Schema.ComplexType(obj.name);
            this.types[type.name] = type;
            for (var i in obj.attributes) {
                if (obj.attributes.hasOwnProperty(i)) {
                    type.addAttribute(i, this.addType(obj.attributes[i].type), obj.attributes[i].required);
                }
            }

        }
        return type;
    };

    Schema.checkType = function checkType(value, results) {
        var res = false;
        var type = (typeof value).toUpperCase();
        switch (type) {
            case 'NUMBER':
                switch (this.type) {
                    case Schema.Types.INT: type = Schema.Types.INT; res = parseInt(value) == value; break;
                    case Schema.Types.FLOAT: type = Schema.Types.FLOAT; res = parseFloat(value) == value; break;
                }
                break;
            case 'OBJECT':
                res = Array.isArray(value) && this.type == Schema.Types.LIST;
                break;
            default:
                res = this.type == Schema.Types[type];
        }
        if (!res) {
            results.push(new Schema.ValidationResult(null, `Element ${this.name} type mismatch (${this.type}, ${type})`));
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
            results.push(new Schema.ValidationResult(null, `Value of ${this.name} is greater than allowed (${value} > ${this.max})!`));
        }
        return res;
    };
    Schema.checkElemType = function checkElemType(value, results) {
        var hasResults = false;
        for (var i=0; i<value.length; i++) {
            var res = this.elemType.validate(value[i]);
            for (var j=0; j<res.length; j++) {
                res[j].field.unshift(i);
                results.push(res[j]);
                hasResult = true;
            }
        }
        return hasResults;
    };
    Schema.checkEnum = function checkEnum(value, results) {
        var res = this.values.includes(value);
        if (!res) {
            results.push(new Schema.ValidationResult(null, `Invalid item ${value}, allowed values are ${this.values}!`))
        }
        return res;
    };

    Schema.Types = {
        'STRING': 'String',
        'INT': 'Int',
        'FLOAT': 'Float',
        'LIST': 'List',
        'ENUM': 'Enum'
    };

    publish(Schema, 'Schema');
    publish(SimpleType, 'SimpleType', Schema);
    publish(ComplexType, 'ComplexType', Schema);
    publish(ValidationResult, 'ValidationResult', Schema);
})();