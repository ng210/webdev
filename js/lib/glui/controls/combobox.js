include('value-control.js');
include('renderer2d.js');

(function() {
    function ComboboxRenderer2d(control, context) {
        ComboboxRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.LabelRenderer2d, ComboboxRenderer2d);

    ComboboxRenderer2d.prototype.renderControl = function renderControl() {
        ComboboxRenderer2d.base.renderControl.call(this);
    };


    function Combobox(id, template, parent, context) {
        Combobox.base.constructor.call(this, id, template, parent, context);
        //this.renderer3d = new ComboboxRenderer3d()
    }
    extend(glui.Label, Textbox);

    Combobox.prototype.setRenderer = function(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = new ComboboxRenderer2d(this, context);
            }
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = new ComboboxRenderer3d(this, context);
            }
            this.renderer = this.renderer3d;
        }
    };

    Combobox.prototype.getTemplate = function getTemplate() {
        var template = Combobox.base.getTemplate.call(this);
        template.autoComplete = false;
        template.readonly = true;
        template.rows = 3;
        return template;
    };

    Combobox.prototype.getHandlers = function getHandlers() {
        var handlers = Combobox.base.getHandlers();
        handlers.push('focus', 'blur', 'mousedown', 'mouseup', 'click', 'keydown', 'keyup',);
        return handlers;
    };

    public(Combobox, 'Combobox', glui);
})();