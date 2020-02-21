include('/ui/container.js');

// unstructured container of controls
(function() {
	function Board(id, template, parent) {
		Ui.Container.call(this, id, template, parent);
		this.items = {};
        if (this.template.items) {
			var i = 0;
            for (var key in this.template.items) {
				var itemId = this.template.items[key].id || ('00'+i).slice(-3);
				this.items[key] = Ui.Control.create(`${id}_${itemId}`, this.template.items[key], this);
				i++;
            }
        }		
	};
	extend(Ui.Container, Board);

	Ui.Control.Types['Board'] = { ctor: Board, tag: 'DIV' };
	Board.prototype.getTemplate = function() {
		var template = Board.base.getTemplate();
		template.type = 'Board';
		template.items = null;
		return template;
	};
	Board.prototype.add = function(ctrl, key) {
		this.items[key] = ctrl;
		ctrl.css.push(key);
		ctrl.parent = this;
		return ctrl;
	};
	Board.prototype.addNew = function(template, key) {
		key = key || ('i' + Object.keys(this.items).length);
		var ctrl = Ui.Control.create(key, template, this);
		this.add(ctrl, key);
		return ctrl;
	};
	Board.prototype.dataBind = function(dataSource, dataField) {
		Board.base.dataBind.call(this, dataSource, dataField);
		for (var key in this.items) {
			var item = this.items[key];
			if (item.dataSource == null) {
				item.dataBind(this.dataSource[this.dataField]);
			}
		}
	};
	Board.prototype.render = function(ctx) {
		Board.base.render.call(this, ctx);
		for (var i=1; i<this.element.childNodes.length; i++) {
			this.element.removeChild(this.element.childNodes[i]);
		}
		for (var key in this.items) {
			var item = this.items[key];
			if (item.element == null) {
				item.render( { 'element': this.element } );
			}
		}
	};
	Ui.Board = Board;
})();