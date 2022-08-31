include('value-control.js');
include('label.js');

(function() {
    //#region ButtonRenderer2d
    function ButtonRenderer2d(control, context) {
        ButtonRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.LabelRenderer2d, ButtonRenderer2d);

    ButtonRenderer2d.prototype.renderControl = function renderControl() {
        var color1, color2;
        var offs = 0;
        if (this.control.state) {
            offs = this.border.width;
            color2 = this.calculateColor(this.backgroundColor, 1.4);
            color1 = this.calculateColor(this.backgroundColor, 0.6);
        } else {
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
    ButtonRenderer2d.prototype.render = function render() {
        this.control.renderer.border.style = this.control.state ? 'inset' : 'outset';
        ButtonRenderer2d.base.render.call(this);
    };
    //#endregion

    //#region Button
    function Button(id, template, parent, context) {
        Button.base.constructor.call(this, id, template, parent, context);
        this.command = null;
        this.state = false;
        //this.renderer3d = new ButtonRenderer3d()
    }
    extend(glui.Label, Button);

    Button.prototype.createRenderer = mode => mode == glui.Render2d ? new ButtonRenderer2d() : 'ButtonRenderer3d';

    Button.prototype.getTemplate = function getTemplate() {
        var template = Button.base.getTemplate.call(this);
        template.command = 'command';
        return template;
    };
    Button.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = Button.base.applyTemplate.call(this, tmpl);
        this.command = template.command;
        return template;
    };

    Button.prototype.getHandlers = function getHandlers() {
        var handlers = Button.base.getHandlers();
        handlers.push(
            { name: 'mousedown', topDown: true },
            { name: 'mouseup', topDown: false }
        );
        return handlers;
    };

    Button.prototype.onmouseout = function onmouseout(e) {
        this.state = false;
        Button.base.onmouseout.call(this, e);
    };

    Button.prototype.onmousedown = function onmousedown(e) {
        this.state = true;
        this.render();
    };

    Button.prototype.onmouseup = function onmouseup(e) {
        this.state = false;
        this.render();
    };

    //#endregion
    glui.buildType({
        'name':'Button',
        'type':'Label',
        'attributes': {
            'command': { 'type':'string', 'isRequired':false }
        }
    });
    
    publish(Button, 'Button', glui);
})();