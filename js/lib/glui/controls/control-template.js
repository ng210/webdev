include('control.js');
include('renderer2d.js');

(function() {
    function TemplateRenderer2d(control, context) {
        TemplateRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, TemplateRenderer2d);

    TemplateRenderer2d.prototype.renderControl = function renderControl() {
    };


    function Template(id, template, parent, context) {
        Template.base.constructor.call(this, id, template, parent, context);
        //this.renderer3d = new TemplateRenderer3d()
    }
    extend(glui.Control, Template);

    Template.prototype.getTemplate = function getTemplate() {
        var template = Template.base.getTemplate.call(this);
        return template;
    };
    Template.prototype.setRenderer = function(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = new TemplateRenderer2d(this, context);
            }
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = new TemplateRenderer3d(this, context);
            }
            this.renderer = this.renderer3d;
        }
    };

    publish(Template, 'Template', glui);
    publish(TemplateRenderer2d, 'TemplateRenderer2d', glui);
})();
