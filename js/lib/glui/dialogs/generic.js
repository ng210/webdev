include('/lib/glui/controls/dialog.js');

(function() {
    // function GenericDialogRenderer2d(control, context) {
    //     GenericDialogRenderer2d.base.constructor.call(this, control, context);
    // }
    // extend(glui.DialogRenderer2d, GenericDialogRenderer2d);
    //
    // GenericDialogRenderer2d.prototype.renderControl = function renderControl() {
    //     var ctrl = this.control;
    //     // draw titlebar
    //     if (ctrl.titlebar) {
    //         ctrl.titlebar.renderer.render();
    //     }
    //     ctrl.body.renderer.render();
    // };

    function GenericDialog(id, template, parent, context) {
        GenericDialog.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Dialog, GenericDialog);

    GenericDialog.counter = 0;
    GenericDialog.template = {
        'type': 'Dialog',
        'title': 'GenericDialog',
        'style': {
            'title': {
                'background-color': '#7090ff',
                'color': '#d0e0ff',
                'font': 'Arial 14px'
            },
            'background-color': '#a0c0ff',
            'color': '#7090ff',
            'width': '10em', 'height': '6em',
            'border': '#a0c0ff 2px outset',
            'padding': '4px 4px'
        },
        'items': [
            {   // message text
                'id': 'message',
                'type': 'Label',
                'style': {
                    'font': 'Arial 14px',
                    'width':'auto', 'height':'auto',
                    'left': 0, 'top': 0,
                    'align':'center middle',
                    'background-color': '#a0c0ff',
                    'color': '#102040',
                    'padding': '0.4em 1em'
                },
                'value': 'Message text'
            },
            {   // Ok button
                'id': 'okButton',
                'type': 'Button',
                'value': 'Ok',
                'style': {
                    'width':'auto', 'height':'auto',
                    'align':'center middle',
                    'border':'#e0e8ff 2px inset',
                    'background-color': '#e0e8ff',
                    'color': '#404060',
                    'padding': '1.0em 0.1em'
                }
            }
        ]
    };

    GenericDialog.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = GenericDialog.base.applyTemplate.call(this, mergeObjects(GenericDialog.template, tmpl));
        return template;
    };

    GenericDialog.prototype.init = async function init() {
        await GenericDialog.base.init.call(this);
        var message = this.body.items.find(x => x.id == 'message');
        var okButton = this.body.items.find(x => x.id == 'okButton');
        //okButton.addHandler('click', this, OpenSaveDialog.onclick);
        var top = message.height + 2;   //(this.innerHeight - message.height - okButton.height)/2;
        var left = (this.body.innerWidth - okButton.width)/2;
        okButton.move(left, top);
    };

    GenericDialog.prototype.onclick = function onclick(e, ctrl) {
        var isProcessed = true;
        switch (ctrl.id) {
            case 'okButton':
                this.close();
                break;
            default:
                isProcessed = false;
                break;
        }
        return isProcessed;
    };

    async function MessageBox(text, title) {
        var id = `mbox${GenericDialog.counter++}`;
        var dlg = await glui.create(id, {'type': 'GenericDialog', 'title': title || 'Message Box'});
        dlg.message = text;
        dlg.init = MessageBox.init;
        await dlg.open();
    }

    MessageBox.init = function MessageBox_init() {
        GenericDialog.prototype.init.call(this);
        var msg = this.getControlById('message');
        var ok = this.getControlById('okButton');
        msg.setValue(this.message);
        var width = 0, height = this.titlebar.height;
        for (var i=0; i<this.titlebar.items.length; i++) {
            var size = this.titlebar.items[i].renderer.getBestSizeInPixel();
            width += size[0];
        }
        var msgSize = msg.renderer.getBestSizeInPixel();
        var bodyFrame = this.body.renderer.getFrameSize();
        width += msgSize[0] + 2*bodyFrame[0];
        height += msgSize[1] + 3*bodyFrame[1] + ok.height;
        this.size(width, height, true);
        msg.size(this.body.innerWidth, msgSize[1]);
    };

    publish(GenericDialog, 'GenericDialog', glui);
    publish(MessageBox, 'MessageBox', glui);
})();
