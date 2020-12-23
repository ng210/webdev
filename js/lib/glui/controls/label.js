include('value-control.js');
include('renderer2d.js');

(function() {
    function LabelRenderer2d() {
        LabelRenderer2d.base.constructor.call(this);
    }
    extend(glui.Renderer2d, LabelRenderer2d);

    LabelRenderer2d.prototype.getBestSizeInPixel = function getBestSizeInPixel() {
        var lines = this.getLines();
        var boxes = this.getTextBoundingBoxes(lines);
        var w = 0, h = this.font.size * boxes.length;
        for (var i=0; i<boxes.length; i++) {
            w += boxes[i][2];
        }
        return [Math.ceil(w), h];
    };
    LabelRenderer2d.prototype.getLines = function getLines() {
        var value = this.control.getValue();
        if (value != undefined) {
            if (this.control.isNumeric && value != '') {
                lines = [value.toFixed(this.control.decimalDigits)];
            } else {
                lines = value.toString().split('\n');
            }
        } else {
            lines = [];
        }
        return lines;
    };

    LabelRenderer2d.prototype.renderControl = function renderControl() {
        var lines = this.getLines();
        var boxes = this.getTextBoundingBoxes(lines);
        var bgColor = this.backgroundColor || this.color;
        for (var i=0; i<lines.length; i++) {
            //this.drawText(lines[i], boxes[i][0]-1, boxes[i][1]-1, boxes[i][2], this.calculateColor(bgColor, 1.4));
            this.drawText(lines[i], boxes[i][0]+0.5, boxes[i][1]+0.5, boxes[i][2], this.calculateColor(bgColor, 0.8));
            this.drawText(lines[i], boxes[i][0], boxes[i][1], boxes[i][2], this.color);
        }
    };


    function Label(id, template, parent, context) {
        Label.base.constructor.call(this, id, template, parent, context);
        //this.renderer3d = new LabelRenderer3d()
    }
    extend(glui.ValueControl, Label);

    Label.prototype.getTemplate = function getTemplate() {
        var template = Label.base.getTemplate.call(this);
        template.type = 'Label';
        return template;
    };
    Label.prototype.createRenderer = mode => mode == glui.Render2d ? new LabelRenderer2d() : 'LabelRenderer3d';

    publish(Label, 'Label', glui);
    publish(LabelRenderer2d, 'LabelRenderer2d', glui);
})();
