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
		var row = this.control;
		var grid = row.parent;
		var left = 0;
//console.log(getObjectPath(this.control, 'parent', glui.screen).map(x => x.id).join('.'));
		for (var i=0; i<row.items.length; i++) {
			var cell = row.items[i];
			cell.width = grid.columns[i].width;
			cell.move(left, 0);
			var bgColor = cell.renderer.backgroundColor;
			if (row.highlit) {
				cell.renderer.backgroundColor = cell.renderer.calculateColor(cell.renderer.backgroundColor, 1.2);
			}
			cell.renderer.render();
			cell.renderer.backgroundColor = bgColor;
			left += cell.width;
		}
	};

	function Row(id, template, parent, context) {
		this.cells = {};
		this.cellCount = 0;
		this.index = 0;
		Row.base.constructor.call(this, id, template, parent, context);
	}
	extend(glui.Container, Row);

	Row.prototype.dataBind = function dataBind(source, field) {
		glui.Control.prototype.dataBind.call(this, source[field]);
		var grid = this.parent;
		var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
		for (var i=0; i<grid.columnKeys.length; i++) {
			var dataField = grid.columns[i].dataField || grid.columns[i].key;
			this.cells[i].dataBind(dataSource, dataField);
		}
		
	};
	Row.prototype.add = async function add(ctrl, name) {
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
				break;
			}
		}
		for (var i=0; i<this.cellCount; i++) {
			if (this.cells[i] == undefined) {
				this.cells[i] = this.cells[i+1];
				this.cells[i+1] = undefined;
			}
		}
		this.cellCount--;
	};
	Row.prototype.render = function render() {
		glui.Control.prototype.render.call(this);
	};
	Row.prototype.createRenderer = mode => mode == glui.Render2d ? new GridRowRenderer2d() : 'GridRowRenderer3d';

	Row.prototype.onmouseover = function onmouseover(e) {
		if (this.parent.mode == Grid.modes.TABLE) {
			this.highlit = true;
			this.render();
		}
	};
	Row.prototype.onmouseout = function onmouseout(e) {
		if (this.parent.mode == Grid.modes.TABLE) {
			this.highlit = false;
			this.render();
		}
	};

	function Column(name, key, parent) {
		this.id = `${parent.id}#${key}`;
		this.name = name;
		this.key = key;
		this.parent = parent;
		this.cells = [];
		this.width = '100%';

		this.template = null;
		this.style = parent.cellTemplate;
		this.dataField = null;
		if (parent.rowTemplate && parent.rowTemplate[key]) {
			this.style = parent.rowTemplate[key].style;
			this.dataField = parent.rowTemplate[key]['data-field'];
		}
	};
	Column.prototype.add = function add(ctrl, ix) {
		if (ix != undefined) this.cells.splice(ix, 0, ctrl);
		else this.cells.push(ctrl);
		ctrl.column = this;
	};

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
			grid.titlebar.renderer.render();
			top += grid.titlebar.height + grid.titlebar.renderer.border.width;
		}

		// calculate cell widths
		// var headerHeight = 0, height = 0;
		var width = grid.width - 2*this.border.width;
		var columnWidths = [];
		var percentage = 0;
		var absolute = 0;
		// sum percentage (undefined = 100%)
		// sum absolute values
		// rest = total - absolute
		// distribute rest among percentage
		for (var ci=0; ci<grid.columnCount; ci++) {
			var column = grid.columns[ci];
			column.width = -1;
			if (column.style.width == undefined) {
				percentage += 100; columnWidths.push(100);
			} else if (column.style.width.endsWith('%')) {
				var w = parseFloat(column.style.width);
				percentage += w; columnWidths.push(w);
			} else {
				// per row: cells[0] should be cells[rowIndex]
				absolute += column.width = column.cells[0].renderer.convertToPixel(column.style.width, 0);
				columnWidths.push(-1);
			}
			// if (grid.rowTemplate) {
			// 	headerHeight = Math.max(grid.rows[headKey].cells[ci].height, height);
			// }
			// per row: grid.rows[..] => row
			// height = Math.max(grid.rows[grid.rowKeys[1]].cells[ci].height, height);
		}
		var restWidth = width - absolute;
		for (var ci=0; ci<grid.columnCount; ci++) {
			var column = grid.columns[ci];
			if (column.width == -1) {
				column.width = Math.ceil(restWidth/percentage*columnWidths[ci]);
				restWidth -= column.width;
				percentage -= columnWidths[ci];
			}
		}

		// draw header
		if (grid.showHeader) {
			grid.header.move(0, top);
			grid.header.renderer.render();
			top += grid.header.height;
		}

		// draw rows
		for (var i=0; i<grid.rowCount; i++) {
			var row = grid.rows[grid.rowKeys[i]];
			if (row.style.visible) {
				row.move(0, top);
				row.renderer.render();
				top += row.height;
			}
		}

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
		this.header = null;
		this.rowKeys = [];
		this.rows = {};
		this.columnKeys = [];
		this.columns = {};
		this.isDirty = true;
		this.titlebar = null;
		this.mode = Grid.modes.TABLE;
		Grid.base.constructor.call(this, id, template, parent, context);
	};
	extend(glui.Container, Grid);

	Grid.prototype.getTemplate = function getTemplate() {
		var template = Grid.base.getTemplate.call(this);
		template.style.cell = glui.Control.getStyleTemplate();
		template.style.title = null;
		template.style.header = glui.Control.getStyleTemplate();
		template.style.height = undefined;
		template.title = this.id;
		template.rows = 0;
		template.cols = 0;
		template.header = false;
		template['row-template'] = null;
		template['cell-template'] = glui.Label.prototype.getTemplate();
		template['cell-template'].style.width = '100%';
		template['cell-template'].style.border = '#000000 1px solid';
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
		this.cellTemplate = template['cell-template'];

		this.style.header = mergeObjects(this.cellStyle, template.style.header);
		this.style.title = mergeObjects(this.cellStyle, template.style.title);
		this.style.title.width = '100%';
		this.title = template.title;

		this.showHeader = !!template.header;

		return template;
	};
	Grid.prototype.dataBind = function(source, field) {
		//glui.Control.prototype.dataBind.call(this, source, field);
		this.dataSource = source || this.dataSource;
		this.dataField = field || this.dataField;
		var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
		if (this.mode == Grid.modes.TABLE) {
			for (var i=0; i<this.rowCount; i++) {
				var key = this.rowKeys[i];
				this.rows[key].dataBind(dataSource, key);
			}
		} else {
			var keys = Object.keys(dataSource);
			var fi = 0;
			for (var i=0; i<this.rowCount; i++) {
				var row = this.rows[this.rowKeys[i]];
				for (var j=0; j<this.columnCount; j++) {
					if (fi < keys.length) {
						row.cells[j].dataBind(dataSource, keys[fi++]);
					}
				}				
			}
		}
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
		await this.update();
	};
	Grid.prototype.getBoundingBox = function getBoundingBox() {
		if (this.height == 0) {
			if (this.titlebar) {
				this.height += this.titlebar.height;
			}
			if (this.showHeader) {
				//this.renderer.setFont(this.style.header.font);
				//this.height += this.renderer.convertToPixel(this.style.header.height, true);
				this.height += this.header.renderer.convertToPixel(this.header.style.height, true);
				this.height += this.header.renderer.convertToPixel(this.header.renderer.border.width, true);
			}
			for (var i=0; i<this.rowCount; i++) {
				var row = this.rows[this.rowKeys[i]];
				this.height += row.height;
			}

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
	Grid.prototype.update = async function update() {
		// titlebar
		if (this.titlebar) {
			this.titlebar.setVisible(this.title);
			this.titlebar.setValue(this.title);
		}

		// if (this.dataSource) {
		// 	var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
		// 	this.rowKeys = Object.keys(dataSource);
		// 	this.columnKeys = Object.keys(dataSource[this.rowKeys[0]]);
		// await this.build();
		// }
		this.isDirty = false;
	};
	Grid.prototype.insertColumnAt = async function insertColumnAt(key, ix) {
		var rt = this.rowTemplate;
		var reference = rt && rt[key] && rt[key].column ? rt[key].column : null;
		var name = Grid.resolveReference(reference, key);
		if (ix != undefined && ix < this.columnCount) {
			this.columnKeys.splice(ix, 0, name);
			for (var i=0; i<this.columnCount; i++) {
				this.columns[i+1] = this.columns[i];
			}
		} else {
			this.columnKeys.push(name);
			ix = this.columnCount;
		}

		this.columns[ix] = this.columns[name] = new Column(name, key, this);
		// update rows
		var p = [];
		var template = this.rowTemplate && this.rowTemplate[key] ? this.rowTemplate[key] : this.cellTemplate;
		for (var ri=0; ri<this.rowCount; ri++) {
			var row = this.rows[this.rowKeys[ri]];
			var ctrl = await glui.create(key, template, row);
			this.columns[name].add(ctrl, ri);
		}
		await Promise.all(p);

		this.columnCount++;
		return this.columns[name];
	};
	Grid.prototype.insertRowAt = async function insertRowAt(name, ix) {
		if (ix != undefined) this.rowKeys.splice(ix, 0, name);
		else this.rowKeys.push(name);
		var row = this.rows[name] = new Row(name, {style:{width:'100%'}}, this);
		row.index = ix;
		for (var i=ix+1; i<this.rowKeys.length; i++) this.rows[this.rowKeys[i]].index++;
		// update columns
		var height = 0;
		for (var ci=0; ci<this.columnCount; ci++) {
			var column = this.columns[ci];
			var name = column.name;
			var template = this.rowTemplate && this.rowTemplate[column.key] ? this.rowTemplate[column.key] : this.cellTemplate;
			var ctrl = await glui.create(name, template, row);
			//await row.add(ctrl, name);
			column.add(ctrl, ix);
			height = Math.max(height, ctrl.height);
		}
		row.height = height;
		this.rowCount++;
		await this.add(row);
		return this.rows[name];
	};
	Grid.prototype.removeColumnAt = async function removeColumnAt(ix) {
		console.log('remove column at ' + ix);
		this.columnCount--;
		throw new Error('Not Implemented!')
	};
	Grid.prototype.removeRowAt = async function removeRowAt(ix) {
		console.log('remove row at ' + ix);
		this.rowCount--;
		throw new Error('Not Implemented!')
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
		return rowKeys;
	};
	Grid.prototype.updateColumnInfo = function updateColumnInfo(rowKeys) {
		var columnCount = parseInt(this.template.cols);
		var columnKeys = null;
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
						var keys = Object.keys(dataSource[rowKeys[0]]);
						for (var i=0; i<columnCount; i++) {
							columnKeys.push(i < keys.length ? keys[i] : i);
						}
					} else {
						throw new Error('Datasource is invalid!');
					}
				} else {
					columnKeys = [];
					for (var i=0; i<columnCount; i++) {
						columnKeys.push(i);
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
					rowKeys = Object.keys(dataSource);
					columnKeys = Object.keys(dataSource[rowKeys[0]]);
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
		return columnKeys;
	};
	Grid.prototype.build = async function build() {
		var p = [];
		// titlebar
		if (!this.titlebar) {
			this.titlebar = await glui.create(`${this.id}#title`, { 'type': 'Label', 'style': this.style.title, 'z-index': this.zIndex + 1 }, this);
			this.titlebar.setValue(this.title);
		}
		var cc = parseInt(this.template.cols);
		var rc = parseInt(this.template.rows);
		var ck = [];
		var rk = [];
		var rt = this.rowTemplate;
		var ds = this.dataSource ? (this.dataField != null ? this.dataSource[this.dataField] : this.dataSource) : null;
		var ic = ds != undefined && typeof Object.values(ds)[0] === 'object';
		this.mode = ic ? Grid.modes.TABLE : Grid.modes.BOARD;
		// calculate column count and create column keys
		if (!cc) {
			if (rt) {
				ck = Object.keys(rt);
				cc = ck.length;
			} else if (ic) {
				rk = Object.keys(ds);
				ck = Object.keys(ds[rk[0]]);
				cc = ck.length;
			} else {
				cc = 2;	// default
			}
		}
		for (var i=ck.length; i<cc; i++) ck.push(i);

		// calculate row count and create row keys
		if (!rc) {
			if (ds) {
				if (ic) {
					rk = Object.keys(ds);
					rc = rk.length;
				} else {
					rc = Math.ceil(ds.length / cc);
				}
			} else {
				rc = 2;	// default
			}
		}
		for (var i=rk.length; i<rc; i++) rk.push(i);

		// update columns
		if (this.columnCount < cc) {
			for (var i=this.columnCount; i<ck.length; i++) {
				await this.insertColumnAt(ck[i], i);
			}
		} else if (this.columnCount > ck.length) {
			// remove columns
			var i = ck.length-1;
			while (i != this.columnCount) {
				this.removeColumnAt(i);
			}
		}

		// update header
		if (this.showHeader) {
			if (this.header == null) {
				this.header = new Row('header', {style:this.template.style.header}, this);
				await this.header.setRenderer(this.renderer.mode, this.renderer.context);
			}
			this.header.style.width = '100%';
			for (var i=0; i<ck.length; i++) {
				var name = this.columns[i].name;
				if (!this.header.cells[i]) {
					await glui.create(name, { 'type':'Label', 'style': this.template.style.header }, this.header);
				}
				this.header.cells[i].setValue(name);
			}
			while (this.header.cellCount > ck.length) {
				this.header.remove(this.header.cells[ck.length]);
			}
		} else {
			delete this.header;
		}
		// update rows
		if (this.rowCount < rc) {
			// add rows
			for (var i=this.rowCount; i<rk.length; i++) {
				p.push(this.insertRowAt(rk[i], i));
			}
		} else if (this.rowCount > rk.length) {
			// remove rows
			var i=rk.length-1
			while (i != this.rowCount) {
				this.removeRowAt(i);
			}
		}

		await Promise.all(p);
		if (this.dataSource) {
			this.dataBind();
		}
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
		//if (this.isDirty) await this.update();
		this.getBoundingBox();
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

	Grid.modes = {
		TABLE: 0,
		BOARD: 1
	};

	publish(Grid, 'Grid', glui);

})();
