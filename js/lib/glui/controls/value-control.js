include('control.js');

(function() {

    function ValueControl(id, template, parent, context) {
		this.isBlank = true;
		this.value = '';
		this.isNumeric = false;
		this.dataType = null;
		this.min = 0;
		this.max = 100;
		this.step = 1;
		this.isNormalized = false;
		this.decimalDigits = 2;
		this.dataLink = DataLink.create(this);
		this.dataLink.addField('value');
		this.dataLink.addHandler('value', this, '-', context => glui.Control.prototype.size.call(context, null, null, false), [], false);
		ValueControl.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Control, ValueControl);

    ValueControl.prototype.getHandlers = function getHandlers() {
        var handlers = ValueControl.base.getHandlers.call(this);
        handlers.push({ name: 'change', topDown: false });
        return handlers;
    };
    ValueControl.prototype.getTemplate = function getTemplate() {
        var template = ValueControl.base.getTemplate.call(this);
		template.min = 0;
		template.max = 100;
		template.step = 1;
		template.numeric = '';
		template.normalized = false;
		template.value = null;
		template.blank = '';
		template.default = '';
        template['data-type'] = glui.ValueControl.DataTypes.None;
		template['decimal-digits'] = 0;
        //template['digits'] = 0;
        template['true-value'] = 1;
		template['false-value'] = 0;
        // from-source
        // to-source
        // scale

        return template;
    };
	ValueControl.prototype.fromNode = function fromNode(node) {
		ValueControl.base.fromNode.call(this, node);
		if (!this.dataSource) {
			var value = node.getAttribute('value') || node.innerText;
			if (this.isNumeric) value = this.parse(value);
			this.setValue(value);
		}
	};
	ValueControl.prototype.checkDataType = function checkDataType(isStrict) {
		var isNumeric = Boolean(this.template['numeric']);
		var dataType = this.template['data-type'] || (isNumeric === true ? glui.ValueControl.DataTypes.Int : glui.ValueControl.DataTypes.String);
		switch (dataType) {
			case glui.ValueControl.DataTypes.String:
				if (isStrict && isNumeric === true) {
					console.warn('Inconsistency between numeric=true and data-type=string');
				}
				isNumeric = false;
				break;
			case glui.ValueControl.DataTypes.Bool:
				break;
			case glui.ValueControl.DataTypes.Int:
			case glui.ValueControl.DataTypes.Float:
				if (isStrict && isNumeric === false) {
					console.warn(`Inconsistency between numeric=false and data-type=${dataType}`);
				}
				isNumeric = true;
				break;
			case glui.ValueControl.DataTypes.None:
				break;
			default:
				throw new Error(`Invalid data type ${dataType}`);
		}
		this.dataType = dataType;
		this.isNumeric = isNumeric;
	};
	ValueControl.prototype.setNumericProperties = function setNumericProperties() {
		this.min = this.parse(this.template.min); if (isNaN(this.min)) this.min = 0;
		this.max = this.parse(this.template.max); if (isNaN(this.max)) this.max = 100;
		this.step = this.parse(this.template.step); if (isNaN(this.step)) this.step = 1;
	};
	ValueControl.prototype.applyTemplate = function(tmpl) {
        var template = ValueControl.base.applyTemplate.call(this, tmpl);
        this.validations = {};
		this.blankValue = template.blank || '';
		this.template['data-type'] = template['data-type'];
		this.checkDataType();
		this.defaultValue = template.default != undefined ? template.default : this.isNumeric ? 0 : '';
		this.parse = this.dataType == glui.ValueControl.DataTypes.Float ? parseFloat : parseInt;
		if (this.isNumeric && this.dataType != glui.ValueControl.DataTypes.Bool) {
			this.setNumericProperties();
			// default min/max validations
			this.addValidation('value', x => x >= this.min, 'Value is less than minimum!', x => this.min);
			this.addValidation('value', x => x <= this.max, 'Value is greater than maximum!', x => this.max);
		}
		//this.scale = 1.0;
		if (!this.dataSource || !this.dataField) {
			if (template.value != null) {
				var value = this.isNumeric ? Number(template.value) : template.value;
				this.setValue(value);
			}			
		}
        this.decimalDigits = template['decimal-digits'];
        // if (this.dataSource && this.dataField) {
        //     this.dataBind(this.dataSource, this.dataField);
		// }
		this.isNormalized = !!template.normalized;
		return template;
    };
	// ValueControl.prototype.createMapping = function() {
	// 	var toValue = v => v;
	// 	var toSource = v => v;
	// 	this.dataLink.addHandler('value', { 'args':toValue }, true);
	// 	this.dataSource.addHandler(this.dataField, { 'args':toSource }, true);
	// 	// if (this.dataType == glui.ValueControl.DataTypes.Bool) {
	// 	// 	this.value = value ? this.template['true-value'] : this.template['false-value'];
	// 	// } else {
	// 	// 	if (this.isNumeric) {
	// 	// 		this.min = typeof this.dataSource.obj.min === 'number' ? this.dataSource.obj.min : this.min;
	// 	// 		this.max = typeof this.dataSource.obj.max === 'number' ? this.dataSource.obj.max : this.max;
	// 	// 		this.step = typeof this.dataSource.obj.step === 'number' ? this.dataSource.obj.step : this.step;

	// 	// 		this.value
	// 	// 	} else {

	// 	// 	}
	// 	// 		// calculate xform1() and xform2()
	// 	// 		// xform1 = 
	// 	// 		var min = typeof this.dataSource.obj.min === 'number' ? this.dataSource.obj.min : this.min;
	// 	// 		var max = typeof this.dataSource.obj.max === 'number' ? this.dataSource.obj.max : this.max;
	// 	// 		var step = typeof this.dataSource.obj.step === 'number' ? this.dataSource.obj.step : this.step;
	// 	// 		if (this.dataSource.obj.normalized != undefined) {
	// 	// 			this.isNormalized = this.dataSource.obj.normalized;
	// 	// 		}
	// 	// 		var fromDataSource = null;
	// 	// 		var toDataSource = null;
	// 	// 		if (this.isNormalized) {
	// 	// 			step /= (max - min);
	// 	// 			min = 0.0;
	// 	// 			max = 1.0;
	// 	// 			fromDataSource = this.toNormalized;
	// 	// 			toDataSource = this.fromNormalized;
	// 	// 		}
	// 	// 		this.min = min;
	// 	// 		this.max = max;
	// 	// 		this.step = step;
	// 	// 		// this.scale = (max - min)/(this.max - this.min)
	// 	// 		// // (x-min)/(max-min) = (x'-min')/(max'-min')
	// 	// 		// // x = (x'-min')(max-min)/(max'-min') + min
	// 	// 		// this.toSource = x => (x - this.min)*this.scale + min;
	// 	// 		// this.fromSource = x => (x - min)/this.scale + this.min
	// 	// 		// this.step = typeof this.dataSource.obj.step === 'number' ? this.fromSource(this.dataSource.obj.step) : this.parse(this.template.step) || this.step;
	// 	// 		value = this.parse(value);
	// 	// 	}
	// 	// }
	// };

	ValueControl.prototype.dataBind = function(source, field) {
		if (ValueControl.base.dataBind.call(this, source, field)) {
			// a value control needs both, data-source and data-field
			if (this.dataSource != null) {
				// initial read from data source
				if (typeof source.min == 'number') this.min = source.min;
				if (typeof source.max == 'number') this.max = source.max;
				if (typeof source.step == 'number') this.step = source.step;
				var toValue = DataLink.defaultXform;
				var toSource = DataLink.defaultXform;
				//DataLink.sync(this, 'value', this.dataSource, this.dataField, toSource, toValue);
				this.dataSource.addSync(this.dataField, this, 'value', toSource, toValue);
				var value = this.dataSource[this.dataField];
				this.setValue(value);
			}
		}
        return this.dataSource;
	};
	//#region value handling
	ValueControl.prototype.checkValue = function checkValue(value) {
        var results = this.validate('value', value);
        if (results.length > 0) {
            value = results[0].value;
		}
		this.isBlank = false;
		if (this.isNumeric) {
			if (typeof value !== 'number') {
				value = this.parse(value);
				if (isNaN(value)) {
					value = this.defaultValue;
					this.isBlank = true;
				}
			} else {
				if (this.dataType == ValueControl.DataTypes.Int) {
					value = Math.round(value);
				}
			}
		} else {
			if (value === undefined || value === null) {
				value = this.defaultValue;
				this.isBlank = true;
			}
		}
		return value;
	};
	ValueControl.prototype.setValue = function setValue(value) {
		value = this.checkValue(value);
		var oldValue = this.value;
		this.dataLink.value = value;
		return oldValue;
	};
	ValueControl.prototype.getValue = function getValue() {
		return this.value;
	};
	ValueControl.prototype.normalize = function normalize() {
// debugger
//         if (this.isNumeric) {
//             this.min = 0;
//             this.max = 1;
//             var range = this.dataSource.obj.max - this.dataSource.obj.min;
// 			this.step = this.dataSource.obj.step/range;
// 			// control -> source
// 			var handler = this.dataSource.handlers.value.find( x => x.fn == DataLink.defaultTransform);
// 			handler.fn = this.fromNormalized;
// 			handler = this.dataLink.handlers.value.find( x => x.fn == DataLink.defaultTransform);
// 			handler.fn = this.toNormalized;
//         }
		this.setValue(this.toNormalized(this.getValue()));
    };
    ValueControl.prototype.toNormalized = function toNormalized(value, oldValue, args) {
		var range = this.max - this.min;
		var v = (value - this.min)/range;
		//args.target[args.field] = v;
		return v;
    };
    ValueControl.prototype.fromNormalized = function fromNormalized(value, oldValue, args) {
        var range = this.max - this.min;
		var v = value*range + this.min;
		//args.target[args.field] = v;
		return v;
    };
	//#endregion
	ValueControl.prototype.validate = function(field, value) {
		if (value == undefined) value = this[field];
		var results = [];
		if (this.validations[field]) {
			for (var i=0; i<this.validations[field].length; i++) {
				var validation = this.validations[field][i];
				if (!validation.check.call(this, value)) {
					var result = { };
					if (typeof validation.fix === 'function') {
						result.value = validation.fix.call(this, value);
					}
					if (validation.message) {
						result.message = validation.message.replace('{field}', field);
					}
					results.push(result);
				}
			}
		}
		return results;
	};
	ValueControl.prototype.addValidation = function(field, check, message, fix) {
		if (this.validations[field] == undefined) this.validations[field] = [];
		this.validations[field].push(new ValueControl.Validation(message || `Validation error for '{field}'`, check, fix));
	};

	ValueControl.prototype.validateKey = function validateKey(key) {
		var result = true;
		if (key >= ' ') {
			if (this.isNumeric) {
				result = key >= '0' && key <= '9' || key == '.' || key == '-';
			}
		 }
		 return result;
	};

	ValueControl.Validation = function(message, check, fix) {	// bool check(field)
		this.check = check;
		this.message = message;
		this.fix = fix;
	};

	ValueControl.DataTypes = {
		None:	'string',
		Int:	'int',
		Float:  'float',
		String: 'string',
		Bool:	'bool'
    };

    glui.buildType({
        'name':'ValueControl',
        'type':'Control',
        'attributes': {
			'data-type':	{ 'type':{ 'type':'enum', 'values':Object.values(ValueControl.DataTypes) }, 'isRequired':false, 'default':ValueControl.DataTypes.String },
			'decimal-digits':{ 'type':'int', 'isRequired':false, 'default':2 },
			'default':		{ 'type':'void', 'isRequired':false, 'default':null },
			'isNormalized': { 'type':'bool', 'isRequired':false, 'default':true },
			'isNumeric':	{ 'type':'bool', 'isRequired':false, 'default':true },
			'min':			{ 'type':'float', 'isRequired':false, 'default':0 },
			'max':			{ 'type':'float', 'isRequired':false, 'default':1.0 },
			'step':			{ 'type':'float', 'isRequired':false, 'default':0.1 },
            'style': 		{ 'type':'ControlStyle', 'isRequired':false },
			'value':		{ 'type':'void', 'isRequired':false, 'default':null }
        }
    });

    publish(ValueControl, 'ValueControl', glui);
})();