include('glui/value-control.js');

(function() {
    function Label(id, template, parent) {
        Label.base.constructor.call(this, id, template, parent);
    }
    extend(glui.ValueControl, Label);

    Label.prototype.render = function render(ctx, is2d) {
        Label.base.render.call(this, ctx, is2d);
        var draw = this.draw2d;
        draw.context.save();
        draw.drawRect(this.left, this.top, this.width, this.height, this.style.background);
        draw.drawText(this.getValue(), this.left-1, this.top-1, this.width, this.height, glui.calculateColor(this.style.background, 1.4), this.style.align);
        draw.drawText(this.getValue(), this.left+1, this.top+1, this.width, this.height, glui.calculateColor(this.style.background, 0.6), this.style.align);
        draw.drawText(this.getValue(), this.left, this.top, this.width, this.height, this.style.color, this.style.align);

        draw.drawBorder(this.left, this.top, this.width, this.height);

        draw.context.restore();
    };

    // Label.prototype.render3d = function render3d(gl) {

    // };

    public(Label, 'Label', glui);
})();