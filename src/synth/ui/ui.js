include('ui/notechart.js');
include('ui/synth-ui.js');

async function createUi() {
    var ui = new Ui.Panel('ui', {
        titlebar: false,
        layout:'horizontal',
        css: 'main',
        split: [20, 80],
        fixed: true,
        items: {
            'modules': {
                type: 'board',
                titlebar: false,
            },
            'editors': {
                type: 'panel',
                titlebar: false,
                css: 'editors',
                titlebar: false,
                layout: 'vertical',
                //split: [30, 50, 20]
           }
        }
    });
    return ui;
}