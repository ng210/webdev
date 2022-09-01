const fontData = require('./font.json');
const fs = require('fs');

const WIDTH = 16;
const HEIGHT = 9;
var SCALE = [4, 3];
const GAP = [0.2, 0.8];

const emptyFont = {
    'width': 8,
    'height': 12,
    'left': 0,
    'top': 0,
    'data': [0,0, 8,0, 8,12, 0,12]
};

function round(x) {
    const pr = 10000;
    return Math.round(x*pr)/pr;
}

var fonts = {};
var fontWidth = 0;

function prepareFonts() {
    for (var i in fontData) {
        var minX = 1000, maxX = 0;
        var minY = 1000, maxY = 0;
        var data = fontData[i];
        var j = 0;
        while (j<data.length) {
            var x = data[j++];
            if (x == -1) continue;
            var y = data[j++];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
        var w = (maxX - minX) || 1;
        var h = (maxY - minY) || 1;
        fonts[i] = {
            'width': w,
            'height': h,
            'left': minX,
            'top': minY,
            'data': data
        };
        fontWidth = Math.max(fontWidth, w);
        fontHeight = Math.max(fontWidth, h);
    }
}

function createChar(ch) {
    var char = {
        char: ch,
        width: 0,
        segments: []
    };
    if (ch != ' ') {
        var font = fonts[ch];
        if (!font) font = emptyFont;
        var data = font.data;
        var left = font.left;
        var top = font.top;
        var i = 0;
        var x1 = data[i++] - left;
        var y1 = data[i++] - top;
        while (i<data.length) {
            if (data[i] == -1) {
                i++;
                x1 = data[i++] - left;
                y1 = data[i++] - top;
            }
            var x2 = data[i++] - left;
            var y2 = data[i++] - top;
            char.segments.push([x1,y1, x2,y2]);
            x1 = x2; y1 = y2;
        }
        char.width = font.width;
    } else {
        char.width = .4*fontWidth;
    }
    return char;
}

function createWord(text) {
    var word = {
        width:0,
        chars:[]
    };
    for (var i=0; i<text.length; i++) {
        var char = createChar(text.charAt(i));
        word.chars.push(char);
        word.width += char.width;
        if (i < text.length-1) word.width += GAP[0]*fontWidth;
    }
    return word;
}

function processArguments() {
    var args = {};
    for (var i=0; i<process.argv.length; i++) {
        var arg = process.argv[i].split('=');
        if (arg.length == 1) arg.push(true);
        switch (arg[0]) {
            case 't': args.text = arg[1]; break;
            case 'f': args.file = arg[1]; break;
        }
    }

    return args;
}

function main() {
    var args = processArguments();
    if (args.text) {
        prepareFonts();
        var text = process.argv[2] || 'szia tilduska!';
        text = text.toUpperCase();
        var words = text.split(' ');
        var line = {
            width: 2*.5*fontWidth,
            chars: []
        };
        var lines = [line];
        var space = createChar(' ');
        for (var i=0; i<words.length; i++) {
            var word = createWord(words[i]);
            if (line.chars.length > 0) {
                if (line.width + space.width + word.width > WIDTH*fontWidth/SCALE[0]) {
                    line = {
                        width: 2*.5*fontWidth,
                        chars: []
                    };
                    lines.push(line);
                } else {
                    line.chars.push(space);
                    line.width += fontWidth + space.width + 2*GAP[0]*fontWidth;
                }
            }
            line.width += word.width;
            line.chars.push(...word.chars);
        }
    
        var width = fontWidth*(WIDTH + GAP[0]*(WIDTH-1));
        var height = fontHeight*(HEIGHT + GAP[1]*(HEIGHT-1));
    
        SCALE[0] /= width;
        SCALE[1] /= height;
        var offs = [0, .5*(fontHeight*(lines.length + GAP[1]*(lines.length-1)))];
        for (var i=0; i<lines.length; i++) {
            var line = lines[i];
            offs[0] = -.5*line.width + GAP[0]*fontWidth;
            for (var j=0; j<line.chars.length; j++) {
                var char = line.chars[j];
                console.log(`    // ${char.char}`);
                for (var k=0; k<char.segments.length; k++) {
                    var sg = char.segments[k];
                    var x1 = round(SCALE[0]*(sg[0] + offs[0]));
                    var y1 = round(SCALE[1]*(-sg[1] + offs[1]));
                    var x2 = round(SCALE[0]*(sg[2] + offs[0]));
                    var y2 = round(SCALE[1]*(-sg[3] + offs[1]));
                    var w = round(x2-x1);
                    var h = round(y2-y1);
                    console.log(`    sg = vec4(${x1}, ${y1}, ${w}, ${h}); hit = max(hit, intersect(ray, sg, iv)); d = min(d, length(p-iv));`);
                }
                offs[0] += char.width + round(GAP[0]*fontWidth);
            }
            offs[1] -= fontHeight * (1 + GAP[1]);
        }
    } else if (args.file) {
        var file = fs.readFileSync(args.file, {encoding:'utf-8'});
        var data = JSON.parse(file);
        var minX = 1000, minY = 1000;
        var maxX = 0, maxY = 0;
        var i = 0;
        while (i<data.length) {
            var x = data[i++];
            if (x == -1) continue;
            var y = data[i++];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        var width = maxX - minX;
        var height = maxY - minY;
        var left = minX, top = minY;
        SCALE[0] /= 2*width;
        SCALE[1] /= 2.5*height;
        var offs = [-.49*WIDTH*16/9, .49*HEIGHT];
        i = 0;
        var x1, y1, x2, y2;
        var restart = true;
        while (i<data.length-2) {
            var v = data[i++];
            if (v == -1) {
                restart = true;
                continue;
            }
            var x = round((SCALE[0]*(v - left) + offs[0])/WIDTH);
            var y = round((SCALE[1]*(-data[i++] + top) + offs[1])/HEIGHT);
            if (!restart) {
                x2 = x; y2 = y;
                var w = round(x2-x1);
                var h = round(y2-y1);
                console.log(`    sg = vec4(${x1}, ${y1}, ${w}, ${h}); hit = max(hit, intersect(ray, sg, iv)); d = min(d, length(p-iv));`);
                x1 = x2; y1 = y2;
            } else {
                x1 = x; y1 = y;
                restart = false;
            }
        }
    }
}


//main();

var f = 440.0/Math.pow(2, 5)*Math.pow(2, 3/12);
console.log(f);
