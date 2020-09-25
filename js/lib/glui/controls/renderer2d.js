include('renderer.js');
(function() {

    function Renderer2d() {
        Renderer2d.base.constructor.call(this);
    }
    extend(glui.Renderer, Renderer2d);

    Renderer2d.prototype.setFont = function setFont(font) {
        var tokens = font.split(' ');
        this.font.face = tokens[0];
        this.font.size = parseFloat(tokens[1]);
        this.font.weight = tokens[2];
        this.context.font = `${this.font.weight || ''} ${this.font.size}px ${this.font.face}`;
        var metrics = this.context.measureText('@(Q.');
        this.font.em = metrics.width/4;
    };
    Renderer2d.prototype.drawBorder = function drawBorder(x, y, w, h) {
        if (this.border.style == 'none') return;
        var ctx = this.context;
        var bw = this.border.width;
        var bw2 = Math.floor(this.border.width/2);
        var x1 = x+bw2, x2 = x+w, x3 = x+w-bw2;
        var y1 = y+bw2, y2 = y+h;
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
    Renderer2d.prototype.getTextBoundingBoxes = function getBoundingBoxes(lines) {
        var boxes = [];
        var bw = this.border.width;
        var y = bw, w = 0;
        var h = lines.length * this.font.size;
        var alignment = this.getAlignment(this.control.style.align);
        var dy = this.control.height - 2*bw - h; //if (dy < 0) dy = 2*bw;
        if (alignment & glui.Alignment.MIDDLE) y += Math.floor(dy/2);
        else if (alignment & glui.Alignment.BOTTOM) y += dy;
        for (var i=0; i<lines.length; i++) {
            var metrics = this.context.measureText(lines[i]);
            var w = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
            var dx = this.control.width - 2*bw - w; //if (dx < 0) dx = 0;
            var x = bw;
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
        // set clipping area
        this.context.save();
        var region = new Path2D();
        // var borderWidth = ctrl.parent && ctrl.parent.renderer ? ctrl.parent.renderer.border.width : 0;
        // var left = ctrl.left + borderWidth;
        // var top = ctrl.top + borderWidth;
        this.context.setTransform(1, 0, 0, 1, ctrl.left, ctrl.top);
        //this.context.translate(ctrl.offsetLeft, ctrl.offsetTop);
        region.rect(0, 0, ctrl.width, ctrl.height);
        this.context.clip(region);
        if (this.backgroundColor) this.drawRect(0, 0, this.control.width, this.control.height, this.backgroundColor);
        var width = ctrl.width;
        var height = ctrl.height;
        if (this.border.style) {
            this.drawBorder(0, 0, this.control.width, this.control.height);
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
        region = new Path2D();
        region.rect(this.border.width, this.border.width, width, height);
        this.context.clip(region);
        if (this.control.style.font) this.setFont(this.control.style.font);
        this.renderControl();
        this.context.restore();
    };

    publish(Renderer2d, 'Renderer2d', glui);
})();