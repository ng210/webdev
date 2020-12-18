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
        tmpl.items = {};
        return tmpl;
    };
    Container.prototype.add = async function add(ctrl) {
        // if (ctrl.parent != this) {
        //     if (ctrl.parent) ctrl.parent.remove(ctrl);
        var zIndex = parseInt(ctrl.template.style['z-index']);
        if (isNaN(zIndex)) {
            ctrl.zIndex = this.zIndex + 100;
        }
        var ix = this.items.findIndex(x => x.zIndex < ctrl.zIndex);
        if (ix != -1) {
            this.items.splice(ix, 0, ctrl);
        } else {
            this.items.push(ctrl);
        }

        if (this.renderer) {
            await ctrl.setRenderer(this.renderer.mode, this.renderer.context);
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
        for (var i=0; i<this.items.length; i++) {
            if (this.items[i] == control) {
                this.items.splice(i, 1);
            }
        }
    };
    Container.prototype.setVisible = function setVisible(visible) {
        Container.base.setVisible.call(this, visible);
        for (var i=0; i<this.items.length; i++) {
            this.items[i].setVisible(visible);
        }
    };
	Container.prototype.dataBind = function(source, field) {
        Container.base.dataBind.call(this, source, field);
        var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
        for (var i=0; i<this.items.length; i++) {
            this.items[i].dataBind(dataSource[i]);
        }
	};
    Container.prototype.createRenderer = mode => mode == glui.Render2d ? new ContainerRenderer2d() : 'ContainerRenderer3d';
    Container.prototype.setRenderer = async function setRenderer(mode, context) {
        await Container.base.setRenderer.call(this, mode, context);
        var arr = [];
        for (var i=0; i<this.items.length; i++) {
            arr.push(await this.items[i].setRenderer(mode, context));
        }
        await Promise.all(arr);
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

    publish(Container, 'Container', glui);
    publish(ContainerRenderer2d, 'ContainerRenderer2d', glui);
})();