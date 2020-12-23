include('glui/controls/dialog.js');

(function() {

    async function OpenSaveDialog(options, app) {
        var dlg = await glui.create('OpenDialog', OpenSaveDialog.template, null, app);
        dlg.selected = null;
        dlg.template.title = options.title;
        dlg.filters = options.filters || [];
        dlg.onclick = OpenSaveDialog.onclick;
        dlg.oninit = typeof options.init === 'function' ? function oninit(data) { OpenSaveDialog.init.call(this, data); options.init.call(this, data); } : OpenSaveDialog.oninit;
        await dlg.open();
        return dlg.selected;
    }

    OpenSaveDialog.template = {
        'type': 'Dialog',
        'title': 'OpenSaveDialog',
        'style': {
            'title': {
                'background-color': '#7090ff',
                'color': '#d0e0ff',
                'font': 'Arial 14px'
            },
            'background-color': '#a0c0ff',
            'color': '#7090ff',
            'font': 'Arial 12px',
            'width': '40em', 'height': '20em',
            'border': '#a0c0ff 2px outset',
            'padding': '0px 0px'
        },
        'items': [
            {   // resource list
                'id': 'list',
                'type': 'Table',
                'style': {
                    'font': 'Arial 20',
                    'width':'100%', 'height': '80%',
                    'align':'center middle',
                    'border':'#a0c0ff 1px outset',
                    'color': '#203050',
                    'background-color': '#a0c0ff',
                    'cell': {
                        'font': 'Arial 12',
                        'align':'center middle',
                        'border':'#80c0ff 1px inset',
                        'color': '#141820',
                        'background-color': '#a0c0ff',
                        'width': '4em', 'height': '1.2em'
                    },
                    'title': {
                        // 'font': 'Arial 16',
                        // 'border':'#204080 1px outset',
                        // 'color': '#6090ff',
                        // 'background-color': '#204080',
                        // 'height': '1.5em'
                    },
                    'header': {
                        'font': 'Arial 12',
                        'height':'1.4em',
                        'align':'center middle',
                        'border':'#7090ff 1px outset',
                        'color': '#d0e0ff',
                        'background-color': '#7090ff',
                    }
                },
                'title': '',    //Data-source (table)',
                'header': true,
                'rows': 10,
                'data-source': 'data',
                'data-field': 'res-list',
                'row-template': {
                    'name': { 'type': 'Label', 'data-type': 'string', 'style': { 'width':'60%' } },
                    'size': { 'type': 'Label', 'data-type': 'int', 'style': { 'width':'40%' } }
                }
            },
            {   // selection textbox
                'id': 'selection',
                'type': 'Textbox', 'multi-line': false, 'style': {
                    'font': 'Arial 12',
                    'width':'100%', 'height':'1.2em',
                    'left': '0em', 'top': '0',
                    'align':'left middle',
                    'color': '#141820',
                    'border':'#d0e0ff 1px inset',
                    'background-color': '#d0e0ff'
                },
                'blank': 'select an item from the list'
            },
            {   // Ok button
                'id': 'okButton',
                'type': 'Button', 'value': 'Ok', 'style': {
                    'font': 'Arial 12',
                    'width':'auto', 'height':'auto',
                    'align':'center middle',
                    'border':'#d0e0ff 2px inset',
                    'background-color': '#d0e0ff',
                    'color': '#141820',
                    'padding': '1.0em 0.2em'                }
            },
            {   // Cancel button
                'id': 'cancelButton',
                'type': 'Button', 'value': 'Cancel', 'style': {
                    'font': 'Arial 12',
                    'width':'auto', 'height':'auto',
                    'align':'center middle',
                    'border':'#d0e0ff 2px inset',
                    'background-color': '#d0e0ff',
                    'color': '#141820',
                    'padding': '1.0em 0.2em'
                }
            }
        ]
    };

    OpenSaveDialog.init = async function init() {
        var resList = this.body.items.find(x => x.id == 'list');
        var selection = this.body.items.find(x => x.id == 'selection');
        var okButton = this.body.items.find(x => x.id == 'okButton');
        okButton.addHandler('click', this, OpenSaveDialog.onclick);
        var cancelButton = this.body.items.find(x => x.id == 'cancelButton');
        cancelButton.addHandler('click', this, OpenSaveDialog.onclick);
        resList.onclick = function(e, ctrl) {
            ctrl.parent.parent.selectedRow = ctrl.parent;
            selection.setValue(ctrl.parent.cells[0].getValue());
            selection.render();
            return true;
        };
        await resList.build();
        var top = resList.height;
        //resList.dataBind(window.data['res-list']);
        selection.move(0, top);
        top += selection.height;
        top += (this.body.innerHeight - top - okButton.height) / 2;
        var gap = (this.body.innerWidth - okButton.width - cancelButton.width)/3;
        okButton.move(gap, top);
        var left = okButton.width + 2*gap;
        cancelButton.move(left, top);

        this.init
    };

    OpenSaveDialog.onclick = async function onclick(e, ctrl) {
        var isProcessed = true;
        switch (ctrl.id) {
            case 'okButton':
                // get selection
                var selection = this.body.items.find(x => x.id == 'selection');
                var selected = selection.getValue();
                if (selected != '') {
                    this.selected = selected;
                    this.close();
                }
                break;
            case 'cancelButton':
                this.close();
                break;
            default:
                isProcessed = false;
                break;
        }
        return isProcessed;
    };

    publish(OpenSaveDialog, 'OpenSaveDialog', glui);
})();
