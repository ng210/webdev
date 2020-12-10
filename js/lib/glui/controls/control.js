include('icontrol.js');
include('data/datalink.js');

const DEBUG_EVENT = 'mouseout_|mouseover_';

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
        // cache for left and top
        this.left_ = 0;
        this.top_ = 0;

        this.offsetLeft = -1;
        this.offsetTop = -1;
        this.scrollLeft = 0;
        this.scrollTop = 0;
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
                this.left_ = left;
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
                this.top_ = top;
                return top;
            }
        }
    });

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
    Control.prototype.addHandler = function addHandler(eventName, obj, handler) {
        if (handler !== undefined) {
            var handlerType = this.getHandlers().find(x => x.name == eventName);
            if (handlerType && typeof handler === 'function') {
                if (this.handlers[eventName] === undefined) {
                    this.handlers[eventName] = [];
                }
                if (this.handlers[eventName].findIndex(x => x.obj == obj && x.fn == handler) == -1) {
                    if (eventName.match(DEBUG_EVENT)) debug_(`Add handler of ${eventName} '${obj.id}::${handler.name} to ${this.id}`, 1);
                    handlerType.topDown ? this.handlers[eventName].unshift({obj:obj, fn:handler}) : this.handlers[eventName].push({obj:obj, fn:handler});
                }
            }
        }
    };
    Control.prototype.addEventHandlers = function addEventHandlers(eventName, topDown) {
        var nodes = [];
        var node = this;
        if (eventName.match(DEBUG_EVENT)) debug_(`addHandler for ${node.id} (${node.constructor.name})`, 2);
        while (node) {
            nodes.push(node);
            node = node.context;
        }
        for (var i=0; i<nodes.length; i++) {
            node = nodes[i];
            var handler = node['on'+eventName];
            this.addHandler(eventName, node, handler);
        }
        if (eventName.match(DEBUG_EVENT)) debug_(`${this.id}.${eventName} = ${this.handlers[eventName].map(x => x.obj.id + '::' + x.fn.name)}`, 1);
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
                this.addEventHandlers(handlers[i].name, handlers[i].topDown);
            }
        }
    };
    Control.prototype.callHandler = async function(eventName, event) {
        var control = this;
        if (eventName.match(DEBUG_EVENT)) debug_(`${eventName} on ${getObjectPath(control, 'parent').map(x=>x.id).join('.')} (${event.control ? `${getObjectPath(event.control, 'parent').map(x=>x.id).join('.')}` : 'null'})`, 0);
            
        while (control) {
            var handlers = control.handlers[eventName];
            if (handlers) {
                for (var i=0; i<handlers.length; i++) {
                    var handler = handlers[i];
                    if (eventName.match(DEBUG_EVENT)) debug_(` - ${handler.obj.id}::${handler.fn.name}`, 0);
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
        if (source && typeof source === 'string') {
            while (true) {
            // move to glui.js <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                if (glui.screen && glui.screen.items) {
                    var ctrl = glui.screen.items.find(x => x.id == source);
                    if (ctrl) {
                        this.dataSource = ctrl;
                        break;
                    }
                }
                if (this.context && this.context[source]) {
                    this.dataSource = this.context[source];
                    break;
                }
                this.dataSource = window[source];
                break;
            }
            // move to glui.js <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        } else {
            this.dataSource = source;
        }
        this.dataField = this.template['data-field'];
        this.zIndex = parseInt(this.template.style) || 0;
        this.style = mergeObjects(this.template.style, null);
        this.label = null;
        return this.template;
	};
    Control.prototype.dataBind = function dataBind(source, field) {
        source = source || this.dataSource;
        if (source) {
            this.dataSource = source instanceof DataLink ? source : new DataLink(source);
            this.dataField = field !== undefined ? field : this.dataField;
            if (this.dataField) {
                this.dataSource.add(this.dataField);
            }
        }
    };
    Control.prototype.getBoundingBox = function getBoundingBox() {
        // this.left = this.renderer.accumulate('offsetLeft');
        // this.top = this.renderer.accumulate('offsetTop', true);
        return [this.left, this.top, this.width, this.height];
    };
    Control.prototype.getClippingRect = function getClippingRect() {
        // get intersection of clipping rectangles
        var rect = this.getBoundingBox();
        if (this != glui.screen) {
            var ctrl = this.parent;
            while (true) {
                if (ctrl == glui.screen) break;
                rect = Fn.intersectRect(rect, ctrl.getBoundingBox());
                ctrl = ctrl.parent;
            }
        }
        return rect;
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
        if (!this.isHighlighted && this.renderer.backgroundColor) {
            this.renderer.backgroundColor_ = this.renderer.backgroundColor;
            this.renderer.backgroundColor = this.renderer.calculateColor(this.renderer.backgroundColor, 1.2);
            var node = this;
            //while (node.parent) node = node.parent;
            node.render();

            this.isHighlighted = true;
        }
    };
    Control.prototype.dehighlight = function dehighlight() {
        if (this.isHighlighted && !this.isFocused && this.renderer.backgroundColor_) {
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
                await this.renderer2d.initialize(this, context);
            };
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = this.createRenderer(mode);
                await this.renderer3d.initialize(this, context);
            };
            this.renderer = this.renderer3d;
        }
        return this.renderer;
    };
    Control.prototype.isDescendant = function isDescendant(ancestor) {
        var path = getObjectPath(this, 'parent', ancestor);
        return path[0] == ancestor;
    };

    Control.prototype.click = function click() {
        var x = (this.left + this.width/2)/glui.scale.x;
        var y = (this.top + this.height/2)/glui.scale.y;
        glui.onevent({
            'type': 'mousedown',
            'clientX': x,
            'clientY': y
        });
        glui.onevent({
            'type': 'mouseup',
            'clientX': x,
            'clientY': y
        });
    };

    Control.create = async function create(id, template, parent, context) {
        var type = template.type;
        if (typeof glui[type] === 'function') {
            parent = parent || glui.screen;
            var ctrl = Reflect.construct(glui[type], [id, template, parent, context]);
            if (ctrl instanceof glui.Control) {
                if (ctrl instanceof glui.Container) {
                    var p = [];
                    for (var i in ctrl.template.items) {
                        if (ctrl.template.items.hasOwnProperty(i)) {
                            await glui.create(i, ctrl.template.items[i], ctrl);
                        }
                    }
                    //await Promise.all(p);
            
                } else if (ctrl instanceof glui.Image) {
                    await ctrl.load();
                }
                if (!ctrl.renderer && parent.renderer) {
                    await ctrl.setRenderer(parent.renderer.mode, parent.renderer.context);
                }
                await parent.add(ctrl);
                return ctrl;
            }
        }
        throw new Error(`Unknown control type ${type}`);
    };
    Control.fromNode = async function fromNode(node, type, context) {
        var id = node.getAttribute('id');
        var template = {
            'type': type.name,
            'style': {}
        };
        for (var i in node.attributes) {
            if (node.attributes.hasOwnProperty(i)) {
                var name = node.attributes[i].name;
                if (name == 'id') continue;
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
        var parent = node.parentNode.control || null;
        var control = await glui.create(id, template, parent, context);
        node.control = control;
        control.addHandlers();
        return control;
    };
    Control.getStyleTemplate = function getStyleTemplate() {
        return {
            'left': 0,
            'top': 0,
            'width': '2em',
            'height': '1.2em',
            'z-index': NaN,
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