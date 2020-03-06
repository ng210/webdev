include('/ui/container.js');

// unstructured container of controls
(function() {
	function Board(id, template, parent) {
		Ui.Container.call(this, id, template, parent);
		this.items = [];
        if (this.template.items) {
            for (var key in this.template.items) {
				if (this.template.items.hasOwnProperty(key)) {
					var itemId = this.template.items[key].id || key;
					if (this.template.items.find(x => x.id == itemId) == -1) {
						this.items.push(Ui.Control.create(`${id}_${itemId}`, this.template.items[key], this));
					}
				}
            }
		}
		this.rebuild = true;
	};
	extend(Ui.Container, Board);

	Ui.Control.Types['board'] = { ctor: Board, tag: 'DIV' };
	Board.prototype.getTemplate = function() {
		var template = Board.base.getTemplate.call(this);
		template.type = 'board';
		template.items = {};
		return template;
	};
	Board.prototype.add = function(ctrl, beforeItem) {
		var ix = -1;
		if (beforeItem) {
			ix = this.items.findIndex(x => x.id == beforeItem.id);
		}
		if (ix >= 0 && ix < this.items.length) {
			this.items.splice(ix, 0, ctrl);
		} else {
			this.items.push(ctrl);
		}
		ctrl.parent = this;
		return ctrl;
	};
	Board.prototype.addNew = function(key, template, beforeItem) {
		var ctrl = Ui.Control.create(`${this.id}_${key}`, template, this);
		this.add(ctrl, beforeItem);
		return ctrl;
	};
	Board.prototype.dataBind = function(dataSource, dataField) {
		Board.base.dataBind.call(this, dataSource, dataField);
		for (var i=0; i<this.items.length; i++) {
			var item = this.items[i];
			if (!item.dataSource && item.dataField) {
				item.dataBind(this.dataSource[item.dataField]);
			}
		}
	};
	Board.prototype.render = function(ctx) {
		if (this.element) {
			while (this.element.children.length > 0) {
				this.element.removeChild(this.element.children[0]);
			}
		}

		Board.base.render.call(this, ctx);
		var context = ctx ? Object.create(ctx) : {};
		context.element = this.element;
		for (var i=0; i<this.items.length; i++) {
			var item = this.items[i];
			item.render(context);
		}
	};
	Ui.Board = Board;
})();