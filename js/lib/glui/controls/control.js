include('icontrol.js');
include('data/datalink.js');

const DEBUG_EVENT = 'baka';

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

        this.isHightlighted = false;
        this.isFocused = false;

        this.handlers = {};
        this.applyTemplate(template);

        this.offsetLeft = -1;
        this.offsetTop = -1;
        this.innerHeight = 0;
        this.innerWidth = 0;
        this.width = 0;
        this.height = 0;
    }
    extend(glui.IControl, Control);

    Object.defineProperties(Control.prototype, {
        'left': {
            enumerable: true,
            configurable: false,
            get: function () {
                var left = this.renderer.convertToPixel(this.offsetLeft);
                if (this.parent) {
                    left += this.parent.left + this.parent.renderer.border.width;
                }
                return left;
            }
        },
        'top': {
            enumerable: true,
            configurable: false,
            get: function () {
                var top = this.renderer.convertToPixel(this.offsetTop, true);
                if (this.parent) {
                    top += this.parent.top + this.parent.renderer.border.width;
                }
                return top;
            }
        }
    });

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
        var control = this;
        if (eventName == DEBUG_EVENT) {
            debug_(`${DEBUG_EVENT} on ${getObjectPath(control, 'parent').map(x=>x.id)}::${control.id} (${event.control ? `${getObjectPath(event.control, 'parent').map(x=>x.id)}::${event.control.id}` : 'null'})`, 2);
        }
            
        while (control) {
            var handlers = control.handlers[eventName];
            if (handlers) {
                for (var i=0; i<handlers.length; i++) {
                    var handler = handlers[i];
                    if (eventName == DEBUG_EVENT) debug_(` - ${handler.obj.constructor.name}`, 2);
                    if (handler.fn.call(handler.obj, event, control) == true) {
                        return true;
                    }
                }
                break;
            } else {
                control = control.parent;
            }
        }
    };
    Control.prototype.getTemplate = function getTemplate() {
        var template = {
            'type': 'control',
            'label': false,
            'disabled': false,
            'data-source': '',
            'data-field': null,
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
        if (typeof source === 'string') {
            var obj = null;
            // move to glui.js <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            if (glui.screen && glui.screen.items) {
                var ctrl = glui.screen.items.find(x => x.id == source);
                if (ctrl) {
                    obj = ctrl;
                }
            }
            source = obj ? obj : window[source];
            // move to glui.js <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        }
        this.dataSource = source;
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
        // this.left = this.renderer.accumulate('offsetLeft');
        // this.top = this.renderer.accumulate('offsetTop', true);
        return [this.left, this.top, this.width, this.height];
    };
    Control.prototype.move = function move(dx, dy) {
        this.offsetLeft = dx;
        this.offsetTop = dy;
        // if (this.renderer) {
        //     this.left = this.renderer.accumulate('offsetLeft');
        //     this.top = this.renderer.accumulate('offsetTop', true);
        // }
    };
    Control.prototype.render = function render() {
        // mark control to render in the next requestAnimationFrame
        if (this.renderer && this.style.visible) {
            glui.markForRendering(this);
        }
    };
    Control.prototype.highlight = function highlight() {
        if (!this.isHighlighted) {
            this.renderer.backgroundColor_ = this.renderer.backgroundColor;
            this.renderer.backgroundColor = this.renderer.calculateColor(this.renderer.backgroundColor, 1.2);
            var node = this;
            //while (node.parent) node = node.parent;
            node.render();

            this.isHighlighted = true;
        }
    };
    Control.prototype.dehighlight = function dehighlight() {
        if (this.isHighlighted && !this.isFocused) {
            this.renderer.backgroundColor = this.renderer.backgroundColor_;
            var node = this;
            //while (node.parent) node = node.parent;
            node.render();

            this.isHighlighted = false;
        }
    };
    Control.prototype.onmouseover = function onmouseover(e) {
        this.highlight();
    };
    Control.prototype.onmouseout = function onmouseout(e) {
        this.dehighlight();
    };
    Control.prototype.onfocus = function onblur(e) {
        this.isFocused = true;
    };
    Control.prototype.onblur = function onblur(e) {
        this.isFocused = false;
        this.dehighlight();
    };
    Control.prototype.setRenderer = async function setRenderer(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = this.createRenderer(mode);
                this.renderer2d.initialize(this, context);
            } else Promise.resolve();
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = this.createRenderer(mode);
                this.renderer3d.initialize(this, context);
            } else Promise.resolve();
            this.renderer = this.renderer3d;
        }
        return this.renderer;
    };

    Control.create = async function create(id, template, parent, context) {
        var type = template.type;
        if (typeof glui[type] === 'function') {
            var ctrl = Reflect.construct(glui[type], [id, template, parent, context]);
            if (ctrl instanceof glui.Control) {
                if (parent.renderer) {
                    await ctrl.setRenderer(parent.renderer.mode, parent.renderer.context);
                }
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
            'background-image': 'none',
            'color': '#000000',
            'font': 'Arial 12 normal',
            'align': 'center middle',
            'border': '#a0a0a0 2px solid',
            'visible': true
        };
    };

    publish(Control, 'Control', glui);

})();