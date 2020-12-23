include('glui/glui.js');
include('math/fn.js');
(function() {

    function Renderer() {
        this.mode = 0;
        this.context = null;
        this.control = null;
        this.font = { face:null, size:0, weight:null, em:0 };
        this.border = { color: null, colorLight: null, colorDark: null,width: 0, style: null };
        this.color = [0, 0, 0];
        this.backgroundColor = null;    //[192, 192, 192];
        this.backgroundImage = null;
        this.spacing = [0, 0];
        this.padding = [0, 0];
    }
    // Renderer.prototype.accumulate = function accumulate(property, isVertical) {
    //     var node = this.control;
    //     var value = 0;
    //     while (node) {
    //         if (node[property] != undefined) {
    //             value += isVertical ? this.convertToPixelV(node[property]) : this.convertToPixel(node[property]);
    //         }
    //         node = node.parent;
    //     }
    //     return value;
    // };
    Renderer.prototype.initialize = async function initialize(control, context) {
        this.control = control || this.control;
        this.context = context || this.context;
        this.setFont(this.control.style.font);
        this.setBorder(this.control.style.border);
        this.setSpacing(this.control.style['spacing']);
        this.setPadding(this.control.style['padding']);
        this.setWidth(this.control.style.width);
        this.setHeight(this.control.style.height);
        this.control.offsetLeft = this.control.offsetLeft != -1 ? this.control.offsetLeft : this.convertToPixel(this.control.style.left);
        this.control.offsetTop = this.control.offsetTop != -1 ? this.control.offsetTop : this.convertToPixel(this.control.style.top, true);
        if (this.control.style.color != undefined) this.color = this.toColor(this.control.style.color);
        var bgColor = this.control.style['background-color'];
        if (bgColor != undefined) {
            this.backgroundColor = bgColor.toLowerCase() != 'transparent' ? this.backgroundColor = this.toColor(this.control.style['background-color']) : null;
        }
        if (this.control.style['background-image'] != 'none') {
            var res = await load(this.control.style['background-image']);
            this.backgroundImage = !res.error ? res.node : null;
        }
    };

    Renderer.prototype.setWidth = function setWidth(value) {
        var res = 0;
        if (typeof value === 'string') {
            res = this.convertToPixel(value);
            if (value == 'auto') {
                res += 2*(this.padding[0] + this.border.width);
            }
        } else if (typeof value === 'number') res = this.control.width = value;
        this.control.width = res;
        return res;
    };
    Renderer.prototype.setHeight = function setHeight(value) {
        var res = 0;
        if (typeof value === 'string') {
            res = this.convertToPixel(value, true);
            if (value == 'auto') {
                res += 2*(this.padding[1] + this.border.width);
            }
        } else if (typeof value === 'number') res = this.control.height = value;
        this.control.height = res;
        return res;
    };    

    Renderer.prototype.setBorder = function setBorder(border) {
        if (border == 'none') {
            this.border.style = 'none';
        } else {
            var tokens = border.split(' ');
            this.border.color = this.toColor(tokens[0]);
            this.border.colorLight = this.calculateColor(this.border.color, 1.6);
            this.border.colorDark = this.calculateColor(this.border.color, 0.6);
            this.border.width = parseFloat(tokens[1]);
            this.border.style = tokens[2];
        }
    };
    Renderer.prototype.setFont = function setFont(font) {
        throw new Error('Not implemented!');
    };
    Renderer.prototype.setSpacing = function setSpacing(sx, sy) {
        if (sx == undefined) {
            sx = 0;
            sy = 0;
        } else if (typeof sx === 'string') {
            var tokens = sx.split(' ');
            sx = this.convertToPixel(tokens[0]);
            sy = tokens.length > 1 ? this.convertToPixel(tokens[1], true) : sx;
        }
        this.spacing[0] = sx;
        this.spacing[1] = sy;
    };
    Renderer.prototype.setPadding = function setPadding(px, py) {
        if (px == undefined) {
            px = this.padding[0]/2;
            py = this.padding[1]/2;
        } else if (typeof px === 'string') {
            var tokens = px.split(' ');
            px = this.convertToPixel(tokens[0]);
            py = tokens.length > 1 ? this.convertToPixel(tokens[1], true) : px;
        }
        this.padding[0] = px;
        this.padding[1] = py;
    };
    
    Renderer.prototype.getAlignment = function getAlignment(align) {
        var tokens = align.split(' ');
        var alignment = 0;
        for (var i=0; i<tokens.length; i++) {
            var align = glui.Alignment[tokens[i].toUpperCase()];
            if (align) alignment |= align;
        }
        return alignment;
    };
    Renderer.prototype.convertToPixel = function convertToPixel(value, isVertical) {
        var prop = 'innerWidth';
        var fontSize = 'em';
        if (isVertical) {
            prop = 'innerHeight'
            fontSize = 'size';
        }
        var res = 0;
if (!this.control) debugger;
        if (value == undefined || value == 'auto') res = this.getBestSizeInPixel()[isVertical ? 1 : 0];
        else if (typeof value === 'number') res = value;
        else if (value.endsWith('px')) res = parseFloat(value);
        else if (value.endsWith('em')) res = this.font[fontSize] * parseFloat(value);
        else if (value.endsWith('%')) {
            var parent =  this.control.parent ? this.control.parent : glui.screen;
if (!parent.renderer) debugger;
            res = parent[prop] * parseFloat(value)/100;
        }
        return Math.floor(res);
    };
    Renderer.prototype.getBestSizeInPixel = function getBestSizeInPixel() {
        return [this.convertToPixel('6em'), this.convertToPixel('2em', true)];
    };
    Renderer.prototype.toColor = function toColor(cssColor) {
        var color = null;
        var re = null;
        if (cssColor.startsWith('rgb')) {
            re = /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
        } else if (cssColor.startsWith('#')) {
            re = /#(\w\w)(\w\w)(\w\w)/;
        }
        if (re) {
            var m = cssColor.match(re);
            color = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
        }
        return color;
    };
    Renderer.prototype.calculateColor = function calculateColor(color, factor) {
        if (color) {
            var r = color[0] * factor;
            var g = color[1] * factor;
            var b = color[2] * factor;
            if (r > 255) r = 255;
            if (g > 255) g = 255;
            if (b > 255) b = 255;
            return [r, g, b];
        } else return null;
    };
    Renderer.prototype.mixColors = function mixColors(color1, color2, factor) {
        var r = color1[0] * (1 - factor) + color2[0] * factor;
        var g = color1[1] * (1 - factor) + color2[1] * factor;
        var b = color1[2] * (1 - factor) + color2[2] * factor;
        if (r > 255) r = 255;
        if (g > 255) g = 255;
        if (b > 255) b = 255;
        return [r, g, b];
    };
    Renderer.prototype.toCssColor = function toCssColor(color) {
        return `rgb(${color[0]},${color[1]},${color[2]})`;
    };
    Renderer.prototype.render = function render(ctx) {
        throw new Error('Not implemented!');
    };
    Renderer.prototype.renderControl = function render() {
        throw new Error('Not implemented!');
    };

    publish(Renderer, 'Renderer', glui);
})();
