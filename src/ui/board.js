include('/ui/control.js');
// unstructured container of controls
(function() {
	Ui.Board = function(id, template) {
		Ui.Control.call(this, id, template);
		this.items = [];
		this.constructor = Ui.Board;
	}
	Ui.Board.base = Ui.Control.prototype;
	Ui.Board.prototype = new Ui.Control('board');
	Ui.Control.Types['board'] = { ctor: Ui.Board, tag: 'DIV' };

	Ui.Board.prototype.add = function(ctrl, key) {
		this.items[key] = ctrl;
	};
	Ui.Board.prototype.addNew = function(template, key) {
		key = key || ('i' + Object.keys(this.id).length.toFixed(4));
		var ctrl = Ui.Control.create(key, template);
		this.add(ctrl, key);
	};
	Ui.Board.prototype.dataBind = function(obj, field) {
		this.dataSource = obj;
		for (var key in this.items) {
			var item = items[key];
			if (item.dataSource == null) {
				; // todo
			}
		}
	};
	Ui.Board.prototype.render = function() {
		while (this.element.childNodes.length > 0) {
			var child = this.element.childNodes[0];
			this.element.removeChild(child);
		}
		for (var key in this.items) {
			var item = items[key];
			if (item.element == null) {
				item.render( { node: this.element } );
			}
		}
	};
})();