include('renderer.js');
(function() {

    function Renderer2d() {
        Renderer2d.base.constructor.call(this);
        this.mode = glui.Render2d;
    }
    extend(glui.Renderer, Renderer2d);

    Renderer2d.prototype.setFont = function setFont(font) {
        var tokens = font.split(' ');
        this.font.face = tokens[0];
        this.font.size = parseFloat(tokens[1]);
        this.font.weight = tokens[2];
        this.applyFont();
        var metrics = this.context.measureText('@(Q.');
        this.font.em = metrics.width/4;
    };
    Renderer2d.prototype.applyFont = function applyFont() {
        this.context.font = `${this.font.weight || ''} ${this.font.size}px ${this.font.face}`;
    };
    Renderer2d.prototype.drawBorder = function drawBorder(x, y, w, h) {
        if (this.border.style == 'none') return;
        var ctx = this.context;
        var bw = this.border.width;
        if (bw == 0) return;
        var bw2 = Math.floor(this.border.width/2);
        var x1 = x+bw2, x2 = x+w, x3 = x+w-bw2;
        var y1 = y+bw2, y2 = y+h;
        var lw = ctx.lineWidth;
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
        ctx.strokeStyle = this.toCssColor(color1);
        ctx.moveTo(x1, y2); ctx.lineTo(x1, y1); ctx.lineTo(x2, y1);
        ctx.stroke();
    
        ctx.beginPath();
        ctx.strokeStyle = this.toCssColor(color2);
        ctx.moveTo(x2-bw2, y1+bw2); ctx.lineTo(x3, y2-bw2); ctx.lineTo(x1-1, y2-bw2);
        ctx.stroke();
       
        ctx.lineWidth = lw;
    };
    Renderer2d.prototype.drawRect = function drawRect(x, y, w, h, color) {
        var ctx = this.context;
        ctx.fillStyle = this.toCssColor(color);
        ctx.fillRect(x, y, w, h);
    };
    Renderer2d.prototype.drawText = function drawText(text, x, y, w, color) {
        var ctx = this.context;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = this.toCssColor(color);
        ctx.fillText(text, x, y, w);
    };
    Renderer2d.prototype.getTextBoundingBoxes = function getTextBoundingBoxes(lines) {
        var boxes = [];
        var cx = 2*(this.border.width + this.padding[0]);
        var cy = 2*(this.border.width + this.padding[1]);
        var alignment = this.getAlignment(this.control.style.align);

        var y = 0;
        var h = lines.length * this.font.size;
        var dy = this.control.height - cy - h;
        if (alignment & glui.Alignment.MIDDLE) y += Math.floor(dy/2);
        else if (alignment & glui.Alignment.BOTTOM) y += dy;
        this.applyFont();
        for (var i=0; i<lines.length; i++) {
            var metrics = this.context.measureText(lines[i]);
            var w = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
            var dx = this.control.width - cx - w;
            var x = 0;
            if (alignment & glui.Alignment.CENTER) x += Math.floor(dx/2);
            else if (alignment & glui.Alignment.RIGHT) x += dx;
            boxes.push([x, y, w]);
            y += this.font.size;
        }
        return boxes;
    };
    Renderer2d.prototype.drawImage = function drawImage(image, dx, dy, dw, dh, sx, sy, sw, sh) {
        var ctx = this.context;
        sw = sw || image.width;
        sh = sh || image.height;
        dw = dw || this.control.width;
        dh = dh || this.control.height;
        sx = sx || 0;
        sy = sy || 0;
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    };
    Renderer2d.prototype.render = function render() {
        var ctrl = this.control;
        if (ctrl.style.visible) {
            var rect = ctrl.getClippingRect();
            if (rect != null) {
                this.context.save();
                // set clipping area
                var region = new Path2D();
                this.context.setTransform(1, 0, 0, 1, rect[0], rect[1]);
                region.rect(0, 0, rect[2], rect[3]);
                this.context.clip(region);
                if (this.backgroundColor) this.drawRect(0, 0, ctrl.width, ctrl.height, this.backgroundColor);
                if (this.backgroundImage) {
                    var wi = this.bgRepeatX ? this.backgroundImage.width : rect[2];
                    var he = this.bgRepeatX ? this.backgroundImage.height : rect[3];
                    for (var y=0; y<rect[3]; y+=he) {
                        for (var x=0; x<rect[2]; x+=wi) {
                            this.drawImage(this.backgroundImage, x, y, wi, he, 0, 0, this.backgroundImage.width, this.backgroundImage.height);
                        }
                    }
                }

                var width = ctrl.width;
                var height = ctrl.height;
                if (this.border.style) {
                    this.drawBorder(0, 0, ctrl.width, ctrl.height);
                    width -= 2*this.border.width;
                    height -= 2*this.border.width;
                }
                if (ctrl.innerWidth > ctrl.width) {
                    // draw x-scrollbar
                    width -= 16;
                }
                if (ctrl.innerHeight > ctrl.height) {
                    // draw y-scrollbar
                    height -= 16;
                }
                // render control
                if (ctrl.style.font) this.setFont(ctrl.style.font);
                var bw = this.border.width;
                rect[0] += this.padding[0] + bw;
                rect[1] += this.padding[1] + bw;
                if (rect[2] > ctrl.innerWidth) rect[2] = ctrl.innerWidth;
                if (rect[3] > ctrl.innerHeight) rect[3] = ctrl.innerHeight;
                this.context.setTransform(1, 0, 0, 1, rect[0], rect[1]);
                region = new Path2D();
                region.rect(0, 0, rect[2], rect[3]);
                this.context.clip(region);
                this.renderControl();
                this.context.restore();
            }            
        }
    };

    publish(Renderer2d, 'Renderer2d', glui);
})();