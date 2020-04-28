include('/base/Dbg.js');
include('/ui/ui-lib.js');

function App(canvasId) {
    this.settings = {
        'font': 'Serif',
        'size': 44,
        'stroke': false,
        'texture': 'auto',
        'box': false
    };

    this.ui = new Ui.Board('settings', {
        'titlebar': 'Settings',
        'items': {
            'font': { 'label':'Font', 'type': 'ddlist', 'item-key': false, 'data-field': 'font' },
            'size': { 'label':'Size', 'type': 'pot', 'min': 4, 'max':48, 'data-field': 'size' },
            'stroke': { 'label':'Stroke', 'type': 'checkbox', 'data-field': 'stroke' },
            'texture': { 'label':'Texture', 'type': 'ddlist', 'item-key': false, 'data-field': 'texture' },
            'box': { 'label':'Box', 'type': 'checkbox', 'data-field': 'box' },
            'render': { 'label': false, 'type': 'button', 'value': 'Render', 'events': ['click']}
        },
        'layout': 'free'
    }, this);
    this.ui.items.font.setItems( ['Arial', 'Consolas', 'Serif'] );
    this.ui.dataBind(this.settings);
    this.textureSizes = [];
    for (var x=64; x<=1024; x*=2) {
        for (var y=64; y<=1024; y*=2) {
            if (x >= y) {
                this.textureSizes.push([x, y]);
            }
        }
    }
    this.validTextureSizes = [];

    this.previewText = new Ui.Textbox('preview_text', {'value':'preview', 'data-type':'string', 'events': ['keyup']}, this);

    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    var chars = [];
    for (var i=0; i<255-32; i++) {
        chars.push(String.fromCharCode(32+i));
    }
    this.chars = chars.join('');
    this.totalWidth = 0;
    this.totalSurface = 0;
}
App.prototype.createFontMap = function createFontMap() {
    this.map = {};
    this.ctx.font = this.settings.size + 'px ' + this.settings.font;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';  // 
    this.totalWidth = 0;
    this.totalSurface = 0;
    for (var i=32; i<128; i++) {
        var char = String.fromCharCode(i);
        var metrics = this.ctx.measureText(char);
        var width = (metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft) || metrics.width;
        var height = Math.abs(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) || 1;
        var entry = {
            left: metrics.actualBoundingBoxLeft, top: metrics.actualBoundingBoxAscent, right:metrics.actualBoundingBoxRight, bottom: metrics.actualBoundingBoxDescent,
            width: Math.ceil(width),
            height: Math.ceil(height),
            offset: Math.ceil(metrics.actualBoundingBoxAscent)
        };
        this.map[char] = entry;
        this.totalWidth += entry.width;
        this.totalSurface += entry.width*this.settings.size;   //entry.height;
    }
    Dbg.prln('Total surface: ' + this.totalSurface);
    Dbg.prln('Total width: ' + this.totalWidth);
};
App.prototype.optimizeTextureSize = function optimizeTextureSize() {
    for (var i=0; i<this.textureSizes.length; i++) {

    }

    Dbg.prln(`${finalWidth}x${finalHeight}`);
    return [finalWidth, finalHeight];
};
App.prototype.drawFontMap = function drawFontMap() {
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = '#101820';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = this.settings.size + 'px ' + this.settings.font;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'white';
    var x = 0, y = 0;
    var log = [];
    for (var i=32; i<128; i++) {
        var char = String.fromCharCode(i);
        var metrics = this.map[char];
        if (x + metrics.width > this.canvas.width) {
            x = 0;
            y += this.settings.size;
        }
        metrics.x = x, metrics.y = y;
        this.ctx.moveTo(x, y);
        this.ctx.strokeStyle = 'white';
        this.settings.stroke ? this.ctx.strokeText(char, x+metrics.left, y+metrics.top) : this.ctx.fillText(char, x+metrics.left, y+metrics.top);

        this.ctx.strokeStyle = '#ffe080';
        if (this.settings.box) {
            this.ctx.strokeRect(x, y, metrics.width, metrics.height);
        }

        if (char == '"' || char == '\\') char = ' "\\' + char;
        else char = '  "' + char;
        log.push(`${char}": {"x": ${x}, "y":${y}, "w":${metrics.width}, "h":${metrics.height}, "o":${metrics.offset}}`);

        x += metrics.width;
    }
    document.getElementById('map').innerHTML = `{<br/>${log.join(',<br/>')}<br/>}`;
};
App.prototype.updateTextureSizes = function updateTextureSizes() {
    var ddl = this.ui.items.texture;
    var selected = ddl.getSelected();
    this.validTextureSizes = [];
    var items = ['auto'];
    for (var i=0; i<this.textureSizes.length; i++) {
        var size = this.textureSizes[i];
        if (this.totalSurface <= size[0]*size[1]) {
            this.validTextureSizes.push(size);
            items.push(size.join('x'));
        }
    }
    ddl.setItems(items);
    if (selected != null) {
        ddl.select(selected.value);
    }
    //var selected = this.ui.items.texture.getSelected();
};
App.prototype.recreate = function recreate() {
    this.createFontMap();
    this.updateTextureSizes();
    var size = this.ui.items.texture.value;
    var metrics = null;
    if (size == 'auto') {
        metrics = this.optimizeTextureSize();
    } else {
        var tokens = size.split('x');
        metrics = [parseInt(tokens[0]), parseInt(tokens[1])];
    }
    this.canvas.width = metrics[0];
    this.canvas.height = metrics[1];
    this.ctx = this.canvas.getContext('2d');
    this.drawFontMap();
    this.preview()
};
App.prototype.render = function render() {
    (this.ui.render({element: document.getElementById('sc')})).then(() => this.recreate());
    this.previewText.render({element: document.getElementById('text')});
};
App.prototype.preview = function preview() {
    var text = this.previewText.element.value;
    var canvas = document.getElementById('preview');
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 1;
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = this.settings.size + 'px ' + this.settings.font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';
    var x = 0, y = 0;
    for (var i=0; i<text.length; i++) {
        var char = text.charAt(i);
        var metrics = this.map[char];
        var data = this.ctx.getImageData(metrics.x, metrics.y, metrics.width, metrics.height);
        ctx.putImageData(data, x, y-metrics.offset);
        x += metrics.width;
    }
};

App.prototype.onclick = function onclick(e) {
    if (e.control.id == 'settings_render') {
        this.recreate();
    }   
};
App.prototype.onchange = function onchange(e) {
    if (e.control.id == 'settings_box') {
        this.drawFontMap();
        return true;
    }
};
App.prototype.onkeyup = function onkeyuo(e) {
    if (e.control.id == 'preview_text') {
        this.preview();
        return true;
    }
}

async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

    var app = new App('cvs');
    app.render();
}