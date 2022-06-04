include('container.js');
include('renderer2d.js');
include('/lib/data/graph.js');

(function() {
    function GraphViewRenderer2d(control, context) {
        GraphViewRenderer2d.base.constructor.call(this, control, context);
        // cache for nodes' controls
        this.nodes = {};
    }
    extend(glui.ContainerRenderer2d, GraphViewRenderer2d);

    GraphViewRenderer2d.prototype.renderControl = function renderControl() {
        if (Object.keys(this.nodes) == 0) {
            this.update();
        }
        GraphViewRenderer2d.base.renderControl.call(this);
    };

    GraphViewRenderer2d.prototype.update = function update() {
        var graph = this.control.getData();
        // create controls for each node using the node-template
        for (var i=0; i<graph.vertices.length; i++) {
            var v = graph.vertices[i];
            if (!this.nodes[v.id]) {
                var ctrl = glui.create(v.id, this.control.nodeTemplate, this.control, this.control.context);
                this.nodes[v.id] = ctrl;
                if (ctrl.dataField) {
                    ctrl.dataBind(v.data, dataField);
                } else {
                    ctrl.dataBind(v, 'data');
                }
                ctrl.move(i*80, 10);
            }
        }
    };

    function GraphView(id, template, parent, context) {
        GraphView.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Container, GraphView);

    GraphView.prototype.getTemplate = function getTemplate() {
        var template = GraphView.base.getTemplate.call(this);
        template['label-style'] = {
            'font': 'Arial 12',
            'align':'center middle'
        };
        template['look'] = {
            'type': 'arc',
            'arc-max': '120'
        };
        template['node-template'] = {
            'type':'Label',
            'data-type': 'string',
            'style': {
                'font': 'Arial 10',
                'width':'2em', 'height':'2.2em',
                'align':'left middle',
                'border':'#808080 1px inset',
                'background-color': '#808080',
                'background-image': 'none'
            },
            'data-source':'',
            'data-field':''
        };
        return template;
    };
    GraphView.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = GraphView.base.applyTemplate.call(this, tmpl);
        this.nodeTemplate = template['node-template'];
        // set style and other attributes
        return template;
    };
    GraphView.prototype.createRenderer = mode => mode == glui.Render2d ? new GraphViewRenderer2d() : 'GraphViewRenderer3d';
    GraphView.prototype.setRenderer = async function(mode, context) {
        await GraphView.base.setRenderer.call(this, mode, context);
    };

    GraphView.prototype.update = function update() {
        // do data updates
        if (this.getValue()) {
            this.renderer.update();
        }
    };

    GraphView.prototype.getData = function getData() {
        var data = this.dataSource;
        if (this.dataSource && this.dataField) {
            data = this.dataSource[this.dataField];
        }
        return data;
    };

    GraphView.prototype.getHandlers = function getHandlers() {
        var handlers = GraphView.base.getHandlers();
        handlers.push(
            {
                name: 'eventName', topDown: true
            }
        );
        return handlers;
    };


    publish(GraphView, 'GraphView', glui);
    publish(GraphViewRenderer2d, 'GraphViewRenderer2d', glui);
})();
