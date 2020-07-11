include('icontrol.js');
include('data/datalink.js');

const DEBUG_EVENT = 'click';

(function() {

    function Control(id, template, parent, context) {
        this.id = id != undefined ? id : 'ctrl';
        this.parent = parent || null;
        this.context = context || this.parent;
        this.template = null;
        this.style = {};
        this.renderer = null;
        this.renderer2d = null;
        this.renderer3d = null;

        this.handlers = {};
        if (template) this.applyTemplate(template);

        this.left = 0;
        this.top = 0;
        this.offsetLeft = 0;
        this.offsetTop = 0;
        this.innerHeight = 0;
        this.innerWidth = 0;
        this.width = 0;
        this.height = 0;
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
    Control.prototype.destroy = function destroy() {
        delete this.renderer;
    };
    Control.prototype.setVisible = function setVisible(visible) {
        this.style.visible = visible;
    };
    Control.prototype.getHandlers = function getHandlers() {
        return [
            { name: 'mouseover', topDown: true },
            { name: 'mouseout', topDown: false },
            { name: 'click', topDown: true },
            { name: 'focus', topDown: true },
            { name: 'blur', topDown: false }
        ];
    };
    Control.prototype.addHandler = function addHandler(eventName, topDown) {
        var nodes = [];
        var node = this;
        if (eventName == DEBUG_EVENT) debug_(`addHandler for ${node.id} (${node.constructor.name})`, 2);
        while (node) {
            topDown ? nodes.unshift(node) : nodes.push(node);
            node = node.context;
        }
        for (var i=0; i<nodes.length; i++) {
            node = nodes[i];
            var handler = node['on'+eventName];
            if (eventName == DEBUG_EVENT) debug_(node, 2);
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
        if (template) {
            throw new Error('Not implemented!');
            // for (var i in template) {
            //     if (i.startsWith('on') && template.hasOwnProperty(i)) {
            //         var name = i.substr(2);
            //         // todo: templated function calls
            //         this.addHandler(name);
            //     }
            // }
        } else {
            var handlers = this.getHandlers();
            for (var i=0; i<handlers.length; i++) {
                this.addHandler(handlers[i].name, handlers[i].topDown);
            }
        }
    };
    Control.prototype.callHandler = async function(eventName, event) {
        //setTimeout( () => {
            var control = this;
            if (eventName == DEBUG_EVENT) {
                debug_(`${DEBUG_EVENT} on ${getObjectPath(control, 'parent').map(x=>x.id)}::${control.id} (${event.control ? `${getObjectPath(event.control, 'parent').map(x=>x.id)}::${event.control.id}` : 'null'})`, 2);
            }
                
            while (control) {
                var handlers = control.handlers[eventName];
                if (handlers) {
                    for (var i=0; i<handlers.length; i++) {
                        var handler = handlers[i];
                        if (eventName == DEBUG_EVENT) debug_(` - ${handler.obj}`, 2);
                        if (handler.fn.call(handler.obj, event, control) == true) {
                            return true;
                        }
                    }
                    break;
                } else {
                    control = control.parent;
                }
            }
        //}, 0);
    };
    Control.prototype.getTemplate = function getTemplate() {
        var template = {
            'type': 'control',
            'label': false,
            'disabled': false,
            'data-source': '',
            'data-field': '',
            'z-index': '',
            // styling
            'style': Control.getStyleTemplate()
        };

        return template;
    };
    Control.prototype.applyTemplate = function(tmpl) {
        var defaultTemplate = this.getTemplate();
        this.template = mergeObjects(defaultTemplate, tmpl);
        if (this.template.id) this.id = this.template.id;
        this.type = this.template.type;
        this.disabled = this.template.disabled;
        var source = this.template['data-source'];
        this.dataSource = typeof source === 'string' ? glui.screen.items.find(x => x.id == source) || window[source] : source;
        this.dataField = this.template['data-field'];
        this.zIndex = parseInt(this.template['z-index']) || 0;
        this.style = mergeObjects(this.template.style, null);
        this.label = null;
        return this.template;
	};
    Control.prototype.dataBind = function dataBind(source, field) {
        source = source || this.dataSource;
        if (source) {
            this.dataSource = source instanceof DataLink ? source : new DataLink(source);
            this.dataField = field !== undefined ? field : this.dataField;
            this.dataSource.add(this.dataField);
        }
    };
    Control.prototype.getBoundingBox = function getBoundingBox() {
        return [this.left, this.top, this.width, this.height];
    };
    Control.prototype.move = function move(dx, dy) {
        this.offsetLeft = dx;
        this.offsetTop = dy;
        if (this.renderer) {
            this.left = this.renderer.accumulate('offsetLeft');
            this.top = this.renderer.accumulate('offsetTop', true);
        }
    };
    Control.prototype.render = function render() {
        if (this.renderer && this.style.visible) {
            this.getBoundingBox();
            this.renderer.render();
        }
    };
    Control.prototype.highlight = function hightlight() {
        this.renderer.backgroundColor_ = this.renderer.backgroundColor;
        this.renderer.backgroundColor = this.renderer.calculateColor(this.renderer.backgroundColor, 1.2);
        this.render();
    };
    Control.prototype.dehighlight = function dehighlight() {
        this.renderer.backgroundColor = this.renderer.backgroundColor_;
        this.render();
    };
    Control.prototype.onmouseover = function onmouseover(e) {
        if (Control.focused != this) {
            this.highlight();
        }
    };
    Control.prototype.onmouseout = function onmouseout(e) {
        if (Control.focused != this) {
            this.dehighlight();
        }
    };
    Control.prototype.onfocus = function onblur(e) {
        ;
    };
    Control.prototype.onblur = function onblur(e) {
        this.dehighlight();
    };
    // Control.prototype.onmouseup = function onmouseup(e) {
    //     console.log(1)
    //     Control.focused = this;
    // };

	Control.onevent = function(e) {
        // get control by coordinates
        var event = e.type;
        var control = glui.getControlAt(e.x, e.y, true);
        e.control = control;
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
                    e.control = control;    //ctrl;
                    // var parent = getCommonParent(ctrl, control, 'parent')
                    // if (!parent) {
                        ctrl.callHandler('blur', e);
                    // } else {
                    //     parent.callHandler('blur', e);
                    // }
                }
                if (control) {
                    e.control = control;
                    control.callHandler('focus', e);
                    Control.focused = control;
                }
            }
			if (Control.focused) {
				Control.dragging = Control.focused;
				Control.dragStart[0] = e.screenX;
                Control.dragStart[1] = e.screenY;
			}
        } else if (event == 'mousemove') {
            if (control != Control.atCursor) {
                if (Control.atCursor) {
                    e.control = Control.atCursor;
                    Control.atCursor.callHandler('mouseout', e);
                }
                Control.atCursor = control;
                if (control) {
                    e.control = control;
                    control.callHandler('mouseover', e);
                }
            }
			if (Control.dragging) {
				var draggingEvent = {
                    type: "dragging",
                    x: e.screenX,
                    y: e.screenY,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    deltaX: e.screenX - Control.dragStart[0],
                    deltaY: e.screenY - Control.dragStart[1]
                };

                Control.dragging.callHandler('dragging', draggingEvent);
				Control.dragStart[0] = e.screenX;
				Control.dragStart[1] = e.screenY;
			}
        } else if (event == 'mouseup') {
            Control.dragging = null;
            if (control) {
                setTimeout( () => control.callHandler('click', e), 0);
            }
        }

		if (!control && (event == 'keydown' || event == 'keyup')) {
			control = Control.focused;
		}

        if (control) {
			e.control = control;
            control.callHandler(e.type, e);
            // e.stopPropagation();
            // e.preventDefault();
		}
		//console.log(Control.focused ? Control.focused.id : 'none')
    };

    Control.create = function create(id, template, parent, context) {
        var type = template.type;
        if (typeof glui[type] === 'function') {
            var ctrl = Reflect.construct(glui[type], [id, template, parent, context]);
            if (ctrl instanceof glui.Control) {
                return ctrl;
            }
        }
        throw new Error(`Unknown control type ${type}`);
    };
    Control.getStyleTemplate = function getStyleTemplate() {
        return {
            'left': 0,
            'top': 0,
            'width': '2em',
            'height': '1.2em',
            'z-index': 0,
            'background': '#c0c0c0',
            'color': '#000000',
            'font': 'Arial 12 normal',
            'align': 'center middle',
            'border': '#c0c0c0 2px solid',
            'visible': true
        };
    };

    Control.focused = null;
    Control.atCursor = null;
    Control.dragging = null;
    Control.dragStart = [0, 0];

    document.addEventListener('keydown', Control.onevent);
	document.addEventListener('keyup', Control.onevent);
	document.addEventListener('mouseup', Control.onevent);
	document.addEventListener('mousedown', Control.onevent);
	document.addEventListener('mousemove', Control.onevent);
	document.addEventListener('dragging', Control.onevent);


    public(Control, 'Control', glui);

})();