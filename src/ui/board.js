include('/ui/container.js');

// unstructured container of controls
(function() {
	Ui.Board = function(id, template) {
		Ui.Control.call(this, id, template);
		this.items = {};
		this.constructor = Ui.Board;
	}
	Ui.Board.base = Ui.Container.prototype;
	Ui.Board.prototype = new Ui.Container('board');
	Ui.Control.Types['board'] = { ctor: Ui.Board, tag: 'DIV' };

	Ui.Board.prototype.add = function(ctrl, key) {
		this.items[key] = ctrl;
		ctrl.parent = this;
		return ctrl;
	};
	Ui.Board.prototype.addNew = function(template, key) {
		key = key || ('i' + Object.keys(this.items).length);
		var ctrl = Ui.Control.create(key, template, this);
		this.add(ctrl, key);
		return ctrl;
	};
	Ui.Board.prototype.dataBind = function(obj, field) {
		Ui.Board.base.dataBind.call(this, obj, field);
		for (var key in this.items) {
			var item = this.items[key];
			if (item.dataSource == null) {
				item.dataBind(this.dataSource);
			}
		}
	};
	Ui.Board.prototype.render = function(ctx) {
		Ui.Board.base.render.call(this, ctx);
		for (var i=1; i<this.element.childNodes.length; i++) {
			this.element.removeChild(this.element.childNodes[i]);
		}
		for (var key in this.items) {
			var item = this.items[key];
			if (item.element == null) {
				item.render( { node: this.element } );
			}
		}
	};
})();