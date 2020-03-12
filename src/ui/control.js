include('/ui/datalink.js');

(function() {
	var Ui = window.Ui || {};
	function Control(id, template, parent) {
		this.id = id || 'control';
		this.applyTemplate(template);
		this.validations = {};
		this.label = false;
		this.parent = parent || null;
		if (typeof this.template.label === 'string') {
			this.label = this.template.label;
			//this.label = Control.create('label', {});
			//this.label.setValue(this.template.label);
		} else if (this.template.label === true) {
			this.label = this.id;
		}
		this.css = this.template.css ? this.template.css.split(' ') : [];
		this.cssText = '';
		this.handlers = {};
		this.info = Control.Types[this.template.type];
		this.element = null;
		this.labelElem = null;
		this.dataSource = this.template['data-source'] || null;
		this.dataField = this.template['data-field'];
	}
	Control.prototype.template = {};
	Control.prototype.getTemplate = function() {
		return {
			type: 'none',
			label: false,
			'data-source': null,
			'data-field': null,
			css:'',
			events:[]
		};
	};
	Control.prototype.applyTemplate = function(tmpl) {
		this.template = this.getTemplate();
		for (var i in tmpl) {
			if (this.template.hasOwnProperty(i) && tmpl[i] != undefined) {
				this.template[i] = tmpl[i];
			} else {
				console.log(`${this.constructor.name}.template does not define '${i}'`);
			}
		}
	};
	Control.prototype.disable = function(v) {
		this.element.disabled = v;
		if (this.labelElem != null) {
			this.labelElem.disable(v);
		}
	};
	Control.prototype.addHandler = function(eventName, handler) {
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
	Control.prototype.render = function(ctx) {

		this.cssText = this.parent && this.parent.cssText ? this.parent.cssText : '';
		if (this.css.length > 0) {
			this.cssText += this.css.join(' ');
			this.cssText += ' ';
		}

		if (this.label /*!== undefined && this.label !== false*/) {
			if (this.labelElem == null) {
				this.labelElem = document.createElement('SPAN');
				this.labelElem.id = this.id + '#label';
				this.labelElem.control = this;
			}
			this.labelElem.className = this.cssText + 'label';
			this.labelElem.innerHTML = this.label;
		} else {
			if (this.labelElem && this.labelElem.parentNode) {
				this.labelElem.parentNode.removeChild(this.labelElem);
			}
			this.labelElem = null;
		}

		if (!this.element) {
			this.element = document.createElement(this.info.tag);
			this.element.id = this.id;
			this.element.control = this;
		}
		if (this.cssText) {
			this.element.className = this.cssText;
		}
		if (this.labelElem && !this.labelElem.parentNode && ctx && ctx.element) {
			ctx.element.appendChild(this.labelElem);
		}

		// add onfocus and onblur events
		Control.registerHandler.call(this, 'focus', this);
		Control.registerHandler.call(this, 'blur', this);
		Control.registerHandler.call(this);
		for (eventName in this.handlers) {
			this.addHandler(eventName, Control.onevent);
		}
		if (ctx && ctx.element || this.parent && this.parent.element) {
			var parentElement = ctx && ctx.element != null ? ctx.element : this.parent.element;
			if (parentElement != this.element.parentNode) {
				if (this.element.parentNode != null) {
					this.element.parentNode.removeChild(this.element);
				}
				parentElement.appendChild(this.element);
			}
		}
	};
	Control.prototype.registerHandler = function(event) {
		throw new Error('Not implemented!');
	};
	Control.prototype.addClass = function(cssClass, noRepaint) {
		var ix = this.css.findIndex(x => x == cssClass);
		if (ix == -1) {
			this.css.push(cssClass);
		}
		if (!noRepaint)	{
			this.render();
		}
	};
	Control.prototype.removeClass = function(cssClass, noRepaint) {
		var ix = this.css.findIndex(x => x == cssClass);
		if (ix != -1) {
			this.css.splice(ix, 1);
		}
		if (!noRepaint)	{
			this.render();
		}
	};
	Control.prototype.dataBind = function(dataSource, dataField) {
		dataSource = dataSource || this.template['data-source'];
		if (dataSource) {
			this.dataSource = dataSource instanceof Ui.DataLink ? dataSource : new Ui.DataLink(dataSource);
			this.dataField = dataField !== undefined ? dataField : this.dataField;
			this.dataSource.add(this.dataField);
		}
	};

	Control.registerHandler = function(eventName) {
		if (eventName === undefined) {
			if (Array.isArray(this.template.events)) {
				for (var i=0; i<this.template.events.length; i++) {
					//Dbg.prln('Register handler ' + this.template.events[i] + ' for ' + this.id);
					this.registerHandler(this.template.events[i]);
				}
			}
			return;
		}

		// check: node, node.prototype, node.parent...
		var nodes = [this/*, this.__proto__*/];
		var node = this.parent;
		while (node) {
			nodes.push(node);
			node = node.parent;
		}
		var handler;
		var node = this;
		for (var i=0; i<nodes.length; i++) {
			node = nodes[i];
			handler = node['on'+eventName];
			if (handler !== undefined) {
				if (typeof handler === 'function') {
					if (this.handlers[eventName] === undefined) {
						this.handlers[eventName] = [];
					}
					if (this.handlers[eventName].findIndex(x => x.obj == node && x.fn == handler) == -1) {
						this.handlers[eventName].push({obj:node, fn:handler});
						//console.log('register ' + eventName + ' for ' + node.id);
					}
				}
			}
		}
	};

	// Statics
	Control.DataTypes = {
		Int:	'int',
		Float:  'float',
		String: 'string',
		Bool:	'bool'
	};
	Control.Types = {};
	Control.create = function(id, template, parent) {
		var templateType = template.type.toUpperCase();
		var type = Object.keys(Control.Types).find(x => x.toUpperCase() == templateType);
		var info = Control.Types[type];
		if (info === undefined) throw new Error('Unsupported Control type ('+template.type+')!');
		var ctrl = Reflect.construct(info.ctor, [id, template, parent]);
		return ctrl;
	};
	Control.onevent = function(e) {
		var event = e.type;
		//console.log(`${event} for target=${e.target}, this=${this}, control=${this.control ? this.control : e.target.control ? e.target.control : 'none'}, Control.focused=${Control.focused}`);
		var control = this.control || e.target.control;
		// check focus moving events
		if (event == 'mousedown') {
			if (control != Control.focused) {
				if (control) {
					if (control != Control.focused) {
						if (Control.focused != null && typeof Control.focused.onblur === 'function') {
							Control.focused.onblur();
						}
						if (typeof control.onfocus === 'function') {
							control.onfocus();
						}
						Control.focused = control;
					}
				} else {
					if (Control.focused != null && typeof Control.focused.onblur === 'function') {
						Control.focused.onblur();
					}
					Control.focused = null;
				}
			}
			if (Control.focused) {
				Control.isDragging = true;
				Control.dragStart[0] = e.clientX;
				Control.dragStart[1] = e.clientY;
			}

		} else if (event == 'mousemove') {
			if (Control.isDragging) {
				var draggingEvent = new CustomEvent("dragging", {
					bubbles: false,
					cancelable: false
				});
				draggingEvent.clientX = e.clientX;
				draggingEvent.clientY = e.clientY;
				draggingEvent.screenX = e.screenX;
				draggingEvent.screenY = e.screenY;
				draggingEvent.deltaX = e.clientX - Control.dragStart[0];
				draggingEvent.deltaY = e.clientY - Control.dragStart[1];
				//draggingEvent.control = Control.focused;
				control = Control.focused;
				if (control && control.handlers.dragging && control.handlers.dragging.length) {
					control.element.dispatchEvent(draggingEvent);
					if (!(control instanceof Ui.Slider)) {
						e.preventDefault();
					}
				}
				Control.dragStart[0] = e.clientX;
				Control.dragStart[1] = e.clientY;
			}
		} else if (event == 'mouseup') {
			Control.isDragging = false;
		}

		if (!control && (event == 'keydown' || event == 'keyup')) {
			control = Control.focused;
		}
		if (control) {
			var handlers = control.handlers[event];
			if (handlers != undefined) {
				e.control = control;
				for (var i=0; i<handlers.length; i++) {
					var handler = handlers[i];
					//console.log(`Calling ${event} for ${control.id}`);
					if (handler.fn.call(handler.obj, e) == true) {
						//console.log('break event handling')
						e.stopPropagation();
						e.preventDefault();
						break;
					}
				}
			}
		}
		//console.log(Control.focused ? Control.focused.id : 'none')
	};

	Control.focused = null;
	Control.dragStart = [0, 0];
	Control.isDragging = false;

	document.addEventListener('keydown', Control.onevent);
	document.addEventListener('keyup', Control.onevent);
	document.addEventListener('mouseup', Control.onevent);
	document.addEventListener('mousedown', Control.onevent);
	document.addEventListener('mousemove', Control.onevent);
	document.addEventListener('dragging', Control.onevent);

	Ui.Control = Control;

	addToSearchPath();
	public(Ui, 'Ui');
})();