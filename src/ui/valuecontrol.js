include('/ui/control.js');

(function() {
	// Abstract type for controls holding a single value
	Ui.ValueControl = function(id, template, parent) {
		Ui.Control.call(this, id, template, parent);
		this.isNumeric = false;
		this.parse = null;
		// cache for the value
		this.value = 0;
		switch (this.template['data-type']) {
			case Ui.Control.DataTypes.int:
				this.isNumeric = true;
				this.parse = parseInt;
				break;
			case Ui.Control.DataTypes.float:
				this.isNumeric = true;
				this.parse = parseFloat;
				break;
		}
		if (this.isNumeric) {
			this.min = this.parse(this.template.min) || 0;
			this.max = this.parse(this.template.max) || 100;
			this.step = this.parse(this.template.step) || 1;
		}
		this.dataField = this.template['data-field'];
		this.constructor = Ui.ValueControl;
	}
	//subtype(Ui.ValueControl, Ui.Control)
	Ui.ValueControl.base = Ui.Control.prototype;
	Ui.ValueControl.prototype = new Ui.Control('valuecontrol');
	Ui.Control.prototype.getValue = function() {
		this.value = this.isNumeric ? (this.parse(this.element.value) || this.template.defaultValue || 0) : (this.element.value || '');
		return this.value;
	};
	Ui.ValueControl.prototype.setValue = function(v) {
		console.log(`value: ${this.value} => ${v}`);
		if (this.isNumeric) {
			this.value = this.parse(v) || this.template.defaultValue || 'n.a.';
		} else {
			this.value = v || '';
		}
		this.element.value = this.value;
	};
	Ui.ValueControl.prototype.validate = function() {
		return this.value >= this.min && this.value <= this.max;
	};
	Ui.ValueControl.prototype.registerHandler = function(event, context) {
		if (['change'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event, context);
	};
	Ui.ValueControl.prototype.render = function(ctx) {
		Ui.ValueControl.base.render.call(this, ctx);
		if (this.isNumeric) {
			this.element.setAttribute('min', this.min);
			this.element.setAttribute('max', this.max);
			this.element.setAttribute('step', this.step);
		}
		if (this.dataSource !== undefined && this.dataField !== undefined) {
			// validate?
			var v = this.dataSource[this.dataField];
			this.setValue(v);
		}
		this.element.value = this.value;
	};

})();