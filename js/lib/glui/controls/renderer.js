include('glui/glui.js');
(function() {

    function Renderer(control, context) {
        this.context = context;
        this.control = control;
        this.font = { face:null, size:0, weight:null, em:0 };
        this.border = { color: null, colorLight: null, colorDark: null,width: 0, style: null };
        this.color = [0, 0, 0];
        this.backgroundColor = [192, 192, 192];
        if (control) {
            this.initialize();
        }
    }
    Renderer.prototype.initialize = function initialize() {
        this.control.left = this.convertToPixel(this.control.style.left);
        this.control.top = this.convertToPixelV(this.control.style.top);
        this.control.width = this.convertToPixel(this.control.style.width);
        this.control.height = this.convertToPixelV(this.control.style.height);
        this.setFont(this.control.style.font);
        this.setBorder(this.control.style.border);
        this.color = this.toColor(this.control.style.color) || this.color;
        this.backgroundColor = this.toColor(this.control.style.background) || this.backgroundColor;
    };
    Renderer.prototype.setBorder = function setBorder(border) {
        var tokens = border.split(' ');
        this.border.color = this.toColor(tokens[0]);
        this.border.colorLight = this.calculateColor(this.border.color, 1.6);
        this.border.colorDark = this.calculateColor(this.border.color, 0.6);
        this.border.width = parseFloat(tokens[1]);
        this.border.style = tokens[2];
    };
    Renderer.prototype.setFont = function setFont(font) {
        throw new Error('Not implemented!');
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
    Renderer.prototype.convertToPixel = function convertToPixel(value) {
        var res = 0;
        if (typeof value === 'number') res = value;
        else if (value.endsWith('px')) res = parseFloat(value);
        else if (value.endsWith('%')) res = this.control.parent.width * parseFloat(value)/100;
        else if (value.endsWith('em')) res = this.font.em * parseFloat(value);
        return Math.round(res);
    };
    Renderer.prototype.convertToPixelV = function convertToPixel(value) {
        var res = 0;
        if (typeof value === 'number') res = value;
        else if (value.endsWith('px')) res = parseFloat(value);
        else if (value.endsWith('%')) res = this.control.parent.height * parseFloat(value)/100;
        else if (value.endsWith('em')) res = this.font.size * parseFloat(value);
        return Math.round(res);
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
        var r = color[0] * factor;
        var g = color[1] * factor;
        var b = color[2] * factor;
        if (r > 255) r = 255;
        if (g > 255) g = 255;
        if (b > 255) b = 255;
        return [r, g, b];
    };
    Renderer.prototype.mixColors = function mixColorsa(color1, color2, factor) {
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

    public(Renderer, 'Renderer', glui);
})();
