include('/base/Dbg.js');
include('/ui/ui-lib.js');

function App(canvasId) {
    this.settings = {
        'font': 'Serif',
        'size': 24,
        'stroke': false,
    };

    this.ui = new Ui.Board('settings', {
        'titlebar': 'Settings',
        'items': {
            'font': { 'label':'Font', 'type': 'ddlist', 'item-key': false, 'data-field': 'font' },
            'size': { 'label':'Size', 'type': 'pot', 'min': 4, 'max':48, 'data-field': 'size' },
            'stroke': { 'label':'Stroke', 'type': 'checkbox', 'data-field': 'stroke' },
            'render': { 'label': false, 'type': 'button', 'value': 'Render', 'events': ['click']}
        },
        'layout': 'free'
    }, this);
    this.ui.items.font.setItems( ['Arial', 'Consolas', 'Serif'] );
    this.ui.dataBind(this.settings);

    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    var chars = [];
    for (var i=0; i<255-32; i++) {
        chars.push(String.fromCharCode(32+i));
    }
    this.chars = chars.join('');
}
App.prototype.createFontMap = function createFontMap() {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.map = {};
    var x = 0, y = 0;
    this.ctx.font = this.settings.size + 'px ' + this.settings.font;
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'white';
    var totalWidth = 0;
    for (var i=32; i<128; i++) {
        var char = String.fromCharCode(i);
        var metrics = this.ctx.measureText(char);
        this.map[char] = {
            widt: metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
            offset: -metrics.actualBoundingBoxAscent
        };
        totalWidth += metrics.width;
        if (x + metrics.width > this.canvas.width) {
            x = 0;
            y += this.settings.size;
        }
        this.ctx.moveTo(x, y);
        this.settings.stroke ? this.ctx.strokeText(char, x, y) : this.ctx.fillText(char, x, y);
        x += metrics.width;
    }
    // get smallest bounding box for size*totalWidth

}
App.prototype.onclick = function onclick(e) {
    this.createFontMap();
}

async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

    var app = new App('cvs');
    app.ui.render({element: document.getElementById('sc')});
    app.createFontMap();

}