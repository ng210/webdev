include('/ui/control.js');

(function() {
	// Abstract type for controls holding a single value
	function ValueControl(id, template, parent) {
		Ui.ValueControl.base.constructor.call(this, id, template, parent);
		this.getDataType();
		this.parse = this.dataType == Ui.Control.DataTypes.Float ? parseFloat : parseInt;
		this.defaultValue = this.template.default || 0;
		if (this.isNumeric) {
			this.min = this.parse(this.template.min); if (isNaN(this.min)) this.min = 0;
			this.max = this.parse(this.template.max); if (isNaN(this.max)) this.max = 100;
			this.step = this.parse(this.template.step); if (isNaN(this.step)) this.step = 1;
			// default min/max validations
			this.addValidation('value', x => x < this.min, 'Value is less than minimum!');
			this.addValidation('value', x => x > this.max, 'Value is greater than maximum!');
		}
		this.dataLink = null;
		this.dataSource = null;
		this.dataField = this.template['data-field'];
		this.offset = 0.0;
		this.scale = 1.0;
		this.value = this.template.value;
	}
	extend(Ui.Control, ValueControl);

	ValueControl.prototype.getTemplate = function() {
        var template = ValueControl.base.getTemplate();
		template.min = 0;
		template.max = 100;
		template.step = 1;
		template.numeric = null;
		template.value = 0;
		template['data-type'] = null;
		template['data-field'] = null;
		template['default'] = 0;
        return template;
	};

	ValueControl.prototype.dataBind = function(dataSource, dataField) {
		this.dataSource = dataSource instanceof Ui.DataLink ? dataSource : new Ui.DataLink(dataSource);
		this.dataField = dataField !== undefined ? dataField : this.dataField;
		if (this.dataSource && this.dataField) {
			var srcToDst = null, dstToSrc = null;
			if (this.isNumeric) {
				var min = typeof dataSource.min === 'number' ? dataSource.min : this.min;
				var max = typeof dataSource.max === 'number' ? dataSource.max : this.max;
				this.offset = min;
				this.scale = (max - min)/(this.max - this.min);
				this.step = typeof dataSource.step === 'number' ? dataSource.step/this.scale : this.parse(this.template.step) ?? this.scale;
				srcToDst = v => this.offset + this.scale*v;
				dstToSrc = v => (v - this.offset)/this.scale*v;
			}
			this.dataLink = new Ui.DataLink(this);
			this.dataLink.link('value', this.dataSource, this.dataField);
			this.value = this.getValue();
		}
		return this.dataSource;
	};
	ValueControl.prototype.getDataType = function() {
		/**************************************
		numeric = (true|false|null)
		data-type = (string|int|float|null)
		 1. n=true,  d=string	=> n=false, d=string +warn
		 2. n=true,  d=int		=> n=true,  d=int
		 3. n=true,  d=float	=> n=true,  d=float
		 4. n=true,  d=null		=> n=true,  d=int
		 5. n=false, d=string	=> n=false, d=string
		 6. n=false, d=int		=> n=true,  d=int    +warn
		 7. n=false, d=float	=> n=true,  d=float  +warn
		 8. n=false, d=null		=> n=false, d=string
		 9. n=null,  d=string	=> n=false, d=string
		10. n=null,  d=int		=> n=true,  d=int
		11. n=null,  d=float	=> n=true,  d=float
		12. n=null,  d=null		=> n=false, d=string
		***************************************/

		//  1. n=true,  d=string	=> n=false, d=string +warn
		//  2. n=false, d=string	=> n=false, d=string
		//  3. n=false, d=null		=> n=false, d=string
		//  4. n=null,  d=string	=> n=false, d=string
		//  5. n=null,  d=null		=> n=false, d=string
		var isNumeric = this.template.numeric;
		var dataType = this.template['data-type'] || (isNumeric ? Ui.Control.DataTypes.Int : Ui.Control.DataTypes.String);
		if (dataType == Ui.Control.DataTypes.String) {
			this.dataType = dataType;
			this.isNumeric = false;
			if (isNumeric === true) {
				console.warn('Inconsistency between numeric=true and data-type=string');
			}
		} else {
			//  1. n=true,  d=int		=> n=true,  d=int
			//	   n=true,  d=null		=> n=true,  d=int
			//  2. n=true,  d=float		=> n=true,  d=float
			//  3. n=false, d=int		=> n=true,  d=int    +warn
			//  4. n=false, d=float		=> n=true,  d=float  +warn
			//  5. n=null,  d=int		=> n=true,  d=int
			//  6. n=null,  d=float		=> n=true,  d=float
			this.isNumeric = true;
			this.dataType = dataType;
			if (isNumeric === false) {
				console.warn(`Inconsistency between numeric=false and data-type=${dataType}`);
			}
		}
	};
	ValueControl.prototype.getValue = function() {
		return this.dataLink ? this.dataSource[this.dataField] : this.value;
		// var text = this.element.value || this.element.innerText || '';
		// if (this.isNumeric) {
		// 	var v = this.parse(text);
		// 	this.value = v !== NaN ? this.scale*v + this.offset : this.defaultValue;
		// } else {
		// 	this.value = text;
		// }
		// return this.value;
	};
	ValueControl.prototype.setValue = function(value) {
		if (this.isNumeric) {
			if (typeof value !== 'number') {
				value = this.parse(value);
				if (value === NaN) {
					value = this.defaultValue;
				}
			}
		} else {
			value = value || '';
		}
		var results = this.validate(value);
		if (results.length == 0) {
			if (this.dataLink) {
				this.dataLink.value = value;
			} else {
				this.value = value;
			}
		} else {
			results.forEach(x => console.warn(x));
		}

		if (this.element != null) {
			if (this.element.value !== undefined) {
				this.element.value = this.value;
			} else {
				this.element.innerHTML = this.value;
			}			
		}
	};

	ValueControl.prototype.registerHandler = function(event) {
		if (['change'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};
	ValueControl.prototype.render = function(ctx) {
		ValueControl.base.render.call(this, ctx);
		if (this.isNumeric) {
			this.element.setAttribute('min', this.min);
			this.element.setAttribute('max', this.max);
			this.element.setAttribute('step', this.step);
		}
		var attribute = this.element.tagName == 'INPUT' ? 'value' : 'innerHTML';
		this.element[attribute] = this.getValue();
	};

	Ui.ValueControl = ValueControl;

})();