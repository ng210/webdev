include('container.js');
include('renderer2d.js');

(function() {
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


    function Dialog(id, template, parent, context) {
        Dialog.base.constructor.call(this, id, template, parent, context);
        this.isActive = false;
        this.showTitlebar = true;
        this.titlebar = null;
        this.body = null;
    }
    extend(glui.Container, Dialog);

    Dialog.prototype.getTemplate = function getTemplate() {
        var template = Dialog.base.getTemplate.call(this);
        template.title = 'dialog';
        template.style.title = glui.Control.getStyleTemplate();
        return template;
    };
    Dialog.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = Dialog.base.applyTemplate.call(this, tmpl);
        var titleStyle = mergeObjects(template.style);
        delete template.style.title;
        delete this.style.padding;
        template.style.title = mergeObjects(titleStyle, template.style.title);
        this.title = null;
        template.items = [
            // titlebar
            {
                'id': 'titlebar_',
                'type': 'Container',
                'style': {
                    'left': 0, 'top': 0, 'width': '100%', 'height': '1.4em'
                }
            },
            // body
            {
                'id': 'body_',
                'type': 'Container',
                'style': {
                    'left': 0, 'width': '100%'
                },
                'items': mergeObjects(tmpl.items)
            }
        ];
        return template;
    };
    Dialog.prototype.createRenderer = mode => mode == glui.Render2d ? new DialogRenderer2d() : 'DialogRenderer3d';
    Dialog.prototype.setRenderer = async function(mode, context) {
        await Dialog.base.setRenderer.call(this, mode, context);
    };

    Dialog.prototype.add = async function add(ctrl) {
        var parent = this;
        if (ctrl.id == 'titlebar_') this.titlebar = ctrl;
        else if (ctrl.id == 'body_') this.body = ctrl;
        else parent = this.body;
        glui.Dialog.base.add.call(parent, ctrl);
        return ctrl;
    };

    Dialog.prototype.init = async function init(options) {
        var top = 0;
        var height = this.innerHeight;
        if (this.showTitlebar) {
            top += this.titlebar.height;
            height -= this.titlebar.height;
        }
        this.body.move(0, top);
        this.body.size(this.innerWidth, height);
        for (var i=0; i<this.body.items.length; i++) {
            var item = this.body.items[i];
            item.renderer.initialize();
        }

        if (typeof this.oninit === 'function') {
            await this.oninit(options.data);
        }
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
        }
        this.isModal = Boolean(options.modal);
        if (Boolean(options.titlebar) || this.isModal) {
            // fill titlebar
            var tmpl = mergeObjects(Dialog.titlebar);
            if (this.style.title['background-color']) this.titlebar.style['background-color'] = this.style.title['background-color'];
            if (this.style.title['color']) this.titlebar.style['color'] = this.style.title['color'];
            if (this.style.title['font']) this.titlebar.style['font'] = this.style.title['font'];
            this.titlebar.setVisible(true);
            this.titlebar.renderer.initialize();
            if (this.template.title != undefined) {
                tmpl = {
                    'type': 'Label',
                    'style': mergeObjects(this.style.title, {
                        'align': 'left middle',
                        'width': '100%', 'height': '100%',
                        'border': 'none'
                    }),
                    'value': this.template.title
                };
                tmpl.style['background-color'] = 'transparent';
                this.title = await glui.create('title', tmpl, this.titlebar);
            }
            // add system controls
            var sysCtrlKeys = Object.keys(glui.Dialog.systemControls);
            var padding = this.titlebar.renderer.convertToPixel('0.2em');
            for (var i=glui.Dialog.systemControls.length-1; i>=0; i--) {
                var item = glui.Dialog.systemControls[i];
                var ctrl = await glui.create(item.id, item.template, this.titlebar);
                ctrl.size(this.titlebar.renderer.font.size-1);
                ctrl.offsetLeft = this.titlebar.innerWidth - ctrl.width - padding;
                ctrl.offsetTop = padding;
                ctrl.addHandler('click', this, glui.Dialog.prototype[item.command]);
            }
        }
        await this.init(options);

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
        glui.repaint();
    };
    Dialog.prototype.ondragging = function ondragging(e, ctrl) {
        if (glui.focusedControl == e.control && (e.control == this.titlebar || e.control == this.title)) {
        //if (glui.focusedControl == e.control && ctrl == this.titlebar) {
            var x = e.clientX - e.offsetX;
            var y = e.clientY - e.offsetY;
            this.move(x, y);
            //this.move(this.offsetLeft+e.deltaX, this.offsetTop+e.deltaY);
            glui.repaint();
        }
    };

    Dialog.systemControls = [
        {
            'id': 'sys_close',
            'template': {
                'type': 'Button',
                // 'value': 'x',
                'style': {
                    'width': '12px', 'height': '100%',
                    //'background-color': 'transparent',
                    'background-image': 'glui/res/icon_close.png'
                },
            },
            'command': 'close'
        }
    ];

    Dialog.titlebar = {
        'type': 'Container',
        'style': (function() {
            var style = glui.Control.getStyleTemplate();
            style.width = '100%';
            style.height = '1.2em';
            style.left = '0px';
            style.top = '0px';
            return style;
        })()
    };

    publish(Dialog, 'Dialog', glui);
    publish(DialogRenderer2d, 'DialogRenderer2d', glui);
})();
