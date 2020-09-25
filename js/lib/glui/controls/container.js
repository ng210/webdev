include('control.js');

(function() {

    function ContainerRenderer2d() {
        ContainerRenderer2d.base.constructor.call(this);
    }
    extend(glui.Renderer2d, ContainerRenderer2d);

    ContainerRenderer2d.prototype.renderControl = function renderControl() {
        var ctrl = this.control;
        for (var i=0; i<ctrl.items.length; i++) {
            ctrl.items[i].render();
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
        delete this.items
    };
    Container.prototype.getTemplate = function getTemplate() {
        var tmpl = Container.base.getTemplate.call(this);
        tmpl.style.background = 'none';
        tmpl.style.border = 'none';
        return tmpl;
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
    // Container.prototype.render = function render() {
    //     for (var i=0; i<this.items.length; i++) {
    //         this.items[i].render();
    //     }
    // };
    Container.prototype.move = function move(dx, dy) {
		Container.base.move.call(this, dx, dy);
		// for (var i=0; i<this.items.length; i++) {
		// 	this.items[i].move(0, 0);
		// }
	};
    Container.prototype.getControlAt = function getControlAt(cx, cy, recursive) {
        var res = null;
        cx -= this.renderer.border.width + this.offsetLeft;
        cy -= this.renderer.border.width + this.offsetTop;
		for (var i=0; i<this.items.length; i++) {
            var ctrl = this.items[i];
            if (ctrl.style.visible && ctrl.offsetLeft < cx  && cx < ctrl.offsetLeft + ctrl.width && ctrl.offsetTop < cy  && cy < ctrl.offsetTop + ctrl.height) {
                res = ctrl;
                if (recursive && Array.isArray(ctrl.items) && ctrl.items.length > 0) {
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

    publish(Container, 'Container', glui);
})();