include('container.js');

(function() {
    //#region DialogRenderer2d 
    function DialogRenderer2d(control, context) {
        DialogRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.ContainerRenderer2d, DialogRenderer2d);

    DialogRenderer2d.prototype.renderControl = function renderControl() {
        var ctrl = this.control;
        // draw titlebar
        if (ctrl.titlebar) {
            ctrl.titlebar.renderer.render();
        }
        ctrl.body.renderer.render();
    };
    //#endregion

    //#region Dialog
    function Dialog(id, template, parent, context) {
        Dialog.base.constructor.call(this, id, template, parent, context);
        this.isActive = false;
        this.isModal = false;
        this.showTitlebar = true;
        this.titlebar = null;
        this.body = null;
    }
    extend(glui.Container, Dialog);

    Object.defineProperties(Dialog.prototype, {
        'items': {
            enumerable: true,
            configurable: false,
            get: function() { return this.body ? this.body.items : []; }
        }
    });

    Dialog.prototype.getTemplate = function getTemplate() {
        var template = Dialog.base.getTemplate.call(this);
        template.title = 'dialog';
        template.style = glui.Control.getStyleTemplate();
        template['title-style'] = {};
        template['body-style'] = {};
        template.init = null;
        //template.items .push(glui.Dialog.Template.titlebar, glui.Dialog.Template.body);
        return template;
    };
    Dialog.prototype.applyTemplate = function applyTemplate(tmpl) {
        this.template = Dialog.base.applyTemplate.call(this, tmpl);
        var titlebar = clone(glui.Dialog.Template.titlebar);
        var body = clone(glui.Dialog.Template.body);
        this.template.items = [titlebar, body];
        glui.schema.types.get(titlebar.type).setType(titlebar);
        glui.schema.types.get(body.type).setType(body);

        var styleType = glui.schema.types.get('DialogItemStyle');
        // apply titlebar-style on titlebar and its items
        styleType.merge(this.style, titlebar.style, self.mergeObjects.OVERWRITE);
        styleType.merge(this.template['title-style'], titlebar.style, self.mergeObjects.OVERWRITE);
        for (var i=0; i<titlebar.items.length; i++) {
            var item = titlebar.items[i];
            styleType.merge(titlebar.style, item.style, self.mergeObjects.OVERWRITE);
        }

        // apply body-style on body and its items
        styleType.merge(this.style, body.style, self.mergeObjects.OVERWRITE);
        styleType.merge(this.template['body-style'], body.style, self.mergeObjects.OVERWRITE);
        for (var i=0; i<tmpl.items.length; i++) {
            var item = clone(tmpl.items[i]);
            styleType.merge(body.style, item.style);
            item.dialog = this;
            body.items.push(item);
        }
        this.oninit = typeof this.template.init === 'function' ? this.template.init : null;
        return this.template;
    };
    Dialog.prototype.createRenderer = mode => mode == glui.Render2d ? new DialogRenderer2d() : 'DialogRenderer3d';
    // Dialog.prototype.setRenderer = function(mode, context) {
    //     Dialog.base.setRenderer.call(this, mode, context);
    // };

    Dialog.prototype.add = async function add(ctrl) {
        if (ctrl.id == 'titlebar') this.titlebar = ctrl;
        else if (ctrl.id == 'body') this.body = ctrl;
        else {
            this.body.add(ctrl);
        }
        return ctrl;
    };

    Dialog.prototype.getControlAt = function getControlAt(cx, cy, recursive) {
        var res = glui.Control.prototype.getControlAt.call(this, cx, cy);
        if (res && recursive) {
            res = this.titlebar.getControlAt(cx, cy, recursive);
            if (!res) {
                res = this.body.getControlAt(cx, cy, recursive);
            }
        }
        return res;
    };

    Dialog.prototype.init = function init(options) {
        var top = 0;
        var height = this.innerHeight;
        if (this.showTitlebar) {
            top += this.titlebar.height;
            height -= this.titlebar.height;
        }
        this.body.style['background-color'] = 'transparent';
        this.body.move(0, top);
        top += this.body.height - this.body.innerHeight;
        this.body.size(this.innerWidth, height);

        if (typeof this.oninit === 'function') {
            this.oninit(options.data);
        }
    };

    Dialog.prototype.setVisible = function setVisible(visible) {
        Dialog.base.setVisible.call(this, visible);
        this.titlebar.setVisible(visible);
        this.body.setVisible(visible);
    };

    Dialog.prototype.size = function size(width, height, isInner) {
        glui.Dialog.base.size.call(this, width, height, isInner);
        this.titlebar.size(this.innerWidth);
        var w = this.titlebar.innerWidth - this.titlebar.items[1].width;
        this.titlebar.items[0].size(w);
        this.titlebar.items[1].move(this.titlebar.items[0].width);
        // for (var i=this.titlebar.items.length-1; i>0; i--) {
        //     var ctrl = this.titlebar.items[i];
        //     ctrl.size(this.titlebar.renderer.font.size-1, this.titlebar.renderer.font.size-1, true);
        //     ctrl.offsetLeft = this.titlebar.innerWidth - ctrl.width - this.titlebar.padding;
        //     ctrl.offsetTop = this.titlebar.padding;
        //     ctrl.render();
        // }
        this.body.size(this.innerWidth, this.innerHeight - this.titlebar.height);
    };
        
    // Dialog.prototype.getHandlers = function getHandlers() {
    //     var handlers = Dialog.base.getHandlers();
    //     handlers.push(
    //         {
    //             name: 'dragging', topDown: true
    //         }
    //     );
    //     return handlers;
    // };

    Dialog.prototype.open = async function open(options) {
        // options:
        // - titlebar: show/hide titlebar
        // - modal: modal/modeless dialog
        options = options || {
            'titlebar': true,
            'modal': true
        };
        this.isModal = Boolean(options.modal);
        if (Boolean(options.titlebar) || this.isModal) {
            //this.titlebar.setVisible(true);
            // if (this.style.title['background-color']) this.titlebar.style['background-color'] = this.style.title['background-color'];
            // if (this.style.title['color']) this.titlebar.style['color'] = this.style.title['color'];
            // if (this.style.title['font']) this.titlebar.style['font'] = this.style.title['font'];
            if (this.template.title != undefined) {
                this.titlebar.items[0].setValue(this.template.title);
                // tmpl = {
                //     'type': 'Label',
                //     'style': mergeObjects(this.style.title, {
                //         'align': 'left middle',
                //         'width': '100%', 'height': '100%',
                //         'border': 'none'
                //     }),
                //     'value': this.template.title
                // };
                // tmpl.style['background-color'] = 'transparent';
                // this.title = await glui.create('title', tmpl, this.titlebar);
            }
            this.titlebar.renderer.initialize();
            this.titlebar.setVisible(true);

            // // add system controls
            // var sysCtrlKeys = Object.keys(glui.Dialog.systemControls);
            // this.titlebar.padding = this.titlebar.renderer.convertToPixel(glui.Dialog.systemControls.padding);
            // for (var i=glui.Dialog.systemControls.length-1; i>=0; i--) {
            //     var item = glui.Dialog.systemControls[i];
            //     var ctrl = glui.create(item.id, item.template, this.titlebar);
            //     ctrl.addHandler('click', this, glui.Dialog.prototype[item.command]);

            //     ctrl.size(this.titlebar.renderer.font.size-1, this.titlebar.renderer.font.size-1, true);
            //     ctrl.offsetLeft = this.titlebar.innerWidth - ctrl.width - this.titlebar.padding;
            //     ctrl.offsetTop = this.titlebar.padding;
            //     ctrl.render();
            // }
        }
        await this.init(options);
        this.size();

        this.setVisible(true);
        this.isActive = true;

        if (this.isModal && glui.isRunning) {
             this.render();
             glui.modalDialogs.push(this);
             await poll( () => !this.isActive);
             glui.modalDialogs.pop();
        }
    };
    Dialog.prototype.close = function close() {
        this.isActive = false;
        this.setVisible(false);
        console.log(this.titlebar.items[1].style.visible);
        console.log(this.titlebar.items[1].items[0].style.visible);
        // change focus        
        glui.repaint();
    };
    Dialog.prototype.onclick = function onclick(e, ctrl) {
        var cmd = ctrl.template.command;
        if (typeof this[cmd] === 'function') this[cmd].call(this, ctrl);
    };
    Dialog.prototype.ondragging = function ondragging(e, ctrl) {
        if (glui.focusedControl == e.control && (e.control == this.titlebar || e.control == this.titlebar.items[0])) {
        //if (glui.focusedControl == e.control && ctrl == this.titlebar) {
            // var x = e.clientX - e.offsetX;
            // var y = e.clientY - e.offsetY;
            // this.move(x, y);
            this.move(this.offsetLeft+e.deltaX, this.offsetTop+e.deltaY);
            glui.repaint();
        }
    };

    Dialog.Template = {
        'titlebar': {
            'id': 'titlebar',
            'type': 'Container',
            'style': {
                'left': '0', 'top': '0',
                'width': '100%', 'height': '1.6em',
                'background-color': 'silver',
                'color': 'black',
                'border': 'silver 1px outset',
                'font': 'Arial 12'
            },
            'items': [
                {
                    'id': 'title',
                    'type': 'Label',
                    'style': {
                        'align': 'left middle',
                        'width': '100%', 'height': '100%',
                        'background-color':'transparent',
                        'border': 'none'
                    },
                    'value': 'Dialog'
                },
                {
                    'id': 'sys-controls',
                    'type': 'Container',
                    'style': {
                        'align': 'right middle',
                        'left': '0', 'top': '0',
                        'width': 'auto', 'height': 'auto',
                        'border': 'none'
                    },
                    'items': [
                        {
                            'id': 'sys_close',
                            'type': 'Button',
                            // 'value': 'x',
                            'style': {
                                'width':'2.4em', 'height':'auto',
                                'border':'#808090 2px',
                                'background-color': '#a0a0b0',
                                'background-image': 'res/icon_close.png'
                            },
                            'command': 'close'
                        }
                    ]
                }
            ]
        },
        'body': {
            'id': 'body',
            'type': 'Container',
            'style': {
                'left': '0', 'top': '0',
                'width': '100%', 'height': '100%',
                'padding': '0px',
                //'border': 'gray 1px inset',
                'background-color': 'transparent', 'color': 'white',
                'font': 'Arial 12'
            },
            'items': []
        }
    };
    glui.schema.addType(new ObjectType('DialogItemStyle', null,
    {
        'attributes': {
            'background-color': { 'type':'string', 'isRequired':false, 'default':'transparent' },
            'background-image': { 'type':'string', 'isRequired':false, 'default':'none' },
            'border':           { 'type':'string', 'isRequired':false, 'default':'silver 2px solid' },
            'color':            { 'type':'string', 'isRequired':false, 'default':'black' },
            'font':             { 'type':'string', 'isRequired':false, 'default':'Arial 12 normal' }
        }
    }));

	//#endregion

	glui.buildType(
        {
            'name':'Dialog',
			'type':'Container',
            'attributes': {
				'title': { 'type':'string', 'isRequired':false, 'default':'Dialog' },
                'title-style': { 'type':'ControlStyle', 'isRequired':false },
                'body-style': { 'type':'ControlStyle', 'isRequired':false },
                'init':  { 'type':'void', 'isRequired':false }
            }
        }
    );

    publish(Dialog, 'Dialog', glui);
    publish(DialogRenderer2d, 'DialogRenderer2d', glui);
})();
