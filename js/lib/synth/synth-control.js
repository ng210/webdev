include('glui/controls/container.js');

(function() {
    function SynthRenderer2d(control, context) {
        SynthRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.ContainerRenderer2d, SynthRenderer2d);

    // SynthRenderer2d.prototype.renderControl = function renderControl() {
    // };


    function Synth(id, template, parent, context) {
        Synth.base.constructor.call(this, id, template, parent, context);
        //this.renderer3d = new SynthRenderer3d()
    }
    extend(glui.Container, Synth);

    Synth.prototype.getTemplate = function getTemplate() {
        var template = Synth.base.getTemplate.call(this);
        return template;
    };
    Synth.prototype.build = async function build(synth) {
        for (var i in this.template.layout) {
            var elem = this.template.layout[i];
            if (elem.type) {
                var template = mergeObjects(this.template['elem-template'], elem);
                var ctrl = await glui.create(i, template, this);
                ctrl.dataBind(synth.controls[ctrl.id], 'value');
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
                        ctrl.dataBind(synth.controls[container.id][ctrl.id], 'value');
                    }
                }
            }
        }
    };
    Synth.prototype.createRenderer = mode => mode == glui.Render2d ? new SynthRenderer2d() : 'SynthRenderer3d';

    publish(Synth, 'Synth', glui);
    publish(SynthRenderer2d, 'SynthRenderer2d', glui);
})();
