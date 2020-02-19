include('/ui/valuecontrol.js');

(function() {
	Textbox = function(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	};
	extend(Ui.ValueControl, Textbox);

	Ui.Control.Types['Textbox'] = { ctor: Textbox, tag: 'INPUT' };

	Textbox.prototype.getTemplate = function getTemplate() {
		var template = Textbox.base.getTemplate();
		template.type = 'Textbox';
		return template;
	};

	Textbox.prototype.registerHandler = function registerHandler(event) {
		if (['change', 'key'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
    };
    Textbox.prototype.render = function render(ctx) {
    	Textbox.base.render.call(this, ctx);
	    this.element.setAttribute('type', 'text');
		this.element.setAttribute('size', this.template.size || 4);
	};
	Ui.Textbox = Textbox;
})();