include('container.js');
(function() {
	// Row
	//  - getTemplate/applyTemplate
	//		- uses row-template created by parent grid
	//  - build
	//		- create cells
	//  - update
	//		- add/remove cells
	//		- update data bindings
	//  - dataBind
	//  - getBoundingBox
	//		- get width = border + total cell width
	//  - render
	//		- render items (cells)
	function GridRowRenderer2d(control, context) {
		GridRowRenderer2d.base.constructor.call(this, control, context);
	}
	extend(glui.Renderer2d, GridRowRenderer2d);

	GridRowRenderer2d.prototype.renderControl = function renderRow() {
		var ctrl = this.control;
		var left = ctrl.left;
		for (var i=0; i<ctrl.items.length; i++) {
			var cell = ctrl.items[i];
			cell.move(left, this.border.width);
			cell.render();
			left += cell.width;
console.log(cell.width);
		}
	};

	function Row(id, template, parent, context) {
		this.cells = {};
		this.cellCount = 0;
		Row.base.constructor.call(this, id, template, parent, context);
	}
	extend(glui.Container, Row);

	Row.prototype.add = function add(ctrl, name) {
		ctrl.id = this.id + '#' + ctrl.id;
		Row.base.add.call(this, ctrl);
		this.cells[this.cellCount] = ctrl;
		if (name != undefined){
			this.cells[name] = ctrl;
		}
		this.cellCount++;
		return ctrl;
	};
	Row.prototype.replace = function replace(item, newItem) {
		var result = Row.base.replace.call(this, item, newItem);
		if (result != null) {
			for (var k in this.cells) {
				if (this.cells.hasOwnProperty(k) && this.cells[k] == item) {
					this.cells[k] = newItem;
				}
			}
		}
		return result;
	};
	Row.prototype.remove = function remove(control) {
		Row.base.remove.call(this, control);
		for (var k in this.cells) {
			if (this.cells.hasOwnProperty(k) && this.cells[k] == item) {
				delete this.cells[k];
			}
		}
		for (var i=0; i<this.cellCount; i++) {
			if (this.cells[i] == undefined) {
				this.cells[i] = this.cells[i+1];
				delete this.cells[i+1];
			}
		}
		this.cellCount--;
	};
	Row.prototype.render = function render() {
		glui.Control.prototype.render.call(this);
	};
	Row.prototype.createRenderer = mode => mode == glui.Render2d ? new GridRowRenderer2d() : 'GridRowRenderer3d';

	function Column(name, parent) {
		this.id = `${parent.id}#${name}`;
		this.name = name;
		this.parent = parent;
		this.cells = [];
	};
	Column.prototype.add = function add(ctrl, ix) {
		if (ix != undefined) this.cells.splice(ix, 0, ctrl);
		else this.cells.push(ctrl);
		ctrl.column = this;
	}


// Grid
//  - getTemplate/applyTemplate:
//		- determine row and column count
//		- create row-template from cell-template/row-template
//  - build
//		- create titlebar
//		- create rows and columns including header
//  - update
//		- add/remove rows/columns
//		- update data bindings
//  - dataBind
//		- determine row and column count if in template unspecified
//		- bind data items to rows
//  - getBoundingBox
//		- calculate width and height
//  - render
//		- render titlebar
//		- render rows

	const headKey = '__head';

	function GridRenderer2d(control, context) {
		GridRenderer2d.base.constructor.call(this, control, context);
	}
	extend(glui.Renderer2d, GridRenderer2d);

	GridRenderer2d.prototype.renderControl = function renderControl() {
		var grid = this.control;
		var top = 0;
		// draw titlebar
		if (grid.title) {
			grid.titlebar.render();
			top += grid.titlebar.height + grid.titlebar.renderer.border.width;
		}
		// draw rows
		for (var i=0; i<grid.rowKeys.length; i++) {
			var row = grid.rows[grid.rowKeys[i]];
			if (row.style.visible) {
				row.move(0, top);
				row.render();
				top += row.height;
			}
		}

		// var width = ctrl.width - 2*this.border.width;
		// var widthPercent = 0;
		// var columnWithoutWidth = 0;
		// var columns = [];
		// var headerHeight = 0, height = 0;
		// for (var ci=0; ci<ctrl.columnCount; ci++) {
		// 	var column = ctrl.columns[ci];
		// 	if (!column.style.width) {
		// 		columnWithoutWidth++;
		// 		columns.push(column);
		// 	} else if (column.style.width.endsWith('%')) {
		// 		widthPercent += parseFloat(column.style.width);
		// 		columns.push(column);
		// 	} else {
		// 		width -= column.width = column.cells[0].renderer.convertToPixel(column.style.width, 0);
		// 	}
		// 	if (ctrl.rowTemplate) {
		// 		headerHeight = Math.max(ctrl.rows[headKey].cells[ci].height, height);
		// 	}
		// 	height = Math.max(ctrl.rows[ctrl.rowKeys[1]].cells[ci].height, height);
		// }
		// var restWidth = (100 - widthPercent)/columnWithoutWidth + '%';
		// for (var ci=0; ci<columns.length; ci++) {
		// 	var column = columns[ci];
		// 	var colWidth = column.style.width;
		// 	if (!colWidth) {
		// 		colWidth = restWidth;
		// 	}
		// 	column.width = this.convertToPixel(colWidth, width);
		// }
		// var left = 0;
		// var startRow = 0;
		// if (ctrl.rowTemplate) {
		// 	if (ctrl.showHeader) {
		// 		var row = ctrl.rows[headKey];
		// 		row.top = ctrl.top + top;
		// 		row.width = ctrl.width;
		// 		for (var ci=0; ci<ctrl.columnCount; ci++) {
		// 			var cell = row.cells[ci];
		// 			cell.move(left, top);
		// 			cell.width = cell.column.width;
		// 			cell.render();
		// 			left += cell.width;
		// 		}
		// 		top += headerHeight;
		// 	}
		// 	startRow = 1;
		// }
		// for (var ri=startRow; ri<startRow+ctrl.rowCount; ri++) {
		// 	var row = ctrl.rows[ctrl.rowKeys[ri]];
		// 	row.top = ctrl.top + top;
		// 	row.width = ctrl.width;
		// 	for (var ci=0; ci<ctrl.columnCount; ci++) {
		// 		var cell = row.cells[ci];
		// 		cell.move(left, top);
		// 		cell.width = cell.column.width;
		// 		cell.render();
		// 		left += cell.width;
		// 	}
		// 	left = 0;
		// 	top += height;
		// }
	};


	function Grid(id, template, parent, context) {
		this.rowCount = 0;
		this.columnCount = 0;
		this.rowKeys = [];
		this.rows = {};
		this.columnKeys = [];
		this.columns = {};
		this.isDirty = true;
		this.titlebar = null;
		Grid.base.constructor.call(this, id, template, parent, context);
	};
	extend(glui.Container, Grid);

	Grid.prototype.getTemplate = function getTemplate() {
		var template = Grid.base.getTemplate.call(this);
		template.style.cell = glui.Control.getStyleTemplate();
		template.style.title = null;
		template.style.header = null;
		template.style.height = undefined;
		template.title = this.id;
		template.rows = 0;
		template.cols = 0;
		template.header = false;
		template['row-template'] = null;
		template['cell-item'] = 'Label';
		return template;
	};
	Grid.prototype.applyTemplate = function applyTemplate(tmpl) {
		if (tmpl.style.width == undefined) tmpl.style.width = 0;
		var template = Grid.base.applyTemplate.call(this, tmpl);

		// Build cell style: merge(grid.style, grid.style.cell, tmpl.style.cell);
		this.cellStyle = mergeObjects(template.style, template.style.cell);
		this.rowCount = parseInt(template.rows) || 3;
		this.rowKeys.push(headKey);
		for (var ri=0; ri<this.rowCount; ri++) {
			this.rowKeys.push(ri);
		}
		
		// column count is taken from
		// - template.rows
		// - row-template.keys.length
		// - default
		var columnCount = parseInt(template.cols);
		var rowTemplate = template['row-template'];
		if (rowTemplate != undefined) {
			var columnKeys = Object.keys(rowTemplate);
			if (!columnCount) {
				columnCount = this.columnKeys.length;
			} else {
				// eventually, add missing cells
				for (var i=columnKeys.length; i<columnCount; i++) {
					rowTemplate[i] = {'type':template['cell-item'], 'style': this.cellStyle };
				}
			}
		} else {
			if (!columnCount) columnCount = 2;	// default
			rowTemplate = {};
			for (var i=0; i<columnCount; i++) {
				rowTemplate[i] = {'type':template['cell-item'], 'style': this.cellStyle };
			}
		}
		this.columnKeys = Object.keys(rowTemplate);
		this.columnCount = this.columnKeys.length;
		this.rowTemplate = rowTemplate;

		this.style.header = mergeObjects(this.cellStyle, template.style.header);
		this.style.title = mergeObjects(this.cellStyle, template.style.title);
		this.style.title.width = '100%';
		this.title = template.title;

		this.showHeader = !!template.header;
		this.build();

        if (this.dataSource && this.dataField) {
            this.dataBind();
		}

		return template;
	};
    Grid.prototype.getHandlers = function getHandlers() {
        var handlers = Grid.base.getHandlers.call(this);
        handlers.push(
            { name: 'mousedown', topDown: true },
            { name: 'mouseup', topDown: false }
        );
        return handlers;
	};
    // Grid.prototype.setVisible = function setVisible(visible) {
	// 	Grid.base.setVisible.call(this, visible);
	// };
	Grid.prototype.createRenderer = mode => mode == glui.Render2d ? new GridRenderer2d() : 'GridRenderer3d';
	Grid.prototype.setRenderer = async function setRenderer(mode, context) {
		await Grid.base.setRenderer.call(this, mode, context);
		this.update();
	};
	Grid.prototype.getBoundingBox = function getBoundingBox() {
		if (this.height == 0) {
			if (this.titlebar) {
				this.height += this.titlebar.height;
			}
			if (this.showHeader) {
				this.renderer.setFont(this.style.header.font);
				this.height += this.renderer.convertToPixelV(this.style.header.height);
			}

			var style = this.rowTemplate[this.columnKeys[0]].style;
			this.height += this.rowCount * this.renderer.convertToPixelV(style.height);

			// if (rowCount > 0) {

			// 	var h = 0;
			// 	if (this.rowTemplate) {
			// 		var style = this.rowTemplate[this.columnKeys[0]].style;
			// 		h = this.renderer.convertToPixelV(style.height);
			// 	} else {
			// 		h = this.renderer.convertToPixelV(this.cellTemplate.style.height);
			// 	}
			// 	this.height += h * rowCount;
			// }
			this.height += 2*this.renderer.border.width;
		}
		return Grid.base.getBoundingBox.call(this);
    };
    // Grid.prototype.move = function move(dx, dy) {
	// 	debugger
	//  	Grid.base.move.call(this, dx, dy);
	// 	//if (this.titlebar) this.titlebar.move(0, 0);
	// 	for (var ri=0; ri<this.rowCount; ri++) {
	// 		var row = this.rows[this.rowKeys[ri]];
	// 		for (var ci=0; ci<this.columnCount; ci++) {
	// 			row.cells[this.columnKeys[ci]].move(0, 0);
	// 		}
	// 	}
	// };
	Grid.prototype.update = function update() {
		// titlebar
		this.titlebar.setVisible(this.title);
		this.titlebar.setValue(this.title);
		// columns
		// rows

	};
	Grid.prototype.build = function build() {
		// titlebar
		if (!this.titlebar) {
			this.titlebar = glui.Control.create(`${this.id}#title`, { 'type': 'Label', 'style': this.style.title, 'z-index': this.zIndex + 1 }, this);
			this.titlebar.setValue(this.title);
			this.add(this.titlebar);
		}
		// create columns
		for (var ci=0; ci<this.columnCount; ci++) {
			var name = this.columnKeys[ci].toString();
			var column = new Column(name, this);
			column.style = this.rowTemplate[name].style;
			this.columns[ci] = column;
			this.columns[name] = column;
		}
		// create rows
		var rowStyle = mergeObjects(this.style, null);
		rowStyle.width = '100%';
		rowStyle.height = this.cellStyle.height;
		var isHead = true;
		for (var ri=0; ri<this.rowKeys.length; ri++) {
			var rowKey = this.rowKeys[ri];
			var row = new Row(`${this.id}#${rowKey}`, { 'style': !isHead ? rowStyle : this.style.header}, this, this.context);
			row.addHandlers();
			this.add(row);
			this.rows[rowKey] = row;
			for (var ci=0; ci<this.columnCount; ci++) {
				var key = this.columnKeys[ci];
				var column = this.columns[key];
				var template = !isHead ? this.rowTemplate[key] : { 'type': 'Label', 'style':this.style.header };
				var cell = row.add(glui.create(ci, template, row, row.context), key);
				cell.setValue(Grid.resolveReference(this.rowTemplate[key].column, key));
				column.add(cell);
			}
			row.setVisible(!isHead ? true : this.showHeader);
			isHead = false;
		}

		// rows

		// var source = this.dataSource ? (this.dataField ? this.dataSource[this.dataField] : this.dataSource) : null;
		// if (this.rowTemplate) {
		// 	if (source) {
		// 		this.rowKeys = Object.keys(source);
		// 		this.rowCount = this.template.rows ? this.template.rows : this.rowKeys.length;
		// 	} else {
		// 		this.rowKeys = [];
		// 		this.rowCount = this.template.rows ? this.template.rows : 5;	// default = 5
		// 		for (var i=0; i<this.rowCount; i++) {
		// 			this.rowKeys.push(i);
		// 		}
		// 	}
		// 	this.columnKeys = Object.keys(this.rowTemplate);
		// 	var rowTemplateCount = this.columnKeys.length;
		// 	this.columnCount = parseInt(this.template.cols) ? this.template.cols : rowTemplateCount;
		// 	for (var i=rowTemplateCount; i<this.columnCount; i++) {
		// 		this.rowTemplate[i] = this.cellTemplate;
		// 		this.columnKeys.push(i);
		// 	}
		// } else {
		// 	this.columnCount = this.template.cols;
		// 	this.rowCount = this.template.rows;
		// 	if (source) {
		// 		var count = Object.keys(source).length;
		// 		if (!this.columnCount && !this.rowCount) {
		// 			this.columnCount = 2;
		// 			this.rowCount = Math.ceil(count/this.columnCount);
		// 		} else if (!this.columnCount) {
		// 			this.columnCount = Math.ceil(count/this.rowCount);
		// 		} else if (!this.rowCount) {
		// 			this.rowCount = Math.ceil(count/this.columnCount);
		// 		}
		// 		for (var i=0; i<this.columnCount; i++) {
		// 			this.columnKeys.push(i);
		// 		}
		// 	} else {
		// 		this.columnKeys = [];
		// 		this.columnCount = this.template.cols ? this.template.cols : 2;	// default = 2
		// 		this.rowCount = this.template.rows ? this.template.rows : 5;	// default = 5
		// 		for (var i=0; i<this.columnCount; i++) {
		// 			this.columnKeys.push(i);
		// 		}
		// 	}
		// 	for (var i=0; i<this.rowCount; i++) {
		// 		this.rowKeys.push(i);
		// 	}
		// }

		// add header row


		// add rows
		// var cellId = 0;
		// for (var ri=startRow; ri<startRow+this.rowCount; ri++) {
		// 	var name = this.rowKeys[ri];
		// 	var row = new Row(name, this);
		// 	row.addHandlers();
		// 	this.add(row);
		// 	this.rows[name] = row;
		// 	row.dataSource = this.rowTemplate && source && source[name] ? new DataLink(source[name]) : null;
		// 	for (var ci=0; ci<this.columnCount; ci++) {
		// 		var key = this.columnKeys[ci];
		// 		var column = this.columns[key];
		// 		var cell = glui.create(`${ri}#${ci}`, this.rowTemplate ? this.rowTemplate[key] : this.cellTemplate, row);
		// 		cell.row = row;
		// 		cell.column = column;
		// 		if (this.rowTemplate) {
		// 			if (row.dataSource) cell.dataBind(row.dataSource, key);
		// 		} else {
		// 			if (source && source[cellId] != undefined) cell.dataBind(source[cellId]);
		// 		}				
		// 		column.cells.push(cell);
		// 		row.add(cell, column.name);
		// 		// row.cells[ci] = cell;
		// 		// row.cells[column.name] = cell;
		// 		// this.add(cell);
		// 		cellId++;
		// 	}			
		// }

		return;
	};
	Grid.prototype.update = function() {

		this.isDirty = false;
	};
    Grid.prototype.replace = function replace(item, newItem) {
		var result = Grid.base.replace.call(this, item, newItem);
		if (result == item) {
			var id = item.id.split('#');
			newItem.id = id;
			newItem.parent = this;
			newItem.style.width = item.style.width;
			newItem.style.height = item.style.height;
			newItem.style.border = item.style.border;
			newItem.style.background = item.style.background;
			newItem.style.font = item.style.font;

			var row = item.row;
			var column = item.column;
			var colKey = this.columnKeys[id[1]];

			row.cells[colKey] = newItem;
			row.cells[id[1]] = newItem;
			newItem.row = row;

			column.cells[id[0]] = newItem;
			newItem.column = column;

			newItem.context = item.context;
			newItem.dataBind(item.dataSource, item.dataField);
		}
        return item;
    };
	Grid.prototype.getCell = function(ri, ci) {
		if (typeof ri === 'string') {
			var tokens = ri.split('#');
			ri = tokens[0];
			ci = tokens[1];
		}
		var row = this.rows[ri];
		return row ? row.cells[ci] : null;
	};
	Grid.prototype.render = function render() {
		//this.updateRows();
		//Grid.base.render.call(this);
		if (this.isDirty) this.update();
		glui.Control.prototype.render.call(this);
	};

// 	Grid.prototype.onmouseover = function onmouseover(e, ctrl) {
// console.log('grid.onmouseover')
// 		return false;
// 	};
// 	Grid.prototype.onmouseout = function onmouseout(e, ctrl) {
// console.log('grid.onmouseout')
// 		return false;
// 	};
// 	Grid.prototype.onblur = function onblur(e, ctrl) {
// console.log('grid.blur');
// 		return false;
// 	};

	Grid.resolveReference = function resolveReference(reference, key) {
		var result = reference;
		if (typeof reference === 'string') {
			if (reference == '$key') {
				result = key.charAt(0).toLowerCase() + key.substring(1);
			} else if (reference === '$Key') {
				result = key.charAt(0).toUpperCase() + key.substring(1);
			}
		} else {
			result = key.toString();
		}
		return result;
	};

	// Grid.Row = function Row(name, parent) {
	// 	this.id = `${parent.id}#${name}`;
	// 	this.name = name;
	// 	this.parent = parent;
	// 	this.dataSource = null;
	// 	this.cells = {};
	// 	this.handlers = {};
	// 	this.context = parent;
	// };
	// Grid.Row.prototype = {
	// 	get width() { return this.parent.width; },
	// 	get renderer() { return this.parent.renderer; }/*,
	// 	get handlers() { return this.parent.handlers; }*/
	// };

	public(Grid, 'Grid', glui);

})();

