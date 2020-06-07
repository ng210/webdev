(function() {

    var glui = {
        controls: [],
        scale: [1, 1],
        mode: null,
        Alignment: {
            LEFT: 1,
            CENTER: 2,
            RIGHT: 4,
            //JUSTIFIED: 8,
            TOP: 16,
            MIDDLE: 32,
            BOTTOM: 64
        },
        getType: function getType(tagName) {
            var type = null;
            var name = tagName.toLowerCase().split('gl-')[1];
            if (name) {
                var typeName = name.charAt(0).toUpperCase() + name.substr(1);
                type = glui[typeName] ? glui[typeName] : null;
            }
            return type;
        },
        fromNode: function fromNode(node) {
            var control = null;
            var type = glui.getType(node.tagName);
            if (type) {
                var control = Reflect.construct(type, []);
                control.parent = this;
                control.fromNode(node);
            }            
            return control;
        },
        buildUI: async function buildUI(app) {
            var nodes = document.body.querySelectorAll('*');
            glui.parent = app;
            for (var i=0; i<nodes.length; i++) {
                var control = glui.fromNode(nodes[i]);
                if (control) {
                    glui.controls.push(control);
                }
            }
        },
        render: function render(ref, mode) {
            var canvas = typeof ref === 'string' ? document.getElementById(ref) : ref;
            if (glui.mode == null) {
                glui.mode = mode || '2d';
                glui.context = canvas.getContext(glui.mode);
            }
            glui.scale[0] = canvas.width / canvas.clientWidth;
            glui.scale[1] = canvas.height / canvas.clientHeight;
            var is2d = glui.mode == '2d';
            for (var i=0; i<glui.controls.length; i++) {
                glui.controls[i].render(glui.context, is2d);
            }
        },
        getControlAt: function getControlAt(x, y) {
            var cx = x*glui.scale[0], cy = y*glui.scale[1];
            var res = null;
            for (var i=0; i<glui.controls.length; i++) {
                var ctrl = glui.controls[i];
                if (ctrl.left < cx  && cx < ctrl.left + ctrl.width && ctrl.top < cy  && cy < ctrl.top + ctrl.height) {
                    res = ctrl;
                    break;
                }
            }
            return res;
        },
        calculateColor: function calculateColor(color, factor) {
            var r = Math.floor(parseInt(color.substr(1,2), 16) * factor);
            var g = Math.floor(parseInt(color.substr(3,2), 16) * factor);
            var b = Math.floor(parseInt(color.substr(5,2), 16) * factor);
            if (r > 255) r = 255;
            if (g > 255) g = 255;
            if (b > 255) b = 255;
            return `rgb(${r},${g},${b})`;
        }
    };

    function Draw2d(control, context) {
        this.context = context;
        this.control = control;
        this.font = { face:null, size:0, weight:null, em:0 };
        this.border = { color: null, colorLight: null, colorDark: null,width: 0, style: null };
        this.setFont(control.style.font);
        this.setBorder(control.style.border);
    }
    Draw2d.prototype.getAlignment = function getAlignment(align) {
        var tokens = align.split(' ');
        var alignment = 0;
        for (var i=0; i<tokens.length; i++) {
            var align = glui.Alignment[tokens[i].toUpperCase()];
            if (align) alignment |= align;
        }
        return alignment;
    };
    Draw2d.prototype.setFont = function setFont(font) {
        var tokens = font.split(' ');
        this.font.face = tokens[0];
        this.font.size = parseFloat(tokens[1]);
        this.font.weight = tokens[2];
        this.context.font = `${this.font.weight} ${this.font.size}px ${this.font.face}`;
        var metrics = this.context.measureText('@(Q.');
        this.font.em = metrics.width/4;
    };
    Draw2d.prototype.setBorder = function setBorder(border) {
        var tokens = border.split(' ');
        this.border.color = tokens[0];
        this.border.colorLight = glui.calculateColor(tokens[0], 1.6);
        this.border.colorDark = glui.calculateColor(tokens[0], 0.6);
        this.border.width = parseFloat(tokens[1]);
        this.border.style = tokens[2];
    };
    Draw2d.prototype.convertToPixel = function convertToPixel(value) {
        var res = 0;
        if (typeof value === 'number') res = value;
        else if (value.endsWith('px')) res = parseFloat(value);
        else if (value.endsWith('%')) res = this.control.parent.width * parseFloat(value);
        else if (value.endsWith('em')) res = this.font.em * parseFloat(value);
        return res;
    };
    Draw2d.prototype.convertToPixelV = function convertToPixel(value) {
        var res = 0;
        if (typeof value === 'number') res = value;
        else if (value.endsWith('px')) res = parseFloat(value);
        else if (value.endsWith('%')) res = this.control.parent.height * parseFloat(value);
        else if (value.endsWith('em')) res = this.font.size * parseFloat(value);
        return res;
    };
    Draw2d.prototype.drawBorder = function drawBorder(x, y, w, h) {
        var ctx = this.context;
        var bw = this.border.width;
        var bw2 = Math.floor(this.border.width/2);
        var x1 = x+bw2, x2 = x+w, x3 = x+w-bw2;
        var y1 = y+bw2, y2 = y+h, y3 = y+h-bw2;
        ctx.lineWidth = bw;
        var color1 = this.border.colorLight;
        var color2 = this.border.colorDark;
        if (this.border.style == 'solid') {
            color1 = color2 = this.border.color;
        } else if (this.border.style == 'inset') {
            color1 = color2;
            color2 = this.border.colorLight;
        }

        ctx.beginPath();
        ctx.strokeStyle = color1;
        ctx.moveTo(x, y2); ctx.lineTo(x, y1); ctx.lineTo(x2, y1);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = color2;
        ctx.moveTo(x2-bw2, y1+bw2); ctx.lineTo(x3, y2-bw2); ctx.lineTo(x1-1, y2-bw2);
        ctx.stroke();
    };
    Draw2d.prototype.drawRect = function drawRect(x, y, w, h, color) {
        var ctx = this.context;
        ctx.fillStyle = this.control.style.background;
        ctx.fillRect(x, y, w, h);
    };
    Draw2d.prototype.drawText = function drawText(text, x, y, w, h, color, align) {
        var bw = this.border.width;
        var alignment = this.getAlignment(align);
        var ctx = this.context;
        var metrics = ctx.measureText(text);
        var cw = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
        var cx = x, cy = y;
        var dx = w - 2*bw - cw; if (dx < 0) dx = 0;
        var dy = h - 2*bw - this.font.size; if (dy < 0) dy = 0;
        if (alignment & glui.Alignment.CENTER) cx = x + Math.floor(dx/2);
        else if (alignment & glui.Alignment.RIGHT) cx = x + dx;
        if (alignment & glui.Alignment.MIDDLE) cy = y + Math.floor(dy/2);
        else if (alignment & glui.Alignment.BOTTOM) cy = y + dy;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = color;
        ctx.fillText(text, cx+bw, cy+bw, w);
    };

    public(glui, 'glui');
    public(Draw2d, 'Draw2d', glui);    
})();
