include('/ui/control.js');

// Abstract base type for container controls
(function() {
    function Container(id, template, parent) {
        Ui.Control.call(this, id, template, parent);
        this.titleBarText = null;
        if (this.template.titlebar != undefined && this.template.titlebar !== false && this.template.titlebar != '') {
            this.titleBarText = this.template.titlebar === true ? this.id : this.template.titlebar;
        }
        this.titleBar = null;
    }
    extend(Ui.Control, Container);

	Container.prototype.getTemplate = function() {
        var template = Container.base.getTemplate.call(this);
        template.fixed = false;
        template.titlebar = this.id;
        return template;
	};
	Container.prototype.registerHandler = function(event) {
        if (['click', 'mouseover', 'mouseout'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };
    Container.prototype.render = function(ctx) {
        Container.base.render.call(this, ctx);
        // eventually create titlebar
        if (this.titleBar == null && this.titleBarText) {
            this.titleBar = new Ui.Label(this.id + '_title', {css:'titlebar', value:this.titleBarText, events:['click']}, this);
        }
        if (this.titleBar != null) {
            this.titleBar.render({element:this.element});
        }
    };
    Ui.Container = Container;

})();