include('/ui/control.js');

// Abstract base type for container controls
(function() {
    function Container(id, template, parent) {
        Ui.Control.call(this, id, template, parent);
        this.titleBar = null;
    }
    extend(Ui.Control, Container);

	Container.prototype.getTemplate = function() {
        var template = Container.base.getTemplate();
        template.fixed = false;
        template.titlebar = this.id;
        return template;
	};
	Container.prototype.registerHandler = function(event) {
        if (['click', 'mouseover', 'mouseout'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };
	Container.prototype.dataBind = function(dataSource, dataField) {
		this.dataSource = dataSource instanceof Ui.DataLink ? dataSource : new Ui.DataLink(dataSource);
		this.dataField = dataField !== undefined ? dataField : this.dataField;
	};
    Container.prototype.render = function(node) {
        Container.base.render.call(this, node);
        // eventually create titlebar
        if (this.titleBar === null && this.template.titlebar) {
            this.titleBar = document.createElement('div');
            this.titleBar.id = this.id + '#title';
            this.titleBar.className = this.cssText + 'titlebar';
            this.titleBar.innerHTML = this.template.titlebar;
            this.titleBar.control = this;
            this.element.insertBefore(this.titleBar, this.element.childNodes[0]);
        }
    };
    Ui.Container = Container;

})();