include('/ui/control.js');
// unstructured container of controls
(function() {
	Ui.Board = function(id, template) {
		Ui.Control.call(this, id, template);
		this.items = {};

		this.constructor = Ui.Board;
	}
	Ui.Board.base = Ui.Control.prototype;
	Ui.Board.prototype = new Ui.Control('board');
	Ui.Control.Types['board'] = { ctor: Ui.Board, tag: 'DIV' };

	Ui.Board.prototype.add = function(ctrl, key) {
		this.items[key] = ctrl;
		//ctrl.parent = this;
		return ctrl;
	};
	Ui.Board.prototype.addNew = function(template, key) {
		key = key || ('i' + Object.keys(this.items).length);
		var ctrl = Ui.Control.create(key, template, this);
		this.add(ctrl, key);
		return ctrl;
	};
	Ui.Board.prototype.dataBind = function(obj, field) {
		Ui.Grid.base.dataBind.call(this, obj, field);
		for (var key in this.items) {
			var item = this.items[key];
			if (item.dataSource == null) {
				item.dataBind(this.dataSource);
			}
		}
	};
	Ui.Board.prototype.render = function(ctx) {
		Ui.Board.base.render.call(this, ctx);
		while (this.element.childNodes.length > 0) {
			var item = this.element.childNodes[0];
			this.element.removeChild(item);
		}
		for (var key in this.items) {
			var item = items[key];
			if (item.element == null) {
				item.render( { node: this.element } );
			}
		}
	};
})();