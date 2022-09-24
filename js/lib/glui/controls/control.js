include('icontrol.js');
include('/lib/data/datalink.js');

const DEBUG_EVENT = 'click_|mouseout_|mouseover_';

(function() {

    function Control(id, template, parent, context) {
        this.id = id;
        this.parent = parent || null;
        this.context = context || this.parent;
        this.path = null;
        this.template = null;
        this.type = glui.schema.types.get(this.constructor.name);   // default type
        this.style = {};
        this.renderer = null;
        this.renderer2d = null;
        this.renderer3d = null;

        this.isHightlighted = false;
        this.isFocused = false;

        this.handlers = {};
        // cache for left and top
        this.left_ = 0;
        this.top_ = 0;

        this.offsetLeft = -1;
        this.offsetTop = -1;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.scrollRangeX = [0, 0];
        this.scrollRangeY = [0, 0];
        this.minScrollLeft = 0;
        this.maxScrollLeft = 0;
        this.minScrollTop = 0;
        this.maxScrollTop = 0;
        // this.innerHeight = 0;
        // this.innerWidth = 0;
        this.width = -1;
        this.height = -1;

        this.dataSource = null;
        this.dataField = '';
        this.noBinding = false;

        glui.schema.types.get(this.constructor.name).setType(this);
        this.applyTemplate(template);
    }
    extend(glui.IControl, Control);

    Object.defineProperties(Control.prototype, {
        'left': {
            enumerable: true,
            configurable: false,
            get: function () {
                var left = this.renderer.convertToPixel(this.offsetLeft);
                if (this.parent) {
                    left += this.parent.left + this.parent.renderer.padding[0] + this.parent.renderer.border.width;
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
                    top += this.parent.top + this.parent.renderer.padding[1] +  this.parent.renderer.border.width;
                }
                this.top_ = top;
                return top;
            }
        },
        'innerWidth': {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.width - 2*(this.renderer.padding[0] + this.renderer.border.width);
            }
        },
        'innerHeight': {
            enumerable: true,
            configurable: false,
            get: function () {
                return this.height - 2*(this.renderer.padding[1] + this.renderer.border.width);
            }
        },
    });

    Control.prototype.destroy = function destroy() {
        delete this.renderer;
    };
    Control.prototype.setVisible = function setVisible(visible) {
        this.style.visible = visible;
    };
    Control.prototype.getTemplate = function getTemplate() {
        var type = glui.schema.types.get(this.constructor.name);
        return type.createDefaultValue(null, true);
    };
    Control.prototype.applyTemplate = function(tmpl) {
        this.template = this.getTemplate();
        var styleType = this.type.attributes.get('style').type;
        if (this.parent && this.parent.style) {
            // merge parent style into default
            styleType.merge(this.parent.style, this.template.style, self.mergeObjects.OVERWRITE);
        }
        if (tmpl) {
            var res = glui.schema.validate(tmpl, this.type);
            if (res.length > 0) {
                Dbg.prln(res.join('\n'));
            }
            this.type.merge(tmpl, this.template, self.mergeObjects.OVERWRITE);
        }
        styleType.merge(this.template.style, this.style, self.mergeObjects.OVERWRITE);

        if (!this.id) {
            this.id = this.template.id;
        }
        this.path = this.parent && this.parent != glui.screen ? `${this.parent.path}.${this.id}` : this.id;
        this.type = this.template.type;
        this.disabled = this.template.disabled;
        var source = this.template['data-source'];
        if (!source && this.parent) {
            source = this.parent.dataSource;
        }
        this.dataField = this.template['data-field'];
        this.noBinding = this.template['no-binding'];
        if (source && typeof source === 'string') {
            while (true) {
            // move to glui.js <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                if (glui.screen && glui.screen.items) {
                    var ctrl = glui.screen.items.find(x => x.id == source);
                    if (ctrl) {
                        source = ctrl;
                        break;
                    }
                }
                if (this.context && this.context[source]) {
                    source = this.context[source];
                    break;
                }
                source = window[source];
                break;
            }
            // move to glui.js <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        }
        this.dataBind(source);
        //this.dataSource = source;
        this.zIndex = parseInt(this.style['z-index']) || 0;
        //this.label = null; ???
        this.scrollRangeX[1] = this.template['scroll-x-min'];
        this.scrollRangeX[0] = this.template['scroll-x-max'];
        this.scrollRangeY[0] = this.template['scroll-y-min'];
        this.scrollRangeY[1] = this.template['scroll-y-max'];
        return this.template;
	};
    Control.prototype.dataBind = function dataBind(source, field) {
        if (!this.noBinding) {
            if (source) {
                if (this.dataSource && DataLink.is(this.dataSource)) {
                    DataLink.removeHandler(this.dataSource, h => h.target == this);
                    DataLink.removeHandler(this, h => h.target == this.dataSource);
                }
                this.dataSource = DataLink(source);
            }
            if (this.dataSource) {
                this.dataField = field || this.dataField;
                DataLink.addField(this.dataSource, this.dataField);
            }
        }
        return this.dataSource;
    };
    Control.prototype.readDataSource = function readDataSource() {
        return this.dataField ? this.dataSource[this.dataField] : this.dataSource;
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
            while (ctrl != glui.screen && rect != null) {
                rect = Fn.intersectRect(rect, ctrl.getBoundingBox());
                ctrl = ctrl.parent;
                // if (ctrl == glui.screen) break;
                // // if (!(ctrl instanceof glui.Menu)) {
                // //     rect = Fn.intersectRect(rect, ctrl.getBoundingBox());
                // // }
                // if (!rect) break;
            }
        }
        return rect;
    };
    Control.prototype.getControlAt = function getControlAt(x, y, recursive) {
        var rect = this.getBoundingBox();
        x -= rect[0];
        y -= rect[1];
        // var min = x * y;
        // var max = (rect[2] - x) * (rect[3] - y);
        // return this.style.visible && (min * max > 0);
        return this.style.visible && 0 <= x && x < rect[2] && 0 <= y && y < rect[3] ? this : null;
    };    
    Control.prototype.size = function(width, height, isInner) {
        if (this.renderer) {
            if (width == null) width = /*this.width ||*/ this.style.width;
            if (height == null) height = /*this.height ||*/ this.style.height;
            if (width) this.renderer.setWidth(width, isInner);
            if (height == undefined) height = width;
            if (height) this.renderer.setHeight(height, isInner);
            glui.markRepaint();
            //this.parent ? this.parent.render() : this.render();
        }
    };
    Control.prototype.move = function move(dx, dy, order) {
        if (dx != null) this.offsetLeft = dx;
        if (dy != null) this.offsetTop = dy;
        if (order && Array.isArray(this.parent.items)) {
            var parent = null;
            var isFirst = true;
            switch (order) {
                case glui.Control.order.TOP:
                    parent = this.parent;
                    isFirst = true;
                    break;
                case glui.Control.order.BOTTOM:
                    parent = this.parent;
                    isFirst = false;
                    break;
            }
            if (parent) {
                parent.remove(this);
                isFirst ? parent.items.push(this) : parent.items.unshift(this);
            }
        }
        this.parent ? this.parent.render() : this.render();
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

    //#region event handling
    Control.prototype.getHandlers = function getHandlers() {
        return [
            { name: 'mouseover', topDown: true },
            { name: 'mouseout', topDown: false },
            { name: 'click', topDown: true },
            { name: 'dblclick', topDown: true },
            { name: 'focus', topDown: true },
            { name: 'blur', topDown: false }
        ];
    };
    Control.prototype.addHandler = function addHandler(eventName, obj, handler) {
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
            if (typeof handler === 'function') {
                this.addHandler(eventName, node, handler);
            }
        }
        if (eventName.match(DEBUG_EVENT) && this.handlers[eventName]) debug_(`${this.id}.${eventName} = ${this.handlers[eventName].map(x => x.obj.id + '::' + x.fn.name)}`, 1);
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
                    if (eventName.match(DEBUG_EVENT)) debug_(` - ${handler.obj.type}::[${handler.obj.id}]::${handler.fn.name}`, 0);
                    var isCancelled = Boolean(await handler.fn.call(handler.obj, event, control));
                    if (isCancelled) return true;
                }
                break;
            } else {
                control = control.parent;
            }
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
    //#endregion

    Control.prototype.setRenderer = function setRenderer(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = this.createRenderer(mode);
                this.renderer = this.renderer2d;
                this.renderer2d.initialize(this, context);
            } else {
                this.renderer = this.renderer2d;
            };
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = this.createRenderer(mode);
                this.renderer = this.renderer3d;
                this.renderer3d.initialize(this, context);
            } else {
                this.renderer = this.renderer3d;
            }
        }
       
        return this.renderer;
    };
    Control.prototype.isDescendant = function isDescendant(ancestor) {
        var path = getObjectPath(this, 'parent', ancestor);
        return path[0] == ancestor;
    };
    Control.prototype.applyStyle = async function applyStyle(style)  {
        var isChanged = false;
        if (style) {
            for (var p in style) {
                if (Object.hasOwn(this.style, p)) {
                    this.style[p] = style[p];
                    isChanged = true;
                }
            }
        }
        if (isChanged) await this.renderer.initialize();
    };

    // simulate click event
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

    //#region Static methods
    Control.create = function create(id, template, parent, context) {
        var type = template.type;
        if (typeof glui[type] === 'function') {
            parent = parent && parent instanceof glui.Container ? parent : glui.screen;
            var ctrl = Reflect.construct(glui[type], [id, template, parent, context]);
            if (ctrl instanceof glui.Control) {
                if (!ctrl.renderer && parent.renderer) {
                    ctrl.setRenderer(parent.renderer.mode, parent.renderer.context);
                }
                if (ctrl instanceof glui.Container) {
                    var items = ctrl instanceof glui.Dialog == false ? template.items : ctrl.template.items;
                    for (var i=0; i<ctrl.template.items.length; i++) {
                        if (ctrl.template.items.hasOwnProperty(i)) {
                            glui.create(ctrl.template.items[i].id || `${ctrl.id}#${i}`, items[i], ctrl);
                        }
                    }
// } else if (ctrl instanceof glui.Image) {
//     ctrl.load();
                }
                // if (!ctrl.renderer && parent.renderer) {
                //     await ctrl.setRenderer(parent.renderer.mode, parent.renderer.context);
                // }
                parent.add(ctrl);
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
        return glui.schema.types.get('ControlStyle').default;
        // return {
        //     'align': 'center middle',
        //     'background-color': 'transparent',
        //     'background-image': 'none',
        //     'border': 'silver 2px solid',
        //     'color': 'black',
        //     'font': 'Arial 12 normal',
        //     'left': '0',
        //     'height': 'auto',
        //     'top': '0',
        //     'visible': true,
        //     'width': 'auto',
        //     'z-index': 0
        // };
    };
    //glui.schema.types.get('ControlStyle').ctor = Control.getStyleTemplate;

    glui.buildType({
        'name':'Control',
        'ref':'id',
        'attributes': {
            'data-field':   { 'type': 'string', 'isRequired':false, 'default': '' },
            'data-source':  { 'type': 'void', 'isRequired':false, 'default': null },
            'disabled':     { 'type': 'bool', 'isRequired':false, 'default': false },
            'id':           { 'type': 'string', 'isRequired':false, 'default':'' },
            // 'label':        { 'type': 'string', 'isRequired':false, 'default':'lbl' },
            'no-binding':   { 'type': 'bool', 'isRequired':false, 'default': false },
            'scroll-x-min': { 'type':  'int', 'isRequired':false, 'default': 0 },
            'scroll-x-max': { 'type':  'int', 'isRequired':false, 'default': 0 },
            'scroll-y-min': { 'type':  'int', 'isRequired':false, 'default': 0 },
            'scroll-y-max': { 'type':  'int', 'isRequired':false, 'default': 0 },
            'style':        {
                'type': {
                    'name':'ControlStyle',
                    'attributes': {
                        'align':            { 'type':'string', 'isRequired':false, 'default':'center middle' },
                        'background-color': { 'type':'string', 'isRequired':false, 'default':'transparent' },
                        'background-image': { 'type':'string', 'isRequired':false, 'default':'none' },
                        'background-repeat':{ 'type':'string', 'isRequired':false, 'default':'none' },
                        'border':           { 'type':'string', 'isRequired':false, 'default':'silver 2px solid' },
                        'color':            { 'type':'string', 'isRequired':false, 'default':'black' },
                        'font':             { 'type':'string', 'isRequired':false, 'default':'Arial 12 normal' },
                        'height':           { 'type':'string', 'isRequired':false, 'default':'auto' },
                        'left':             { 'type':'string', 'isRequired':false, 'default':'0' },
                        'padding':          { 'type':'string', 'isRequired':false, 'default':'0' },
                        'top':              { 'type':'string', 'isRequired':false, 'default':'0' },
                        'visible':          { 'type':'bool',   'isRequired':false, 'default':true },
                        'width':            { 'type':'string', 'isRequired':false, 'default':'auto' },
                        'z-index':          { 'type':'int',    'isRequired':false, 'default':0 }
                    }
                },
                'isRequired':false },
            'type': { 'type': 'typeName' }
        }
    });
    //#endregion

    Control.order = {
        'TOP': 1,
        'BOTTOM': 2
    };

    publish(Control, 'Control', glui);
})();