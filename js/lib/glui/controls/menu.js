include('container.js');
include('label.js');

(function() {

    //#region MenuRenderer2d
    function MenuRenderer2d(control, context) {
        MenuRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.ContainerRenderer2d, MenuRenderer2d);
    //#endregion

    //#region Menu
    function Menu(id, template, parent, context) {
        Menu.base.constructor.call(this, id, template, parent, context);
        this.submenus = [];
        this.submenu = null;
        this.keys = {};
        this.parentMenu = null;
    }
    extend(glui.Container, Menu);

    Menu.prototype.getTemplate = function getTemplate() {
        var template = Menu.base.getTemplate.call(this);
        template.label = 'Menu';
        template.layout = Menu.layout.VERTICAL;
        template.style.spacing = '4px';
        template['item-template'] = glui.Label.prototype.getTemplate();
        return template;
    };
    Menu.prototype.applyTemplate = function applyTemplate(tmpl) {
        if (tmpl && tmpl.layout) tmpl.layout = tmpl.layout.toUpperCase();
        var template = Menu.base.applyTemplate.call(this, tmpl);
        if (!tmpl.style || !tmpl.style.width) delete this.style.width;
        if (!tmpl.style || !tmpl.style.height) delete this.style.height;
        this.label = template.label;
        this.layout = template.layout;
        if (typeof template.layout === 'string') {
            var layout = template.layout.toUpperCase();
            for (var i in glui.Menu.layout) {
                if (layout == i) {
                    this.layout = glui.Menu.layout[i];
                    break;
                }
            }
        }
        this.itemTemplate = this.template['item-template'] = mergeObjects(
            tmpl['item-template'], {
                'type':'Label',
                'style': {
                    'font': this.style.font,
                    'color': this.style.color,
                    'align': 'center middle',
                    'border': 'none',
                    'background-color': this.style['background-color']
                }
            }, mergeObjects.COMMON | mergeObjects.OVERWRITE);

        if (!tmpl.style || !tmpl.style['background-color']) delete this.style['background-color'];
        if (!tmpl.style || !tmpl.style['background-color']) delete this.style['background-color'];
        return template;
    };
    Menu.prototype.createRenderer = mode => mode == glui.Render2d ? new MenuRenderer2d() : 'MenuRenderer3d';
    Menu.prototype.setRenderer = function(mode, context) {
        Menu.base.setRenderer.call(this, mode, context);
        //this.spacing = this.renderer.convertToPixel(this.style.spacing);
    };
    Menu.prototype.getHandlers = function getHandlers() {
        var handlers = Menu.base.getHandlers();
        handlers.push(
            { name: 'command', topDown: false }
        );
        return handlers;
    };
    Menu.prototype.onmouseover = function onmouseover(e, ctrl) {
        if (this.submenu && ctrl.parent != this.submenu) {
            this.submenu.render();
        }
    };
    Menu.prototype.onmouseout = function onmouseout(e, ctrl) {
    };
    Menu.prototype.onclick = function onclick(e, ctrl) {
        if (this.open(ctrl)) {
        } else if (!(ctrl instanceof Menu) && ctrl.parent == this) {
            e.command = ctrl.command || ctrl.id;;
            this.callHandler('command', e);
        }

        // else if (!(ctrl instanceof Menu) && ctrl.parent == this) {
        //     e.command = ctrl.command || ctrl.id;
        //     this.callHandler('command', e);
        //     var menu = this;
        //     while (menu.parent.submenu == menu) menu = menu.parent;
        //     if (menu.submenu) menu.submenu.close();
        // }
    };
//     Menu.prototype.onfocus = function onfocus(e, ctrl) {
// console.log('focus', ctrl.parent?.id, ctrl.id)
//         Menu.base.onfocus.call(this, e);
//     };

    Menu.prototype.onblur = function onblur(e) {
        // close the menu
        var ctrl = e.control;
        var focused = glui.focusedControl;

        var menu = this.submenu || this;
        while (menu && menu != focused.parent) {
            menu.close();
            menu = menu.parentMenu;
        }

        return;
    };

    Menu.prototype.add = async function add(item, command, key) {
        command = command || item.label;
        var label = null;
        var template = this.itemTemplate;
        var isMenu = item instanceof glui.Menu;
        if (isMenu) {
            item.setVisible(false);
            this.submenus.push(item);
            item.parentMenu = this;
            label = item.label;
            //template.style = this.style;  //, template.style);
        } else if (item instanceof glui.Control) {
            if (key) this.keys[key] = item;
            Menu.base.add.call(this, item);
            return;
        } else {
            label = item.toString();
        }
        var ctrl = await glui.create(label, template, this);
        ctrl.command = command;
        if (isMenu) {
            ctrl.submenu = item;
        }
        var width = this.itemTemplate.style.width || this.renderer.getTextBoundingBoxes([label])[0][2];
        var height = this.itemTemplate.style.height || this.renderer.font.size + 'px';
        ctrl.size(width, height, true);
        ctrl.setVisible(this.style.visible);
        ctrl.value = label;
        return ctrl;
    };
    Menu.prototype.build = async function build(data) {
        var dataSource = this.readDataSource();
        if (dataSource) {
            data = dataSource;
        } else {
            if (data && Array.isArray(data.items)) {
                data = data.items;
            }
        }
        if (data) {
            // build from data
            for (var i=0; i<data.length; i++) {
                var item = data[i];
                if (Array.isArray(item.items)) {
                    var template = {
                        'type': 'Menu',
                        'label': data[i].label,
                        'key': data[i].key,
                        'layout': this.template['item-template'].layout,
                        'item-template': this.itemTemplate,
                        'style': clone(this.style),
                        'data-source': item.items,
                        'data-field': ''
                    };
                    template.style.width = this.template.style.width;
                    template.style.height = this.template.style.height;
                    if (this.parentMenu) template.label = template.label + ' ►';
                    var menu = await glui.create('menu'+data[i].label, template);
                    this.add(menu);
                    await menu.build();
                } else {
                    await this.add(item.label, item.command, item.key);
                }
            }
        }

        this.size(null, null, true);
    };

    Menu.prototype.size = function resize(width, height, isInner) {
        var maxWidth = 0, maxHeight = 0, count = 0;
        // get maxHeight and maxWidth
        for (var i=0; i<this.items.length; i++) {
            var item = this.items[i];
            if (!(item instanceof glui.Menu)) {
                if (maxHeight < item.height) maxHeight = item.height;
                if (maxWidth < item.width) maxWidth = item.width;
                count++;
            }
        }
        // resize and position menu items
        width = 0, height = 0;
        var spacing = this.renderer.spacing;
        if (this.layout == Menu.layout.HORIZONTAL) {
            height = maxHeight;
            width = count * (maxWidth + spacing[0]) - spacing[0];
        } else {
            width = maxWidth;
            height = count * (maxHeight + spacing[1]) - spacing[1];
        }
        glui.Control.prototype.size.call(this, width, height, true);

        var left = 0, top = 0;
        for (var i=0; i<this.items.length; i++) {
            var item = this.items[i];
            if (!(item instanceof glui.Menu)) {
                item.move(left, top);
                item.size(maxWidth, maxHeight);
                if (this.layout == Menu.layout.HORIZONTAL) {
                    left += spacing[0] + maxWidth;
                } else {
                    top += spacing[1] + maxHeight;
                }
            }
        }
    }
    // Menu.prototype.getBoundingBox = function getBoundingBox() {
    //     return [this.left, this.top, this.width, this.height];
    // };

    Menu.prototype.getControlAt = function getControlAt(cx, cy, recursive) {
        var res = null;
        if (this.submenu) {
            res = this.submenu.getControlAt(cx, cy, recursive);
        }
        if (!res) {
            res = Menu.base.getControlAt.call(this, cx, cy, recursive);
        }
        return res;
    };

    Menu.prototype.open = function open(item) {
        var result = false;
        if (item.submenu) {
            var sm = item.submenu;
            this.submenu = sm;
            sm.setVisible(true);
            var cx = item.left, cy = item.top;
            if (this.layout == glui.Menu.layout.HORIZONTAL) {
                cy += item.height;
            } else {
                cx += item.width;
            }
            // cx += item.offsetLeft - item.left;
            // cy += item.offsetTop - item.top;
            // if (cy < 0) cy = 0;
            // else if (cy + sm.height > glui.height) cy = glui.height - sm.height;
            // if (cx < 0) cx = 0;
            // else if (cx + sm.width > glui.width) cx = glui.width - sm.width;
            sm.move(cx, cy, glui.Control.order.TOP);
            //glui.setFocus(sm);
            sm.render();
            result = true;
        }

        // var result = false;
        // var submenu = item.submenu;
        // if (submenu.parent == this) {
        //     // todo: check access
        //     result = true;
        //     submenu.move(cx - item.left + item.offsetLeft, cy - item.top + item.offsetTop, glui.Control.order.TOP);
        //     submenu.setVisible(true);
        //     glui.setFocus(submenu);
        //     this.submenu = submenu;
        //     submenu.render();
        // }
        return result;
    };
    Menu.prototype.close = function close() {
        if (this.submenu) {
            this.submenu.close();
            this.submenu = null;
        }
        if (this.parentMenu != null) {
            this.setVisible(false);
            //glui.setFocus(this.parent);
        }
        glui.repaint();
    };

    Menu.layout = {
        HORIZONTAL: 0,
        VERTICAL: 1
    };

    glui.schema.addType(new EnumType('MenuLayout', null, { 'values':Object.keys(Menu.layout) }));
    glui.buildType({
        'name':'Menu',
        'type':'Container',
        'attributes': {
            'label':    { 'type':'string', 'isRequired':false },
            'layout':   { 'type':'MenuLayout', 'isRequired':false, 'default':Menu.layout.HORIZONTAL },
            'item-template': {'type':'Control', 'isRequired':false, 'default':glui.Label.prototype.getTemplate() },
            'style':    {
                'type': {
                    'name':'MenuStyleType',
                    'type':'ControlStyle',
                    'attributes': {
                        'spacing': { 'type':'string', 'isRequired':false, 'default':'1px' }
                    }
                },
                'isRequired':false
            }
        }
    });

    //#endregion

    publish(Menu, 'Menu', glui);
    publish(MenuRenderer2d, 'MenuRenderer2d', glui);
})();