include('/ui/valuecontrol.js');

(function() {
	function Slider(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	};
	extend(Ui.ValueControl, Slider);

	Ui.Control.Types['slider'] = { ctor: Slider, tag: 'INPUT' };

	Slider.prototype.getTemplate = function() {
		var template = Slider.base.getTemplate();
		template.type = 'slider';
		return template;
	};
	Slider.prototype.ondragging = function(e) {
		alert(1);
	};

	Slider.prototype.render = function(ctx) {
		Slider.base.render.call(this, ctx);
		this.element.setAttribute('type', 'range');
		this.element.setAttribute('min', this.min);
		this.element.setAttribute('max', this.max);
		this.element.setAttribute('step', this.step);
		//this.element.setAttribute('size', this.template.size || 4);
	};

	Ui.Slider = Slider;
})();