include('value-control.js');
include('renderer2d.js');

(function() {
    function ButtonRenderer2d(control, context) {
        ButtonRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.LabelRenderer2d, ButtonRenderer2d);

    ButtonRenderer2d.prototype.renderControl = function renderControl() {
        var color1, color2;
        if (this.control.state) {
            this.border.style = this.control.state ? 'inset' : 'outset';    
            var offs = this.control.state ? this.border.width : 0;
            color2 = this.calculateColor(this.backgroundColor, 1.4);
            color1 = this.calculateColor(this.backgroundColor, 0.6);
        } else {
            this.border.style = this.control.state ? 'inset' : 'outset';    
            var offs = this.control.state ? this.border.width : 0;
            color1 = this.calculateColor(this.backgroundColor, 1.4);
            color2 = this.calculateColor(this.backgroundColor, 0.6);
        }
        var value = this.control.getValue();
        var lines = value ? value.split('\\n') : [];
        var boxes = this.getTextBoundingBoxes(lines);
        for (var i=0; i<lines.length; i++) {
            this.drawText(lines[i], offs+boxes[i][0]-1, offs+boxes[i][1]-1, boxes[i][2], color1);
            this.drawText(lines[i], offs+boxes[i][0]+1, offs+boxes[i][1]+1, boxes[i][2], color2);
            this.drawText(lines[i], offs+boxes[i][0], offs+boxes[i][1], boxes[i][2], this.color);
        }
    };


    function Button(id, template, parent) {
        Button.base.constructor.call(this, id, template, parent);
        this.state = false;
        //this.renderer3d = new ButtonRenderer3d()
    }
    extend(glui.Label, Button);

    Button.prototype.setRenderer = function(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = new ButtonRenderer2d(this, context);
            }
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = new ButtonRenderer3d(this, context);
            }
            this.renderer = this.renderer3d;
        }
    };

    Button.prototype.getHandlers = function getHandlers() {
        var handlers = Button.base.getHandlers();
        handlers.push('mousedown', 'mouseup', 'click');
        return handlers;
    };

    Button.prototype.onmouseout = function(e) {
        Button.base.onmouseout.call(this, e);
        this.state = false;
        this.render();
    };

    Button.prototype.onmousedown = function(e) {
        this.state = true;
        this.render();
    };

    Button.prototype.onmouseup = function(e) {
        this.state = false;
        this.render();
    };

    public(Button, 'Button', glui);
})();