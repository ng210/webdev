include('container.js');
(function() {
	// Row control
	function TableRowRenderer2d(control, context) {
		TableRowRenderer2d.base.constructor.call(this, control, context);
	}
	extend(glui.Renderer2d, TableRowRenderer2d);

	TableRowRenderer2d.prototype.renderControl = function renderControl() {
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
	Row.prototype.createRenderer = mode => mode == glui.Render2d ? new TableRowRenderer2d() : 'TableRowRenderer3d';

	Row.prototype.onmouseover = function onmouseover(e) {
		if (this.parent.mode == Table.modes.TABLE) {
			this.highlit = true;
			this.render();
		}
	};
	Row.prototype.onmouseout = function onmouseout(e) {
		if (this.parent.mode == Table.modes.TABLE) {
			this.highlit = false;
			this.render();
		}
	};
	Row.prototype.onfocus = function onfocus(e) {
		if (this.parent.mode == Table.modes.TABLE) {
			this.parent.selectedRow = this;
		}
	};
	Row.prototype.onblur= function onblur(e) {
		if (this.parent.mode == Table.modes.TABLE) {
			this.parent.selectedRow = null;
		}
	};

	// Column object
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


	// Table control
	const headKey = '__head';

	function TableRenderer2d(control, context) {
		TableRenderer2d.base.constructor.call(this, control, context);
	}
	extend(glui.Renderer2d, TableRenderer2d);

	TableRenderer2d.prototype.renderControl = function renderControl() {
		var table = this.control;
		var top = 0;
		// draw titlebar
		if (table.titlebar) {
			table.titlebar.renderer.render();
			top += table.titlebar.height + table.titlebar.renderer.border.width;
		}

		// calculate cell widths
		// var headerHeight = 0, height = 0;
		var width = table.width - 2*this.border.width;
		var columnWidths = [];
		var percentage = 0;
		var absolute = 0;
		// sum percentage (undefined = 100%)
		// sum absolute values
		// rest = total - absolute
		// distribute rest among percentage
		for (var ci=0; ci<table.columnCount; ci++) {
			var column = table.columns[ci];
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
			// if (table.rowTemplate) {
			// 	headerHeight = Math.max(table.rows[headKey].cells[ci].height, height);
			// }
			// per row: table.rows[..] => row
			// height = Math.max(table.rows[table.rowKeys[1]].cells[ci].height, height);
		}
		var restWidth = width - absolute;
		for (var ci=0; ci<table.columnCount; ci++) {
			var column = table.columns[ci];
			if (column.width == -1) {
				column.width = Math.ceil(restWidth/percentage*columnWidths[ci]);
				restWidth -= column.width;
				percentage -= columnWidths[ci];
			}
		}

		// draw header
		if (table.showHeader) {
			table.header.move(0, top);
			table.header.renderer.render();
			top += table.header.height;
		}

		// draw rows
		for (var i=0; i<table.rowCount; i++) {
			var row = table.rows[table.rowKeys[i]];
			if (row.style.visible) {
				row.move(0, top);
				row.renderer.render();
				top += row.height;
			}
		}
	};

	function Table(id, template, parent, context) {
		this.rowCount = 0;
		this.columnCount = 0;
		this.header = null;
		this.rowKeys = [];
		this.rows = {};
		this.columnKeys = [];
		this.columns = {};
		this.isDirty = true;
		this.titlebar = null;
		this.mode = Table.modes.TABLE;
		this.selectedRow = null;
		Table.base.constructor.call(this, id, template, parent, context);
	};
	extend(glui.Container, Table);

	Table.prototype.getTemplate = function getTemplate() {
		var template = Table.base.getTemplate.call(this);
		template.style.cell = glui.Control.getStyleTemplate();
		template.style.title = null;
		template.style.header = glui.Control.getStyleTemplate();
		template.style.height = 0;
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
	Table.prototype.applyTemplate = function applyTemplate(tmpl) {
		if (tmpl.style.width == undefined) tmpl.style.width = 0;
		var template = Table.base.applyTemplate.call(this, tmpl);
		// Build cell style: merge(grid.style, grid.style.cell, tmpl.style.cell);
		this.cellStyle = mergeObjects(template.style, template.style.cell);
		delete this.cellStyle.cell;
		delete this.cellStyle.title;
		delete this.cellStyle.header;

		this.style.header = mergeObjects(this.cellStyle, template.style.header);
		this.style.title = mergeObjects(this.cellStyle, template.style.title);

		this.cellTemplate = template['cell-template'];
		if (!tmpl['cell-template']) {
			this.cellTemplate.style = mergeObjects(this.cellTemplate.style, this.cellStyle);
		} else {
			this.cellTemplate.style = mergeObjects(this.cellStyle, this.cellTemplate.style);
		}
		this.rowTemplate = template['row-template'];
		for (var i in this.rowTemplate) {
			this.rowTemplate[i].style = mergeObjects(this.cellTemplate.style, this.rowTemplate[i].style)
		}

		this.style.title.width = '100%';
		this.title = template.title;

		this.showHeader = !!template.header;

		return template;
	};
	Table.prototype.dataBind = function(source, field) {
		//glui.Control.prototype.dataBind.call(this, source, field);
		this.dataSource = source || this.dataSource;
		this.dataField = field || this.dataField;
		var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
		if (this.mode == Table.modes.TABLE) {
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
    Table.prototype.getHandlers = function getHandlers() {
        var handlers = Table.base.getHandlers.call(this);
        handlers.push(
            { name: 'mousedown', topDown: true },
            { name: 'mouseup', topDown: false }
        );
        return handlers;
	};
	Table.prototype.createRenderer = mode => mode == glui.Render2d ? new TableRenderer2d() : 'TableRenderer3d';
	Table.prototype.setRenderer = async function setRenderer(mode, context) {
		await Table.base.setRenderer.call(this, mode, context);
		await this.update();
	};
	Table.prototype.getBoundingBox = function getBoundingBox() {
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

			this.height += 2*this.renderer.border.width;
		}
		if (this.width == 0) {
			for (var i=0; i<this.columnCount; i++) {
				var column = this.columns[this.columnKeys[i]];
				this.width += this.renderer.convertToPixel(column.width, false);
			}
			this.width += 2*this.renderer.border.width;
		}
		return Table.base.getBoundingBox.call(this);
    };
	Table.prototype.update = async function update() {
		// titlebar
		if (this.titlebar) {
			this.titlebar.setVisible(!!this.title);
			this.titlebar.setValue(!!this.title);
		}

		this.isDirty = false;
	};
	Table.prototype.insertColumnAt = async function insertColumnAt(key, ix) {
		var rt = this.rowTemplate;
		var reference = rt && rt[key] && rt[key].column ? rt[key].column : null;
		var name = Table.resolveReference(reference, key);
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
	Table.prototype.insertRowAt = async function insertRowAt(name, ix) {
		if (ix != undefined) this.rowKeys.splice(ix, 0, name);
		else this.rowKeys.push(name);
		var row = this.rows[name] = new Row(name, {style:{width:'100%'}}, this);
		await row.setRenderer(glui.mode, this.renderer.context);
		row.index = ix;
		for (var i=ix+1; i<this.rowKeys.length; i++) this.rows[this.rowKeys[i]].index++;
		// update columns
		var height = 0;
		for (var ci=0; ci<this.columnCount; ci++) {
			var column = this.columns[ci];
			var name = column.name;
			var template = this.rowTemplate && this.rowTemplate[column.key] ? this.rowTemplate[column.key] : this.cellTemplate;
			template.style = mergeObjects(this.cellTemplate.style, template.style);
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
	Table.prototype.removeColumnAt = async function removeColumnAt(ix) {
		console.log('remove column at ' + ix);
		this.columnCount--;
		throw new Error('Not Implemented!')
	};
	Table.prototype.removeRowAt = async function removeRowAt(ix) {
		console.log('remove row at ' + ix);
		this.rowCount--;
		var row = this.rows[this.rowKeys[ix]];
		delete this.rows[this.rowKeys[ix]];
		this.rowKeys.splice(ix, 1);
		Table.base.remove.call(this, row);
	};
	Table.prototype.updateRowInfo = function updateRowInfo() {
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
	Table.prototype.updateColumnInfo = function updateColumnInfo(rowKeys) {
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
	Table.prototype.build = async function build() {
		var p = [];
		// titlebar
		if (this.title && !this.titlebar) {
			this.titlebar = await glui.create(`${this.id}#title`, { 'type': 'Label', 'style': this.style.title/*, 'z-index': this.zIndex + 1*/ }, this);
			this.titlebar.setValue(this.title);
		}
		var cc = parseInt(this.template.cols);
		var rc = parseInt(this.template.rows);
		var ck = [];
		var rk = [];
		var rt = this.rowTemplate;
		var ds = this.dataSource ? (this.dataField != null ? this.dataSource[this.dataField] : this.dataSource) : null;
		var ic = ds != undefined && typeof Object.values(ds)[0] === 'object';
		this.mode = ic ? Table.modes.TABLE : Table.modes.BOARD;
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
		if (rk.length < rc) {
			for (var i=rk.length; i<rc; i++) rk.push(i);
		} else {
			rk = rk.splice(rk.length-rc, rc);
		}

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
				this.header = new Row('header', {style:{width: '100%', height:this.template.style.header.height}}, this);
				await this.header.setRenderer(this.renderer.mode, this.renderer.context);
			}
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
			var i=rk.length;
			while (i != this.rowCount) {
				this.removeRowAt(i-1);
			}
		}

		await Promise.all(p);
		if (this.dataSource) {
			this.dataBind();
		}
		this.getBoundingBox();
	};
    Table.prototype.replace = function replace(item, newItem) {
		var result = Table.base.replace.call(this, item, newItem);
		if (result == item) {
			var id = item.id.split('#');
			newItem.id = id;
			newItem.parent = this;
			newItem.style.width = item.style.width;
			newItem.style.height = item.style.height;
			newItem.style.border = item.style.border;
			newItem.style['background-color'] = item.style['background-color'];
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
	Table.prototype.getCell = function(ri, ci) {
		if (typeof ri === 'string') {
			var tokens = ri.split('#');
			ri = tokens[0];
			ci = tokens[1];
		}
		var row = this.rows[ri];
		return row ? row.cells[ci] : null;
	};
	Table.prototype.render = function render() {
		//if (this.isDirty) await this.update();
		this.getBoundingBox();
		glui.Control.prototype.render.call(this);
	};

	Table.resolveReference = function resolveReference(reference, key) {
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

	Table.modes = {
		TABLE: 0,
		BOARD: 1
	};

	publish(Table, 'Table', glui);

})();
