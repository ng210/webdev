include('control.js');
include('renderer2d.js');

(function() {

    function ContainerRenderer2d() {
        ContainerRenderer2d.base.constructor.call(this);
    }
    extend(glui.Renderer2d, ContainerRenderer2d);

    ContainerRenderer2d.prototype.renderControl = function renderControl() {
        var ctrl = this.control;
        for (var i=0; i<ctrl.items.length; i++) {
            ctrl.items[i].renderer.render();
        }
    };

    ContainerRenderer2d.prototype.getBestSizeInPixel = function getBestSizeInPixel(isInner) {
        var w = 0, h = 0;
        for (var i=0; i<this.control.items.length; i++) {
            var item = this.control.items[i];
            w = Math.max(w, item.offsetLeft + item.width);
            h = Math.max(h, item.offsetTop + item.height);
        }
        return [w, h];
    };

    function Container(id, template, parent, context) {
        this.items = [];
        Container.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Control, Container);

    Container.prototype.destroy = function destroy() {
        Container.base.destroy.call(this);
        for (var i=0; i<this.items.length; i++) {
            this.items[i].destroy();
        }
        delete this.items;
    };
    Container.prototype.getHandlers = function getHandlers() {
        var handlers = Container.base.getHandlers.call(this);
        handlers.push(
            { name: 'mousemove', topDown: true },
            { name: 'dragging', topDown: true },
            { name: 'mousedown', topDown: true },
            { name: 'mouseup', topDown: true },
            { name: 'keydown', topDown: true },
            { name: 'keyup', topDown: true }
        );
        return handlers;
    };
    Container.prototype.getTemplate = function getTemplate() {
        var tmpl = Container.base.getTemplate.call(this);
        tmpl.style['background-color'] = 'transparent';
        tmpl.style.border = 'none';
        tmpl.items = [];
        return tmpl;
    };
    Container.prototype.applyTemplate = function(tmpl) {
        if (tmpl && tmpl.items) {
            for (var i=0; i<tmpl.items.length; i++) {
                var objType = glui.schema.types.get(tmpl.items[i].type);
                objType.setType(tmpl.items[i]);
            }
        }
        return Container.base.applyTemplate.call(this, tmpl);
    };
    Container.prototype.add = function add(ctrl) {
        if (ctrl.parent != null && ctrl.parent != this) {
            ctrl.parent.remove(ctrl);
            ctrl.parent = this;
        }
        var zIndex = parseInt(ctrl.style['z-index']);
        if (isNaN(zIndex)) {
            ctrl.zIndex = this.zIndex + 100;
        }
        var ix = this.items.findIndex(x => x.zIndex < ctrl.zIndex);
        if (ix != -1) {
            this.items.splice(ix, 0, ctrl);
        } else {
            this.items.push(ctrl);
        }

        // apply container style on item
        var styleType = glui.schema.types.get(ctrl.type).attributes.get('style').type;
        styleType.merge(this.style, ctrl.style);

        if (this.renderer) {
            ctrl.setRenderer(this.renderer.mode, this.renderer.context);
        }
        return ctrl;
    };
    Container.prototype.replace = function replace(item, newItem) {
        var ix = this.items.findIndex(x => x == item);
        var result = null;
        if (ix != -1) {
            result = this.items[ix];
            this.items[ix] = newItem;
        }
        return result;
    };
    Container.prototype.remove = function remove(control) {
        var removed = false;
        for (var i=0; i<this.items.length; i++) {
            if (this.items[i] == control) {
                this.items.splice(i, 1);
                removed = true;
                break;
            }
        }
        return removed;
    };
    // Container.prototype.render = function render() {
    //     glui.markForRendering(this);
    //     // for (var i=0; i<this.items.length; i++) {
    //     //     glui.markForRendering(this.items[i]);
    //     // }
    // };
    Container.prototype.setVisible = function setVisible(visible) {
        Container.base.setVisible.call(this, visible);
        for (var i=0; i<this.items.length; i++) {
            this.items[i].setVisible(visible);
        }
    };
    Container.prototype.size = function size(width, height, isInner) {
        Container.base.size.call(this, width, height, isInner);
        for (var i=0; i<this.items.length; i++) {
            this.items[i].size(null, null, isInner);
        }
    };
	Container.prototype.dataBind = function(source, field) {
        if (Container.base.dataBind.call(this, source, field)) {
            var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
            var i = 0, j = 0;
            var keys = Object.keys(dataSource);
            for (var i=0; i<this.items.length; i++) {
                if (!this.items[i].noBinding) {
                    this.items[i].dataBind(dataSource, this.items[i].dataField || keys[j].toString());
                    j++;
                }
            }
        }
	};
    Container.prototype.createRenderer = mode => mode == glui.Render2d ? new ContainerRenderer2d() : 'ContainerRenderer3d';
    Container.prototype.setRenderer = function setRenderer(mode, context) {
        Container.base.setRenderer.call(this, mode, context);
        // var arr = [];
        // for (var i=0; i<this.items.length; i++) {
        //     arr.push(await this.items[i].setRenderer(mode, context));
        // }
        // await Promise.all(arr);
        for (var i=0; i<this.items.length; i++) {
            this.items[i].setRenderer(mode, context);
        }
    };
    Container.prototype.getControlAt = function getControlAt(cx, cy, recursive) {
        var res = Container.base.getControlAt.call(this, cx, cy);
        if (res && recursive) {
            for (var i=this.items.length-1; i>=0; i--) {
                var ctrl = this.items[i].getControlAt(cx, cy, recursive);
                if (ctrl) {
                    res = ctrl;
                    break;
                }
            }
        }
        return res;
    };

    Container.prototype.getControlById = function getControlById(id) {
        var res = null;
        var containers = [];
        // check non-container items first
        for (var i=0; i<this.items.length; i++) {
            var item = this.items[i];
            if (item.id == id) {
                res = item;
                break;
            }
            if (Array.isArray(item.items) && item.items.length > 0) {
                containers.push(item);
            }
        }
        // check containers
        for (var i=0; i<containers.length; i++) {
            if ((res = containers[i].getControlById(id)) != null) break;
        }
        return res;
    };

    Container.prototype.onmouseover = function onmouseover(e) {
//debug_(`Container.onmouseover: ${e.control.id} => ${this.id}`, 0);
        if (!e.control || !e.control.isDescendant(this)) this.highlight();
    };
    Container.prototype.onmouseout = function onmouseout(e) {
//debug_(`Container.onmouseout: ${this.id} => ${e.control.id}`, 0);
        if (!e.control || !e.control.isDescendant(this)) this.dehighlight();
    };

    glui.buildType({
        'name':'Container',
        'type':'Control',
        'attributes': {
            'items': { 'type': { 'type':'list', 'elemType':'Control' }, 'isRequired':false, 'default': [] }
        }
    });

    publish(Container, 'Container', glui);
    publish(ContainerRenderer2d, 'ContainerRenderer2d', glui);
})();