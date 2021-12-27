include('container.js');

(function() {
    function PanelRenderer2d(control, context) {
        PanelRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.ContainerRenderer2d, PanelRenderer2d);

    // PanelRenderer2d.prototype.renderControl = function renderControl() {
    //     PanelRenderer2d.base.renderControl.call(this);
    // };


    function Panel(id, template, parent, context) {
        Panel.base.constructor.call(this, id, template, parent, context);
        this.boundObject = null;
        //this.renderer3d = new PanelRenderer3d()
    }
    extend(glui.Container, Panel);

    Panel.prototype.getTemplate = function getTemplate() {
        var template = Panel.base.getTemplate.call(this);
        return template;
    };
    Panel.prototype.build = async function build(dataSource, dataField) {
        this.boundObject = dataSource;
        var source = dataField ? dataSource[dataField] : dataSource;
        for (var i in this.template.layout) {
            var elem = this.template.layout[i];
            if (elem.type) {
                var template = mergeObjects(this.template['item-template'], elem);
                template.style = mergeObjects(this.style, template.style);
                var item = await glui.create(i, template, this);
                if (source && source[item.id]) {
                    item.dataBind(source[item.id], 'value');
                }
            } else if (elem.group) {
                var grp = this.template.groups[elem.group];
                if (grp) {
                    var template = mergeObjects(this.template['group-template'], grp);
                    var itemTemplate = mergeObjects(this.template['item-template'], grp['item-template'])
                    template = mergeObjects(template, elem);
                    var items = template.items;
                    delete template.items;
                    template.type = 'Container';
                    var container = await glui.create(i, template, this);
                    var groupSource = i != 'self' ? groupSource = source[container.id] : source;
                    for (var j in items) {
                        template = mergeObjects(itemTemplate, items[j]);
                        var item = await glui.create(j, template, container);
                        if (groupSource && groupSource[item.id]) {
                            item.dataBind(groupSource[item.id], 'value');
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
