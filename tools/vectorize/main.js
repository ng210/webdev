include('/base/Dbg.js');
include('/ui/ui-lib.js');

function App() {
    this.settings = {
        r: 21,
        g: 72,
        b: 7,
        shades: 100,
        contrast: 0,
        medium: false,
        average: true
    };

    this.ui = new Ui.Board('settings', {
        'titlebar': 'Settings',
        'items': {
            // 'font': { 'label':'Font', 'type': 'ddlist', 'item-key': false, 'data-field': 'font' },
            'shades': { 'label':'Color shades', 'type': 'pot', 'min': 1, 'max':255, 'digits': 3, 'data-field': 'shades' },
            'contrast': { 'label':'Contrast', 'type': 'pot', 'min': -100, 'max':100, 'data-field': 'contrast' },
            // 'r': { 'label':'R', 'css': 'rgb', 'type': 'pot', 'data-field': 'r', 'events': ['dragging'] },
            // 'g': { 'label':'G', 'css': 'rgb', 'type': 'pot', 'data-field': 'g', 'events': ['dragging'] },
            // 'b': { 'label':'B', 'css': 'rgb', 'type': 'pot', 'data-field': 'b', 'events': ['dragging'] },
            'medium': { 'label':'Medium', 'type': 'checkbox', 'data-field': 'medium' },
            'average': { 'label':'Average', 'type': 'checkbox', 'data-field': 'average' },
            // 'range': { 'label':'Range', 'type': 'pot', 'min': 128, 'max':512, 'data-field': 'range' },
            // 'stroke': { 'label':'Stroke', 'type': 'checkbox', 'data-field': 'stroke' },
            // 'margin': { 'label':'Margin', 'type': 'pot', 'min': 0, 'max':16, 'data-field': 'margin' },
            // 'padding': { 'label':'Padding', 'type': 'pot', 'min': 0, 'max':16, 'data-field': 'padding' },
            // 'texture': { 'label':'Texture', 'type': 'ddlist', 'item-key': false, 'data-field': 'texture' },
            // 'box': { 'label':'Box', 'type': 'checkbox', 'data-field': 'box' },
            'image': { 'label': 'Import an image', 'type': 'button', 'value': 'open', 'events': ['click']}
        },
        'layout': 'free'
    }, this);

    this.ui.dataBind(this.settings);
    this.upload = document.createElement('input');
    this.upload.setAttribute('type', 'file');
    this.upload.addEventListener('change', e => this.handleImport());

    this.image = new Image();
    this.image.addEventListener('load', e => this.assignImage());
    this.image.src = 'hello.png';
    this.width = 0;

    this.settingsUi = document.getElementById('settings');
    this.input = document.getElementById('input').getContext('2d');
    this.steps = document.getElementById('steps').getContext('2d');

    this.data = {
        'input': null,
        'preprocess': null,
        'edges': null,
        'vectors': null
    };
}
App.prototype.process = function process() {
    var ratio = this.steps.canvas.height / this.image.height;
    this.width = Math.round(this.image.width * ratio);

    this.input.drawImage(this.image, 0, 0);
    this.data.input = this.input.getImageData(0, 0, this.image.width, this.image.height);

    this.steps.canvas.width = 4*this.width;
    this.steps.drawImage(this.input.canvas, 0, 0, this.width, this.steps.canvas.height);
    this.preprocess();
    this.createGradientField();
};


function posterize(v, c) {
    return Math.round(v/c)*c;
}

function contrast(v, c) {
    //var l = (this.settings.r*r + this.settings.g*g + this.settings.b*b)/weight;

    var f = Math.pow(128, (c+100)/100);
    var cv = (v - 127) * f/100 + 127;

    return cv;
}

function cell(img, ch, x, y, r, action, args) {
    var x0 = x > r ? x-r : 0;
    var y0 = y > r ? y-r : 0;
    var x1 = x < img.width-r ? x+r : img.width;
    var y1 = y < img.height-r ? y+r : img.height;
    var range = 2*r+1
    var stride = 4*img.width;
    var args = {
        x:0, y:0,
        value: 0,
        values: [],
        w: 0
    };
    for (var cy=y0; cy<y1; cy++) {
        args.x = x0;
        for (var cx=x0; cx<x1; cx++) {
            action(img.data[cy*stride + 4*cx + ch], args);
            args.x++;
            args.w++;
        }
        args.y++;
    }
    return args;
}

function average(img, ch, x, y) {
    var result = cell(img, ch, x, y, 1, (v, args) => args.value += v);
    return result.value/result.w;
}

function medium(img, ch, x, y) {
    var result = cell(img, ch, x, y, 1, (v, args) => args.values.push(v));
    result.values.sort();
    return result.values[result.w>>2];
}

App.prototype.preprocess = function preprocess() {
    var input = this.data.input;
    var output = this.data.preprocess = this.input.createImageData(input);
    var weight = this.settings.r + this.settings.g + this.settings.b;  
    var ix = 0;
    var ratio = 255/(this.settings.shades + 1);
    var chain = [];

    for (var y=0; y<input.height; y++) {
        for (var x=0; x<input.width; x++) {
            var r = input.data[ix + 0];
            var g = input.data[ix + 1];
            var b = input.data[ix + 2];
            var a = input.data[ix + 3];
            if (this.settings.medium) {
                r = medium(input, 0, x, y);
                g = medium(input, 1, x, y);
                b = medium(input, 2, x, y);
            }
            if (this.settings.average) {
                r = average(input, 0, x, y);
                g = average(input, 1, x, y);
                b = average(input, 2, x, y);
            }
            r = contrast(posterize(r, ratio), this.settings.contrast);
            g = contrast(posterize(g, ratio), this.settings.contrast);
            b = contrast(posterize(b, ratio), this.settings.contrast);
            var a = input.data[ix+3];
            // var col = v > this.settings.threshold ? 0 : 255;
            output.data[ix+0] = r;
            output.data[ix+1] = g;
            output.data[ix+2] = b;
            output.data[ix+3] = a;
            ix += 4;
        }
    }
    this.input.putImageData(output, 0, 0);
    this.steps.drawImage(this.input.canvas, this.width, 0, this.width, this.steps.canvas.height);
};

function getGradient(img, ch, x, y) {
    var ix = 4*(y*img.width + x) + ch;
    var dx = Math.abs(img.data[ix] - img.data[ix+4]);
    var dy = Math.abs(img.data[ix] - img.data[ix+4*img.width]);
    return dx || dy;
}

App.prototype.createGradientField = function createGradientField() {
    var input = this.data.preprocess;
    var output = this.data.edges = this.input.createImageData(input);
    var ix = 0;
    for (var y=0; y<input.height; y++) {
        for (var x=0; x<input.width; x++) {
            var r = getGradient(input, 0, x, y);
            var g = getGradient(input, 1, x, y);
            var b = getGradient(input, 2, x, y);
            var a = input.data[ix+3];
            output.data[ix+0] = r;
            output.data[ix+1] = g;
            output.data[ix+2] = b;
            output.data[ix+3] = a;
            ix += 4;
        }
    }

    this.input.putImageData(output, 0, 0);
    this.steps.drawImage(this.input.canvas, 2*this.width, 0, this.width, this.steps.canvas.height);

};
App.prototype.buildPixelTree = function buildPixelTree() {
};
App.prototype.render = function render() {
    this.ui.render({element: this.settingsUi});
};
App.prototype.onclick = function onclick(e) {
    if (e.control.id == 'settings_image') {
        this.loadImage();
    }   
};
App.prototype.loadImage = function loadImage() {
    this.upload.click();
};

App.prototype.handleImport = function handleImport() {
    var fileList = this.upload.files;
    var that = this;
    if (fileList != null && fileList[0] instanceof File) {
        const reader = new FileReader();
        reader.addEventListener('load', function(e) {
            try {
                that.image.src = reader.result;
            } catch (error) {
                alert('Import resulted in an error\n(' + error.message+')');
                return;
            }
        });
        reader.readAsDataURL(fileList[0]);
    }
}
App.prototype.assignImage = function assignImage() {
    this.input.canvas.width = this.image.width;
    this.input.canvas.height = this.image.height;
    //this.input = this.input.canvas.getContext('2d');

    this.process();
};

App.prototype.onchange = function onchange(e) {
    this.process();
};
App.prototype.ondragging = function ondragging(e) {
    var id = e.control.id;
    if (this.data.input != null)    {   //} && (id == 'settings_r' || id == 'settings_g' || id == 'settings_b')) {
        this.process();
    }
};

App.prototype.onkeyup = function onkeyup(e) {
    if (e.control.id == 'preview_text') {
        ;
    }
}

async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

    var app = new App('cvs');
    app.render();
}
