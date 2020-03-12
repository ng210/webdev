include('/ui/container.js');

// unstructured container of controls
(function() {
	function Board(id, template, parent) {
		Ui.Container.call(this, id, template, parent);
		this.itemOrder = [];
		this.items = {};
        if (this.template.items) {
            for (var key in this.template.items) {
				if (this.template.items.hasOwnProperty(key)) {
					var itemId = this.template.items[key].id || key;
					this.addNew(itemId, this.template.items[key]);
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
	Board.prototype.add = function(key, ctrl, itemBefore) {
		var ix = -1;
		if (itemBefore) {
			ix = this.itemOrder.findIndex(x => this.items[x] == itemBefore) + 1;
		}
		ctrl.addClass(key);
		if (ix > 0 && ix < this.itemOrder.length) {
			this.itemOrder.splice(ix, 0, key);
		} else {
			this.itemOrder.push(key);
		}
		this.items[key] = ctrl;
		ctrl.parent = this;
		return ctrl;
	};
	Board.prototype.addNew = function(key, template, itemBefore) {
		var ctrl = Ui.Control.create(`${this.id}_${key}`, template, this);
		this.add(key, ctrl, itemBefore);
		return ctrl;
	};
	Board.prototype.dataBind = function(dataSource, dataField) {
		Board.base.dataBind.call(this, dataSource, dataField);
		for (var i=0; i<this.itemOrder.length; i++) {
			var item = this.items[this.itemOrder[i]];
			var ds = item.dataSource || dataSource || this.dataSource;
			if (ds && item.dataField) {
				item.dataBind(ds, item.dataField);
			}
		}
	};
	Board.prototype.render = async function(ctx) {
		if (this.element) {
			while (this.element.children.length > 0) {
				this.element.removeChild(this.element.children[0]);
			}
		}

		Board.base.render.call(this, ctx);
		var context = ctx ? Object.create(ctx) : {};
		context.element = this.element;
		for (var i=0; i<this.itemOrder.length; i++) {
			var item = this.items[this.itemOrder[i]];
			await item.render(context);
		}
	};
	Board.prototype.item = function(ix) {
		return Object.values(this.items)[ix];
	};
	Ui.Board = Board;
})();