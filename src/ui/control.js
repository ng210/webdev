include('/ui/datalink.js');

(function() {
	var Ui = window.Ui || {};
	Ui.Control = function(id, template, parent) {
		this.id = id || 'control';
		this.template = template || {type:'none'};
		this.label = false;
		this.dataSource = null;
		this.dataField = this.template['data-field'] || null;
		this.parent = parent || null;
		if (typeof this.template.label === 'string') {
			this.label = this.template.label;
			//this.label = Ui.Control.create('label', {});
			//this.label.setValue(this.template.label);
		} else if (this.template.label === true) {
			this.label = this.id;
		}
		this.css = [];
		this.handlers = {};
		// add onfocus and onblur events
		Ui.Control.registerHandler.call(this, 'focus', this);
		Ui.Control.registerHandler.call(this, 'blur', this);
		Ui.Control.registerHandler.call(this);
		this.info = Ui.Control.Types[this.template.type];
		this.element = null;
		this.labelElem = null;

		this.constructor = Ui.Control;
	}

	Ui.Control.prototype.dataBind = function(obj, field) {
		this.dataSource = obj instanceof Ui.DataLink ? obj : new Ui.DataLink(obj);
		this.dataField = field !== undefined ? field : this.dataField;
		this.dataSource.add(this, this.dataField);
		return this.dataSource;
	};
	Ui.Control.prototype.getValue = function() {
		return this.element.value;
	};
	Ui.Control.prototype.setValue = function(v) {
		this.element.value = v;
	};
	Ui.Control.prototype.disable = function(v) {
		this.element.disabled = v;
		if (this.labelElem != null) {
			this.labelElem.disable(v);
		}
	};
	Ui.Control.prototype.addHandler = function(eventName, handler) {
		if (this.element.addEventListener) {
			//Dbg.prln(this.id + '.addEventListener ' + eventName);
			this.element.removeEventListener(eventName, handler);
			this.element.addEventListener(eventName, handler);
		} else if (this.element.attachEvent) {
			//Dbg.prln(this.id + '.attachEvent ' + eventName);
			this.element.detachEvent(eventName, handler);
			this.element.attachEvent(eventName, handler);
		}
	};
	Ui.Control.prototype.render = function(ctx) {
		if (!this.element) {
			this.element = document.createElement(this.info.tag);
			this.element.id = this.id;
			this.element.control = this;
		}
		var css = this.css.join(' ');
		if (this.css.length > 0) {
			this.element.className = css;
			css += ' ';
		}
		if (this.label !== undefined && this.label !== false) {
			if (this.labelElem == null) {
				this.labelElem = document.createElement('SPAN');
				this.labelElem.id = this.id + '#label';
				this.labelElem.className = css + 'label';
				this.labelElem.innerHTML = this.label;
			}
			ctx.node.appendChild(this.labelElem);
		} else {
			if (this.labelElem && this.labelElem.parentNode) {
				this.labelElem.parentNode.removeChild(this.labelElem);
			}
		}

		for (eventName in this.handlers) {
			this.addHandler(eventName, Ui.Control.onevent);
		}

		if (this.element.parentNode != ctx.node) {
			if (this.element.parentNode != null) {
				this.element.parentNode.removeChild(this.element);
			}
			ctx.node.appendChild(this.element);
		}
	};
	Ui.Control.registerHandler = function(eventName, context) {
		if (eventName === undefined) {
			if (Array.isArray(this.template.events)) {
				for (var i=0; i<this.template.events.length; i++) {
					//Dbg.prln('Register handler ' + this.template.events[i] + ' for ' + this.id);
					this.registerHandler(this.template.events[i], this);
				}
			}
			return;
		}
		context = context || window;
		var handler;
		var node = this;
		while (node) {
			handler = node['on'+eventName];
			if (handler !== undefined) {
				break;
			}
			node = node.parent;
		}
		if (typeof handler === 'function') {
			if (this.handlers[eventName] === undefined) {
				this.handlers[eventName] = [];
			}
			this.handlers[eventName].push({fn: handler, obj: node});
			//Dbg.prln('register ' + eventName + ' for ' + context.id);
		}
	};
	// Statics
	Ui.Control.DataTypes = {
		int:	'int',
		float:  'float',
		string: 'string'
	};
	Ui.Control.Types = {};
	Ui.Control.create = function(id, template, parent) {
		var info = Ui.Control.Types[template.type];
		if (info === undefined) throw new Error('Unsupported Control type ('+template.type+')!');
		var ctrl = Reflect.construct(info.ctor, [id, template, parent]);
		return ctrl;
	};
	Ui.Control.onevent = function(e) {
console.log(`onevent of ${e.type} for ${e.target.control.id}`);
		var event = e.type;
		var control = e.target.control;
		var handlers = control.handlers[event];
		if (handlers != undefined) {
			for (var i=0; i<handlers.length; i++) {
				var handler = handlers[i];
				if (typeof control.getValue === 'function') {
					handler.fn.call(handler.obj, control, control.getValue());
				} else {
					handler.fn.call(handler.obj, control);
				}
			}
		}
	};

	Boot.addToSearchPath();
	public(Ui, 'Ui');
})();