include('/base/Dbg.js');
include('/ui/ui-lib.js');

function App() {
    this.settings = {
        'font': 'Arial',
        'size': 12
    };

    this.ui = new Ui.Board('settings', {
        'title': 'Settings',
        'items': {
            'font': { 'label':'Font', 'type': 'ddlist' },
            'size': { 'label':'Size', 'type': 'pot', 'min': 4, 'max':48 },
            'render': { 'label': false, 'type': 'button', 'value': 'Render'}
        },
        'layout': 'free'
    });
    var fonts = ['Arial', 'Consolas'];
    for (var i=0; i<fonts.length; i++) {
        this.ui.items.font.add(fonts[i], i);
    }
    
    this.ui.dataBind(this.settings)
}


async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

    var app = new App();
    app.ui.render({element: document.getElementById('sc')});

}