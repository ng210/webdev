include('/ui/container.js');

// unstructured container of controls
(function() {
	function Board(id, template, parent) {
		Ui.Container.call(this, id, template, parent);
		this.items = {};
        if (this.template.items) {
			var i = 0;
            for (var key in this.template.items) {
				if (this.template.items.hasOwnProperty(key)) {
					var itemId = this.template.items[key].id || key;	//('00'+i).slice(-3);
					this.items[key] = Ui.Control.create(`${id}_${itemId}`, this.template.items[key], this);
					i++;
				}
            }
        }		
	};
	extend(Ui.Container, Board);

	Ui.Control.Types['board'] = { ctor: Board, tag: 'DIV' };
	Board.prototype.getTemplate = function() {
		var template = Board.base.getTemplate.call(this);
		template.type = 'board';
		template.items = null;
		return template;
	};
	Board.prototype.add = function(key, ctrl) {
		if (typeof key === 'string' && ctrl instanceof Ui.Control) {
			this.items[key] = ctrl;
			ctrl.css.push(key);
		} else {
			this.items['item' + Object.keys(this.items).length] = key;
			ctrl = key;
		}
		ctrl.parent = this;
		return ctrl;
	};
	Board.prototype.addNew = function(key, template) {
		key = key || ('i' + Object.keys(this.items).length);
		var ctrl = Ui.Control.create(key, template, this);
		this.add(key, ctrl);
		return ctrl;
	};
	Board.prototype.dataBind = function(dataSource, dataField) {
		Board.base.dataBind.call(this, dataSource, dataField);
		for (var key in this.items) {
			var item = this.items[key];
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
		for (var key in this.items) {
			var item = this.items[key];
			item.render(context);
		}
	};
	Ui.Board = Board;
})();