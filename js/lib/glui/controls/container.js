include('control.js');

(function() {

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
        delete this.items
    };
    Container.prototype.add = function add(ctrl) {
        var ix = this.items.findIndex(x => x.zIndex < ctrl.zIndex);
        if (ix != -1) {
            this.items.splice(ix, 0, ctrl);
        } else {
            this.items.push(ctrl);
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
                control.destroy();
            }
        }
    };
    Container.prototype.setVisible = function setVisible(visible) {
        Container.base.setVisible.call(this, visible);
        for (var i=0; i<this.items.length; i++) {
            this.items[i].setVisible(visible);
        }
    };
    Container.prototype.createRenderer = mode => mode == glui.Render2d ? new glui.Renderer2d() : 'glui.Renderer3d';
    Container.prototype.setRenderer = async function setRenderer(mode, context) {
        await Container.base.setRenderer.call(this, mode, context);
        var arr = [];
        for (var i=0; i<this.items.length; i++) {
            arr.push(await this.items[i].setRenderer(mode, context));
        }
        await Promise.all(arr);
    };
    Container.prototype.render = function render() {
        for (var i=0; i<this.items.length; i++) {
            this.items[i].render();
        }
    };
    Container.prototype.getControlAt = function getControlAt(cx, cy, recursive) {
        var res = null;
		for (var i=0; i<this.items.length; i++) {
            var ctrl = this.items[i];
            if (ctrl.style.visible && ctrl.left < cx  && cx < ctrl.left + ctrl.width && ctrl.top < cy  && cy < ctrl.top + ctrl.height) {
                res = ctrl;
                if (recursive && ctrl.items && ctrl.items.length > 0) {
                    res = ctrl.getControlAt(cx, cy, true);
                }
				break;
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
            if (item.items) {
                containers.push(items);
            }
        }
        // check containers
        for (var i=0; i<containers.length; i++) {
            if ((res = containers.getControlById(id)) != null) break;
        }
        return res;
    },

    public(Container, 'Container', glui);
})();