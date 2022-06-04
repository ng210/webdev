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
                    'left': 0, 'width': '100%',
                    'padding': this.style.padding
                },
                'items': mergeObjects(template.items)
            }
        ];
        delete this.style.padding;
        return template;
    };
    Dialog.prototype.createRenderer = mode => mode == glui.Render2d ? new DialogRenderer2d() : 'DialogRenderer3d';
    Dialog.prototype.setRenderer = function(mode, context) {
        Dialog.base.setRenderer.call(this, mode, context);
    };

    Dialog.prototype.add = async function add(ctrl) {
        var parent = this;
        if (ctrl.id == 'titlebar_') this.titlebar = ctrl;
        else if (ctrl.id == 'body_') this.body = ctrl;
        else parent = this.body;
        glui.Dialog.base.add.call(parent, ctrl);
        return ctrl;
    };

    Dialog.prototype.init = function init(options) {
        var top = 0;
        var height = this.innerHeight;
        if (this.showTitlebar) {
            top += this.titlebar.height;
            height -= this.titlebar.height;
        }
        this.body.move(0, top);
        top += this.body.height - this.body.innerHeight;
        this.body.size(this.innerWidth, height);

        if (typeof this.oninit === 'function') {
            this.oninit(options.data);
        }
    };

    Dialog.prototype.size = function size(width, height, isInner) {
        glui.Dialog.base.size.call(this, width, height, isInner);
        for (var i=this.titlebar.items.length-1; i>0; i--) {
            var ctrl = this.titlebar.items[i];
            ctrl.size(this.titlebar.renderer.font.size-1, this.titlebar.renderer.font.size-1, true);
            ctrl.offsetLeft = this.titlebar.innerWidth - ctrl.width - this.titlebar.padding;
            ctrl.offsetTop = this.titlebar.padding;
            ctrl.render();
        }
        this.body.size(this.innerWidth, this.innerHeight - this.titlebar.height);
    }
        
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
            this.titlebar.padding = this.titlebar.renderer.convertToPixel(glui.Dialog.systemControls.padding);
            for (var i=glui.Dialog.systemControls.length-1; i>=0; i--) {
                var item = glui.Dialog.systemControls[i];
                var ctrl = await glui.create(item.id, item.template, this.titlebar);
                ctrl.addHandler('click', this, glui.Dialog.prototype[item.command]);

                ctrl.size(this.titlebar.renderer.font.size-1, this.titlebar.renderer.font.size-1, true);
                ctrl.offsetLeft = this.titlebar.innerWidth - ctrl.width - this.titlebar.padding;
                ctrl.offsetTop = this.titlebar.padding;
                ctrl.render();
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
            // var x = e.clientX - e.offsetX;
            // var y = e.clientY - e.offsetY;
            // this.move(x, y);
            this.move(this.offsetLeft+e.deltaX, this.offsetTop+e.deltaY);
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
                    //'background-color': 'transparent',
                    'background-image': 'res/icon_close.png'
                },
            },
            'command': 'close'
        }
    ];
    Dialog.systemControls.padding = '0.2em';

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
