include('/glui/icontrol.js');
include('/ui/datalink.js');

(function() {

    function Control(id, template, parent) {
        this.id = id || 'ctrl';
        this.parent = parent || null;
        this.template = null;

        this.applyTemplate(template);

        this.handlers = {};
    }
    extend(glui.IControl, Control);

    Control.prototype.construct = function construct(node) {
        var template = {};
        for (var i in node.attributes) {
            if (node.attributes.hasOwnProperty(i)) {
                var name = node.attributes[i].name;
                template[name] = node.attributes[i].value;
            }
        }
        this.applyTemplate(template);
    };
    Control.prototype.getHandlers = function getHandlers() {
        return {
            'click': null,
            'mouseover': null,
            'mouseout': null
        }
    };
    Control.prototype.getTemplate = function getTemplate() {
        var template = {
            'id': this.id || 'ctrl',
            'type': 'control',
            'label': false,
            'disabled': false,
            'data-source': null,
            'data-field': null,
            'style': null
        };
        var handlers = this.getHandlers();
        for (var i in handlers) {
            if (handlers.hasOwnProperty(i)) {
                template['on'+i] = handlers[i];
            }
        }

        return template;
    };

    Control.prototype.dataBind = function dataBind(source, field) {
        source = source || this.dataSource;
        if (source) {
            this.dataSource = source instanceof Ui.DataLink ? source : new Ui.DataLink(source);
            this.dataField = field !== undefined ? field : this.dataField;
            this.dataSource.add(this.dataField);
        }
    };
    Control.prototype.addHandler = function registerHandler(eventName) {
        var handlers = this.getHandlers();
        if (Object.keys(handlers).contains(eventName)) {
            var nodes = [];
            var node = this;
            while (node) {
                nodes.push(node);
                node = node.parent;
            }
            for (var i=0; i<nodes.length; i++) {
                node = nodes[i];
                var handler = node['on'+eventName];
                if (handler !== undefined) {
                    if (typeof handler === 'function') {
                        if (this.handlers[eventName] === undefined) {
                            this.handlers[eventName] = [];
                        }
                        if (this.handlers[eventName].findIndex(x => x.obj == node && x.fn == handler) == -1) {
                            this.handlers[eventName].push({obj:node, fn:handler});
                        }
                    }
                }
            }
        } else {
            throw new Error(`${this.constructor.name} does not support ${event}!`);
        }
    };
	Control.prototype.applyTemplate = function(tmpl) {
		this.template = this.getTemplate();
		for (var i in tmpl) {
			if (this.template.hasOwnProperty(i) && tmpl[i] != undefined) {
				this.template[i] = tmpl[i];
			} else {
				console.log(`${this.constructor.name}.template does not define '${i}'`);
			}
        }

        this.id = this.template.id;
        this.type = this.template.type;
        this.disabled = this.template.disabled;
        this.dataSource = this.template['data-source'];
        this.dataField = this.template['data-field'];

        this.style = this.template.style;
        this.label = null;
	};
    Control.prototype.render = function render(gl) {
        throw new Error('Not implemented!');
    };

    public(Control, 'Control', glui);

})();