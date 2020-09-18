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
		var left = 0;
		for (var i=0; i<ctrl.items.length; i++) {
			var cell = ctrl.items[i];
			cell.move(left, 0);
			cell.render();
			left += cell.width + 2*cell.renderer.border.width;
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

		// var columnCount = parseInt(template.cols);
		// var rowTemplate = template['row-template'];
		// if (rowTemplate != undefined) {
		// 	var columnKeys = Object.keys(rowTemplate);
		// 	if (!columnCount) {
		// 		columnCount = this.columnKeys.length;
		// 	} else {
		// 		// eventually, add missing cells
		// 		for (var i=columnKeys.length; i<columnCount; i++) {
		// 			rowTemplate[i] = {'type':template['cell-item'], 'style': this.cellStyle };
		// 		}
		// 	}
		// } else {
		// 	if (!columnCount) columnCount = 2;	// default
		// 	rowTemplate = {};
		// 	for (var i=0; i<columnCount; i++) {
		// 		rowTemplate[i] = {'type':template['cell-item'], 'style': this.cellStyle };
		// 	}
		// }
		// this.columnKeys = Object.keys(rowTemplate);
		// this.columnCount = this.columnKeys.length;

		this.rowTemplate = template['row-template'];

		this.style.header = mergeObjects(this.cellStyle, template.style.header);
		this.style.title = mergeObjects(this.cellStyle, template.style.title);
		this.style.title.width = '100%';
		this.title = template.title;

		this.showHeader = !!template.header;

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
				this.height += this.renderer.convertToPixel(this.style.header.height, true);
			}

			var style = this.rowTemplate[this.columnKeys[0]].style;
			this.height += this.rowCount * this.renderer.convertToPixel(style.height, true);

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
	Grid.prototype.update = function update() {
		// titlebar
		if (this.titlebar) {
			this.titlebar.setVisible(this.title);
			this.titlebar.setValue(this.title);
		}
		if (this.dataSource) {
			var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
debugger;
			this.rowKeys = Object.keys(dataSource);
			this.columnKeys = Object.keys(dataSource[this.rowKeys[0]]);
			this.build();
		}
		this.isDirty = false;
	};
	Grid.prototype.insertColumnAt = async function insertColumnAt(ix) {
		console.log('insert column at ' + ix);
		this.columnCount++;
	};
	Grid.prototype.insertRowAt = async function insertRowAt(ix) {
		console.log('insert row at ' + ix);
		this.rowCount++;
	};
	Grid.prototype.removeColumnAt = async function removeColumnAt(ix) {
		console.log('remove column at ' + ix);
		this.columnCount--;
	};
	Grid.prototype.removeRowAt = async function removeRowAt(ix) {
		console.log('remove row at ' + ix);
		this.rowCount--;
	};
	Grid.prototype.updateRowInfo = function updateRowInfo() {
		var rowCount = parseInt(this.template.rows);
		var rowKeys = null;
		if (!rowCount) {
			if (this.dataSource) {
				var dataSource = this.dataField != null ? this.dataSource[this.dataField] : this.dataSource;
				rowKeys = Object.keys(dataSource);
				rowCount = rowKeys.length;
			} else {
				rowCount = 2;
			}
		}
		if (rowKeys == null) {
			rowKeys = [];
			for (var i=0; i<rowCount; i++) rowKeys.push(i);
		}
console.log(`${rowCount}: ${rowKeys}`);
		return rowKeys;
	};
	Grid.prototype.updateColumnInfo = function updateColumnInfo() {
		var columnCount = parseInt(this.template.cols);
		if (columnCount) {
			if (this.rowTemplate) {
				columnKeys = [];
				var keys = Object.keys(this.rowTemplate);
				for (var i=0; i<columnCount; i++) {
					columnKeys.push(i < keys.length ? keys[i] : i);
				}			
			} else {
				if (this.dataSource) {
					var dataSource = this.dataField != null ? this.dataSource[this.dataField] : this.dataSource;
					if (dataSource) {
						columnKeys = [];
						var keys = Object.keys(dataSource);
						for (var i=0; i<columnCount; i++) {
							columnKeys.push(i < keys.length ? keys[i] : i);
						}			
					} else {
						columnKeys = [];
						for (var i=0; i<columnCount; i++) {
							columnKeys.push(i);
						}			
					}
				}
			}
		} else {
			if (this.rowTemplate) {
				columnKeys = Object.keys(this.rowTemplate);
				columnCount = columnKeys.length;
			} else {
				var dataSource = this.dataSource ? (this.dataField != null ? this.dataSource[this.dataField] : this.dataSource) : null;
				if (dataSource) {
					columnKeys = Object.keys(dataSource);
					columnCount = columnKeys.length;
				} else {
					columnCount = 2;
					columnKeys = [];
					for (var i=0; i<columnCount; i++) {
						columnKeys.push(i);
					}			
				}
			}
		}

console.log(`${columnCount}: ${columnKeys}`);
		return columnKeys;
	};
	Grid.prototype.build = async function build() {
		// titlebar
		if (!this.titlebar) {
			this.titlebar = await glui.create(`${this.id}#title`, { 'type': 'Label', 'style': this.style.title, 'z-index': this.zIndex + 1 }, this);
			this.titlebar.setValue(this.title);
			this.add(this.titlebar);
		}
debugger
		var rowKeys = this.updateRowInfo();
		var columnKeys = this.updateColumnInfo();

		// todo: update columns
		if (this.columnCount < columnKeys.length) {
			// add columns
			for (var i=this.columnCount; i<columnKeys.length; i++) {
				this.insertColumnAt(i, columnKeys[i]);
			}
		} else if (this.columnCount > columnKeys.length) {
			// remove columns
			var i = columnKeys.length-1;
			while (i != this.columnCount) {
				this.removeColumnAt(i);
			}
		}

		// todo: update rows
		if (this.rowCount < rowKeys.length) {
			// add rows
			for (var i=this.rowCount; i<rowKeys.length; i++) {
				this.insertRowAt(i, rowKeys[i]);
			}
		} else if (this.rowCount > rowKeys.length) {
			// remove rows
			var i=rowKeys.length-1
			while (i != this.rowCount) {
				this.removeRowAt(i);
			}
		}
console.log(this.rowCount);

		// for (var ci=0; ci<this.columnCount; ci++) {
		// 	var name = this.columnKeys[ci].toString();
		// 	var column = new Column(name, this);
		// 	column.style = this.rowTemplate[name].style;
		// 	this.columns[ci] = column;
		// 	this.columns[name] = column;
		// }
		// // create rows
		// var rowStyle = mergeObjects(this.style, null);
		// rowStyle.width = '100%';
		// rowStyle.height = this.cellStyle.height;
		// var isHead = true;
		// for (var ri=0; ri<this.rowKeys.length; ri++) {
		// 	var rowKey = this.rowKeys[ri];
		// 	var row = new Row(`${this.id}#${rowKey}`, { 'style': !isHead ? rowStyle : this.style.header}, this, this.context);
		// 	await row.setRenderer(glui.mode, glui.renderingContext);
		// 	row.addHandlers();
		// 	this.add(row);
		// 	this.rows[rowKey] = row;
		// 	for (var ci=0; ci<this.columnCount; ci++) {
		// 		var key = this.columnKeys[ci];
		// 		var column = this.columns[key];
		// 		var template = !isHead ? this.rowTemplate[key] : { 'type': 'Label', 'style':this.style.header };
		// 		var cell = row.add(await glui.create(ci, template, row, row.context), key);
		// 		cell.setValue(Grid.resolveReference(this.rowTemplate[key].column, key));
		// 		column.add(cell);
		// 	}
		// 	row.setVisible(!isHead ? true : this.showHeader);
		// 	isHead = false;
		// }
		return;
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

	public(Grid, 'Grid', glui);

})();

