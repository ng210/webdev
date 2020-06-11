include('icontrol.js');
include('ui/datalink.js');

(function() {

    function Control(id, template, parent) {
        this.id = id || 'ctrl';
        this.parent = parent || null;
        this.template = null;
        this.style = {};
        this.renderer = null;
        this.renderer2d = null;
        this.renderer3d = null;

        this.handlers = {};
        if (template) this.applyTemplate(template);

        this.left = 0;
        this.top = 0;
        this.width = 0;
        this.height = 0;

        this.render = null;
    }
    extend(glui.IControl, Control);

    Control.prototype.fromNode = function fromNode(node) {
        var template = {};
        for (var i in node.attributes) {
            if (node.attributes.hasOwnProperty(i)) {
                var name = node.attributes[i].name;
                var value = node.attributes[i].value;
                if (name == 'style') {
                    var lines = value.split(';');
                    value = {};
                    for (var li=0; li<lines.length; li++) {
                        var tokens = lines[li].split(':');
                        value[tokens[0].trim()] = tokens[1].trim();
                    }
                }
                template[name] = value;
            }
        }
        template = this.applyTemplate(template);
        // add event handlers
        this.addHandlers(template);
    };
    Control.prototype.getHandlers = function getHandlers() {
        return [ 'mouseover', 'mouseout' ];
    };
    Control.prototype.getTemplate = function getTemplate() {
        var template = {
            'id': this.id || 'ctrl',
            'type': 'control',
            'label': false,
            'disabled': false,
            'data-source': null,
            'data-field': null,
            // styling
            'style': {
                'left': 0,
                'top': 0,
                'width': '4em',
                'height': '1.2em',
                'z-index': 0,
                'background': '#c0c0c0',
                'color': '#000000',
                'font': 'Arial 20 normal',
                'align': 'center middle',
                'border': '#c0c0c0 2px solid'
            }
        };

        var handlers = this.getHandlers();
        for (var i=0; i<handlers.length; i++) {
            template['on'+handlers[i]] = null;
        }

        return template;
    };
    Control.prototype.dataBind = function dataBind(source, field) {
        source = source || this.dataSource;
        if (source) {
            this.dataSource = source instanceof Ui.DataLink ? source : new Ui.DataLink(source);
            this.dataField = field !== undefined ? field : this.dataField;
            this.dataSource.add(this.dataField);
        }
    };
    Control.prototype.addHandler = function addHandler(eventName) {
        var nodes = [];
        var node = this;
        while (node) {
            nodes.push(node);
            node = node.parent;
        }
        for (var i=0; i<nodes.length; i++) {
            node = nodes[i];
            var handler = node['on'+eventName];
            if (handler !== undefined) {
                if (typeof handler === 'function') {
                    if (this.handlers[eventName] === undefined) {
                        this.handlers[eventName] = [];
                    }
                    if (this.handlers[eventName].findIndex(x => x.obj == node && x.fn == handler) == -1) {
                        this.handlers[eventName].push({obj:node, fn:handler});
                    }
                }
            }
        }
    };
    Control.prototype.addHandlers = function addHandlers(template) {
        for (var i in template) {
            if (i.startsWith('on') && template.hasOwnProperty(i)) {
                var name = i.substr(2);
                // todo: template function calls
                this.addHandler(name);
            }
        }
    };
    function mergeFields(src, dst, path) {
        var res = {};
        dst = dst || {};
		for (var i in src) {
            if (!dst.hasOwnProperty(i)) {
                res[i] = src[i];
            } else {
                if (typeof src[i] === 'object') {
                    res[i] = mergeFields(src[i], dst[i]);
                } else {
                    res[i] = dst[i];
                }
            }
        }
        return res;
    }
	Control.prototype.applyTemplate = function(tmpl) {
        this.template = this.getTemplate();
        var merged = mergeFields(this.template, tmpl);
        this.id = merged.id;
        this.type = merged.type;
        this.disabled = merged.disabled;
        this.dataSource = merged['data-source'];
        this.dataField = merged['data-field'];

        this.style = {};
        for (var i in merged.style) {
            this.style[i] = merged.style[i];
        }
        this.label = null;

        return merged;
	};
    Control.prototype.onmouseover = function onmouseover(e) {
        this.renderer.backgroundColor_ = this.renderer.backgroundColor;
        this.renderer.backgroundColor = this.renderer.calculateColor(this.renderer.backgroundColor, 1.2);
        this.renderer.render();
    };
    Control.prototype.onmouseout = function onmouseout(e) {
        if (Control.focused != this) {
            this.renderer.backgroundColor = this.renderer.backgroundColor_;
            this.renderer.render();
        }
    };
	Control.prototype.callHandler = function(eventName, event) {
		var handlers = this.handlers[eventName];
		if (handlers) {
			for (var i=0; i<handlers.length; i++) {
				var handler = handlers[i];
				if (handler.fn.call(handler.obj, event) == true) {
					return true;
				}
			}
		}
	};
	Control.onevent = function(e) {
        // get control by coordinates
		var event = e.type;
        var control = glui.getControlAt(e.x, e.y);
		//console.log(`${event} for target=${e.target}, this=${this}, control=${this.control ? this.control : e.target.control ? e.target.control : 'none'}, Control.focused=${Control.focused}`);
		if (control && control.disabled) {
			return false;
        }
        if (event == 'mousedown') {
            // check onfocus/onblur
            if (control != Control.focused) {
                if (Control.focused) {
                    var ctrl = Control.focused;
                    Control.focused = control;
                    ctrl.callHandler('blur');
                }
                if (control) {
                    control.callHandler('focus');
                    Control.focused = control;
                }
            }
        }
        else if (event == 'mousemove') {
            if (control != Control.atCursor) {
                if (Control.atCursor) {
                    Control.atCursor.callHandler('mouseout');
                }
                Control.atCursor = control;
                if (control) {
                    control.callHandler('mouseover');
                }
            }
        }

		// 	if (Control.focused) {
		// 		Control.isDragging = true;
		// 		Control.dragStart[0] = e.screenX;
		// 		Control.dragStart[1] = e.screenY;
		// 	}

		// } else if (event == 'mousemove') {
		// 	if (Control.isDragging) {
		// 		var draggingEvent = new CustomEvent("dragging", {
		// 			bubbles: false,
		// 			cancelable: false
		// 		});
		// 		control = Control.focused;
		// 		draggingEvent.screenX = e.screenX;
		// 		draggingEvent.screenY = e.screenY;
		// 		draggingEvent.clientX = e.clientX;
		// 		draggingEvent.clientY = e.clientY;
		// 		draggingEvent.deltaX = e.screenX - Control.dragStart[0];
		// 		draggingEvent.deltaY = e.screenY - Control.dragStart[1];
		// 		//draggingEvent.control = Control.focused;

		// 		if (control && control.handlers.dragging && control.handlers.dragging.length) {
		// 			control.element.dispatchEvent(draggingEvent);
		// 			if (!(control instanceof Ui.Slider)) {
		// 				e.preventDefault();
		// 			}
		// 		}
		// 		Control.dragStart[0] = e.screenX;
		// 		Control.dragStart[1] = e.screenY;
		// 	}
		// } else if (event == 'mouseup') {
		// 	Control.isDragging = false;
		// }
		if (!control && (event == 'keydown' || event == 'keyup')) {
			control = Control.focused;
		}

        if (control) {
			e.control = control;
			if (control.callHandler(e.type, e) === true) {
				e.stopPropagation();
				e.preventDefault();
			}
		}
		//console.log(Control.focused ? Control.focused.id : 'none')
    };

    Control.focused = null;
    Control.atCursor = null;

    document.addEventListener('keydown', Control.onevent);
	document.addEventListener('keyup', Control.onevent);
	document.addEventListener('mouseup', Control.onevent);
	document.addEventListener('mousedown', Control.onevent);
	document.addEventListener('mousemove', Control.onevent);
	document.addEventListener('dragging', Control.onevent);


    public(Control, 'Control', glui);

})();