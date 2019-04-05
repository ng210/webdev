include('/ui/valuecontrol.js');

(function() {
	Ui.Label = function(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	};
	Ui.Label.base = Ui.ValueControl.prototype;
	Ui.Label.prototype = new Ui.ValueControl('label');
	Ui.Control.Types['label'] = { ctor: Ui.Slider, tag: 'SPAN' };
	
	Ui.Label.prototype.render = function(ctx) {
    	Ui.Label.base.render.call(this, ctx);
    };

})();