include('glui/controls/container.js');

(function() {
    function PanelRenderer2d(control, context) {
        PanelRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.ContainerRenderer2d, PanelRenderer2d);

    // PanelRenderer2d.prototype.renderControl = function renderControl() {
    // };


    function Panel(id, template, parent, context) {
        Panel.base.constructor.call(this, id, template, parent, context);
        //this.renderer3d = new PanelRenderer3d()
    }
    extend(glui.Container, Panel);

    Panel.prototype.getTemplate = function getTemplate() {
        var template = Panel.base.getTemplate.call(this);
        return template;
    };
    Panel.prototype.build = async function build(obj) {
        for (var i in this.template.layout) {
            var elem = this.template.layout[i];
            if (elem.type) {
                var template = mergeObjects(this.template['elem-template'], elem);
                var ctrl = await glui.create(i, template, this);
                if (obj) {
                    ctrl.dataBind(obj.controls[ctrl.id], 'value');
                }
            } else if (elem.group) {
                var grp = this.template.groups[elem.group];
                if (grp) {
                    var template = mergeObjects(this.template['group-template'], grp);
                    template = mergeObjects(template, elem);
                    template.type = 'Container';
                    var container = await glui.create(i, template, this);
                    for (var j in grp.controls) {
                        template = mergeObjects(this.template['elem-template'], grp.controls[j]);
                        ctrl = await glui.create(j, template, container);
                        if (obj) {
                            ctrl.dataBind(obj.controls[container.id][ctrl.id], 'value');
                        }
                    }
                }
            }
        }
    };
    Panel.prototype.createRenderer = mode => mode == glui.Render2d ? new PanelRenderer2d() : 'PanelRenderer3d';

    publish(Panel, 'Panel', glui);
    publish(PanelRenderer2d, 'PanelRenderer2d', glui);
})();
