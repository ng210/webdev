include('value-control.js');
include('renderer2d.js');

(function() {
    function LabelRenderer2d(control, context) {
        LabelRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, LabelRenderer2d);

    LabelRenderer2d.prototype.renderControl = function renderControl() {
        var lines = null;
        var value = this.control.getValue();
        if (value) {
            if (this.control.isNumeric) {
                lines = [value.toFixed(this.control.decimalDigits)];
            } else {
                lines = value.split('\\n');
            }
        } else {
            lines = [];
        }
        var boxes = this.getTextBoundingBoxes(lines);
        for (var i=0; i<lines.length; i++) {
            this.drawText(lines[i], boxes[i][0]-1, boxes[i][1]-1, boxes[i][2], this.calculateColor(this.backgroundColor, 1.4));
            this.drawText(lines[i], boxes[i][0]+1, boxes[i][1]+1, boxes[i][2], this.calculateColor(this.backgroundColor, 0.6));
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
    Label.prototype.setRenderer = function(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = new LabelRenderer2d(this, context);
            }
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = new LabelRenderer3d(this, context);
            }
            this.renderer = this.renderer3d;
        }
    };

    public(Label, 'Label', glui);
    public(LabelRenderer2d, 'LabelRenderer2d', glui);
})();
