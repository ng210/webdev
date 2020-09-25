include('textbox.js');
include('grid.js');
include('renderer2d.js');

(function() {
    function ComboboxRenderer2d(control, context) {
        ComboboxRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, ComboboxRenderer2d);

    ComboboxRenderer2d.prototype.renderControl = function renderControl() {
        var ctrl = this.control;
        ctrl.selector.move(this.border.width, this.border.width);
        ctrl.selector.renderer.renderControl();
        if (ctrl.isOpen) {
            ctrl.list.move(this.border.width, 2*this.border.width + ctrl.selector.height);
            ctrl.list.renderer.renderControl();
        }
    };

    function Combobox(id, template, parent, context) {
        this.selector = glui.Control.create(`${id}#selector`, {'type':'Grid'}, this);
        this.list = glui.Control.create(`${id}#list`, {'type':'Grid'}, this);
        this.value = null;
        Combobox.base.constructor.call(this, id, template, parent, context);
        this.add(this.selector);
        this.add(this.list);
        this.isOpen = false;
    }
    extend(glui.Container, Combobox);

    Combobox.prototype.createRenderer = mode => mode == glui.Render2d ? new ComboboxRenderer2d() : 'ComboboxRenderer3d';

    Combobox.prototype.setRenderer = function(mode, context) {
        Combobox.base.setRenderer.call(this, mode, context);
        this.selector.setRenderer(mode, context);
        this.list.setRenderer(mode, context);
    };
    Combobox.prototype.getTemplate = function getTemplate() {
        var template = Combobox.base.getTemplate.call(this);
        template.type = 'Combobox';
        template.readonly = true;
        template.rows = 0;
        template.values = null;
        template['key-field'] = null;
        template['row-template'] = null;
        return template;
    };
    Combobox.prototype.applyTemplate = function applyTemplate(tmpl) {
        Combobox.base.applyTemplate.call(this, tmpl);
        this.template.title = '';
        this.isReadonly = !!this.template.readonly;
        this.keyField = this.template['key-field'];
        this.valueList = getObjectAt(this.template['values']);
        var template = mergeObjects(this.template);
        delete template['data-source'];
        delete template['data-field'];
        delete template.style.height;
        template.style.border = 'none';
        this.list.applyTemplate(template);
        this.list.style.width = '100%';
        this.list.style['z-index'] = 100;
        template.rows = 1;
        this.selector.applyTemplate(template);
        this.selector.style.width = '100%';
        if (this.dataSource) {
            this.dataBind();
            var key = this.getValue();
            // get item with key
            this.selectedIndex = -1;
            this.selectedItem = null;
            this.selectByKey(key);
        }

        if (this.valueList) {
            this.list.dataBind(this.valueList);
        }

        return template;
    };
    Combobox.prototype.getHandlers = function getHandlers() {
        var handlers = Combobox.base.getHandlers();
        handlers.push(
            { name: 'mousedown', topDown: true },
            { name: 'mouseup', topDown: false },
            { name: 'keydown', topDown: true },
            { name: 'keyup', topDown: false },
            { name: 'change', topDown: false }
        );
        return handlers;
    };
	Combobox.prototype.getValue = function getValue() {
		return this.dataSource ? this.dataSource[this.dataField] : this.value;
    };
	Combobox.prototype.setValue = function setValue(value) {
        var oldValue = this.getValue();
        this.dataSource ? this.dataSource[this.dataField] = value : this.value = value;
        return oldValue;
	};
	Combobox.prototype.getBoundingBox = function getBoundingBox() {
        this.selector.getBoundingBox();
        this.height = this.selector.height + 2*this.renderer.border.width;
        // if (this.isOpen) {
        //     this.list.getBoundingBox();
        //     this.height += this.list.height + this.renderer.border.width;
        // }
        this.width = this.selector.width + 2*this.renderer.border.width;
        return [this.left, this.top, this.width, this.height];
    };
    Combobox.prototype.render = function render() {
        if (this.renderer && this.style.visible) {
            this.getBoundingBox();
            var height = this.height;
            if (this.isOpen) {
                this.list.getBoundingBox();
                this.height += this.list.height + this.renderer.border.width;
            }
            this.renderer.render();
            this.height = height;
        }
    };    
    Combobox.prototype.getControlAt = function getControlAt(cx, cy) {
        var res = null;
        var ctrl = this.selector;
        for (var i=0; i<2; i++) {
            if (ctrl.style.visible && ctrl.left < cx  && cx < ctrl.left + ctrl.width && ctrl.top < cy  && cy < ctrl.top + ctrl.height) {
                res = !ctrl.items ? ctrl : ctrl.getControlAt(cx, cy);
                break;
            }
            if (this.isOpen) {
                ctrl = this.list;
            } else {
                break;
            }
        }
		return res;
    };
    Combobox.prototype.open = function open() {
        this.isOpen = true;
        this.list.setVisible(true);
        this.render();
    };
    Combobox.prototype.close = function close() {
        this.isOpen = false;
        this.list.setVisible(false);
        glui.repaint();
    };
    Combobox.prototype.selectByKey = function select(key) {
        for (var i in this.valueList) {
            if (this.valueList.hasOwnProperty(i) && this.valueList[i][this.keyField] == key) {
                this.selectedIndex = i;
                this.selectedItem = this.valueList[i];
                for (var i=0; i<this.selector.columnCount; i++) {
                    this.selector.rows[0].cells[i].setValue(this.selectedItem[this.selector.columnKeys[i]]);
                }
                this.setValue(key);
                if (this.selector.renderer) this.selector.renderer.renderControl();
                break;
            }
        }
    };
	Combobox.prototype.onmouseover = function mouseover(e, ctrl) {
		;
	};
	Combobox.prototype.onmouseout = function mouseover(e, ctrl) {
		;
    };
	Combobox.prototype.onblur = function onblur(e, control) {
        var path = getObjectPath(e.control, 'parent', this);
        debugger
        if (path[0] != this) {
            this.close();
            glui.repaint();
        }
        return true;
    };
    Combobox.prototype.onclick = function onclick(e, ctrl) {
        var row = e.control.parent;
        if (row.parent == this.selector) {
            if (this.focus && this.focus != e.control) {
                //this.focus.callHandler('blur', e);
            }
            if (!this.isOpen) {
                this.open();
            }
            this.focus = e.control;
        } else if ((row.parent == this.list)) {
            this.selectByKey(row.cells[this.keyField].getValue());
            glui.Control.focused = this;
            e.control.callHandler('blur', e);
            this.close();
            glui.Control.focused = this.focus;
        }
    };

    publish(Combobox, 'Combobox', glui);
})();