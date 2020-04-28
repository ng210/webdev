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
    this.map = {};
    this.ctx.font = this.settings.size + 'px ' + this.settings.font;
    this.ctx.textBaseline = 'top';
    var totalWidth = 0;
    var log = [];
    for (var i=32; i<128; i++) {
        var char = String.fromCharCode(i);
        var metrics = this.ctx.measureText(char);
        var entry = {
            width: metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
            offset: -metrics.actualBoundingBoxAscent
        };
        this.map[char] = entry;
        if (char == '"') char = ' "\\' + char;
        else char = '  "' + char;
        log.push(char+'": ' + JSON.stringify(entry));

        totalWidth += metrics.width;
    }
    // get smallest bounding box for size*totalWidth
    var s = totalWidth*this.settings.size;
    var height = Math.pow(2, Math.ceil(Math.log2(this.settings.size)));
    var diff = s;
    var finalHeight = 0, finalWidth = 0;
    while (height < totalWidth/2) {
        var q = s/height;
        var width = Math.pow(2, Math.ceil(Math.log2(q)));
        var d = width*height - s;
        if (d < diff) {
console.log(`${width}x${height} => ${d}`);
            finalHeight = height;
            finalWidth = width;
            diff = d;
        }
        height *= 2;
    }
    console.log(`${finalWidth}x${finalHeight}`);

    this.canvas.width = finalWidth;
    this.canvas.height = finalHeight;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = '#101820';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = this.settings.size + 'px ' + this.settings.font;
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'white';
    var x = 0, y = 0;
    for (var i=32; i<128; i++) {
        var char = String.fromCharCode(i);
        var entry = this.map[char];
        entry.height = entry.height || 1;
        entry.width = entry.width || metrics.width;
        if (entry.width != Math.floor(entry.width)) entry.width = entry.width.toFixed(4);
        if (entry.height != Math.floor(entry.height)) entry.height = entry.height.toFixed(4);
        if (entry.offset != Math.floor(entry.offset)) entry.offset = entry.offset.toFixed(4);
        if (x + metrics.width > this.canvas.width) {
            x = 0;
            y += this.settings.size;
        }
        this.ctx.moveTo(x, y);
        this.settings.stroke ? this.ctx.strokeText(char, x, y) : this.ctx.fillText(char, x, y);
        x += metrics.width;
    }

    document.getElementById('map').innerHTML = `{<br/>${log.join(',<br/>')}<br/>}`;
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