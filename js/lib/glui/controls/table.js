include('container.js');
(function() {

	//#region Row
	function TableRowRenderer2d(control, context) {
		TableRowRenderer2d.base.constructor.call(this, control, context);
	}
	extend(glui.Renderer2d, TableRowRenderer2d);

	TableRowRenderer2d.prototype.renderControl = function renderControl() {
		var row = this.control;
		var table = row.parent;
		var left = 0;
//console.log(getObjectPath(this.control, 'parent', glui.screen).map(x => x.id).join('.'));
		for (var i=0; i<row.items.length; i++) {
			var cell = row.items[i];
			cell.width = table.columns[i].width;
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
		template.type = 'Row';
		Row.base.constructor.call(this, id, template, parent, context);
	}
	extend(glui.Container, Row);

	// Row.prototype.dataBind = function dataBind(source, field) {
	// 	Row.base.dataBind.call(this, source, field);
	// 	// glui.Control.prototype.dataBind.call(this, source[field]);
	// 	// var grid = this.parent;
	// 	// var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
	// 	// for (var i=0; i<grid.columnKeys.length; i++) {
	// 	// 	var dataField = grid.columns[i].dataField || grid.columns[i].key;
	// 	// 	this.cells[i].dataBind(dataSource, dataField);
	// 	// }
	// };
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
	Row.prototype.onblur = function onblur(e) {
		if (this.parent.mode == Table.modes.TABLE) {
			this.parent.selectedRow = null;
		}
	};
	glui.schema.buildType({
		'name':'Row',
		'type':'Container'
	});
	//#endregion

	//#region Column
	function Column(name, key, parent) {
		this.id = `${parent.id}#col#${key}`;
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
	//#endregion

	//#region Table
	const headKey = '__head';

	function TableRenderer2d(control, context) {
		TableRenderer2d.base.constructor.call(this, control, context);
	}
	extend(glui.Renderer2d, TableRenderer2d);

    TableRenderer2d.prototype.getBestSizeInPixel = function getBestSizeInPixel(isInner) {
		return this.control.getBestSizeInPixel(isInner);
    };

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
		if (table.items[1]) width -= 2*table.items[1].renderer.border.width;
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
		this.header = null;
		this.rowKeys = [];
		this.rows = {};
		this.rowCount = 0;
		this.columnKeys = [];
		this.columns = {};
		this.columnCount = 0;
		this.isDirty = true;
		this.titlebar = null;
		this.selectedRow = null;
		this.rowStyle = null;
		this.cellStyle = null;
		this.headerStyle = null;

		this.title = id;
		this.titleStyle = null;
		this.showHeader = true;
		this.mode = Table.modes.TABLE;
		this.cellTemplate = null;
		this.rowTemplate = null;

		Table.base.constructor.call(this, id, template, parent, context);
	};
	extend(glui.Container, Table);

	Table.prototype.getTemplate = function getTemplate() {
		var template = Table.base.getTemplate.call(this);
		// template.style.cell = template.cellType.prototype.getStyleTemplate();
		// template.style.title = null;
		// template.style.header = glui.Label.getStyleTemplate();
		template.style.height = 0;
		template.title = this.id;
		template['show-header'] = false;
		template.mode = Table.modes.TABLE;
		template['title-style'] = {};
		template['header-style'] = {};
		template['row-template'] = {};
		template['cell-template'] = {};
		template.cols = 0;
		template.rows = 0;
		//template['cell-template'].style.width = 'auto';
		//template['cell-template'].style.border = '#000000 1px solid';
		return template;
	};
	Table.prototype.applyTemplate = function applyTemplate(tmpl) {
		this.template = Table.base.applyTemplate.call(this, tmpl);
		this.title = this.template.title;
		this.showHeader = this.template['show-header'] || false;
		this.mode = this.template.mode;
		this.rowTemplate = this.template['row-template'];
		this.rowTemplateCount = Object.keys(this.template['row-template']).length;
		this.titleStyle = this.template['title-style'];
		this.headerStyle = this.template['header-style'];

		// default style
		var typeName = this.template['cell-template'].type || 'Label';
		var type = glui.schema.types.get(typeName);
		var styleType = type.attributes.get('style').type;
		// create cell-template
		this.cellTemplate = type.createDefaultValue(null, true);
		this.cellTemplate.id = `${this.id}#cell-template`;
		// merge table style
		glui.schema.mergeObjects(this.style, this.cellTemplate.style, styleType, self.mergeObjects.OVERWRITE);
		// merge cell-template
		if (tmpl['cell-template']) {
			glui.schema.mergeObjects(tmpl['cell-template'], this.cellTemplate, type, self.mergeObjects.OVERWRITE);
		}
		if (!tmpl['cell-template'] || !tmpl['cell-template'].width) {
			this.cellTemplate.style.width = '100%';
		}
		glui.schema.mergeObjects(this.cellTemplate.style, this.titleStyle, styleType);
		if (!tmpl['title-style'] || !tmpl['title-style'].font) {
			var font = this.titleStyle.font.split(' ')
        	font[1] = parseFloat(font[1])*1.2;
        	this.titleStyle.font = font.join(' ');
		}
		glui.schema.mergeObjects(this.cellTemplate.style, this.headerStyle, styleType);
		return this.template;
	};
	// #region Build
	Table.prototype.buildRowTemplate = function buildRowTemplate(columnKeys) {
		var ci = 0;
		for (var i in this.rowTemplate) {
			if (this.rowTemplate.hasOwnProperty(i)) {
				var item = this.rowTemplate[i];
				var styleType = glui.schema.types.get(item.type).attributes.get('style').type;
				// merge main style into row-template item's style
				glui.schema.mergeObjects(this.style, item.style, styleType);
				// merge cell-template's style into row-template item's style
				glui.schema.mergeObjects(this.cellTemplate.style, item.style, styleType);
				ci++;
			}
		}
		for (;ci < this.rowTemplateCount; ci++) {
			var tmpl = clone(this.cellTemplate);
			tmpl.id = `${this.id}#cell${ci}`;
			tmpl['data-field'] = columnKeys[ci].toString();
			this.rowTemplate[columnKeys[ci]] = tmpl;
		}
	};
	Table.prototype.build = function build() {
		//#region Calculate row and column count
		var rowCount_ = this.rowCount;
		var rowCount = this.template.rows;
		var rowKeys = [];
		var columnCount_ = this.columnCount;
		var columnCount = this.template.cols;
		var columnKeys = [];
		if (columnCount == 0 && this.rowTemplate != null) columnCount = this.rowTemplateCount;
		if (this.dataSource) {
			var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
			rowKeys = Object.keys(dataSource);
			if (rowCount == 0) rowCount = rowKeys.length;
			if (Array.isArray(dataSource[rowKeys[0]]) || typeof dataSource[rowKeys[0]] === 'object') {
				columnKeys = Object.keys(dataSource[rowKeys[0]]);
				if (columnCount == 0) columnCount = columnKeys.length;
			}
		}

		// defaults
		if (rowCount == 0) rowCount = 2;
		if (columnCount == 0) columnCount = 2;

		if (this.mode == Table.modes.BOARD) {
			rowCount = Math.ceil(rowCount / columnCount);
			rowKeys.length = 0;
		}

		// update row and column keys
		for (var i=rowKeys.length; i<rowCount; i++) rowKeys.push(i);
		for (var i=columnKeys.length; i<columnCount; i++) columnKeys.push(i);
		//#endregion
		this.rowTemplateCount = columnCount;
		this.buildRowTemplate(columnKeys);
		// titlebar
		if (this.title && !this.titlebar) {
			this.titleStyle.width = '100%';
			this.titlebar = glui.create(`${this.id}#title`, { 'type': 'Label', 'style': this.titleStyle/*, 'z-index': this.zIndex + 1*/ }, this);
			this.titlebar.noBinding = true;
			this.titlebar.setValue(this.title);
		}

		//#region update columns
		if (columnCount_ < columnCount) {
			for (var i=columnCount_; i<columnCount; i++) {
				this.insertColumnAt(columnKeys[i], i);
			}
		} else {
			var i = columnCount_-1;
			while (i != columnCount) {
				this.removeColumnAt(i);
			}
		}
		//#endregion

		//#region Update header
		if (this.showHeader) {
			if (this.header == null) {
				this.header = new Row('header', {style:this.headerStyle}, this);
				this.header.setRenderer(this.renderer.mode, this.renderer.context);
			}
			if (this.header.cellCount < this.columnCount) {
				for (var i=0; i<this.columnCount; i++) {
					var name = this.columns[i].name;
					if (!this.header.cells[i]) {
						glui.create(name, { 'type':'Label', 'style':this.headerStyle }, this.header);
					}
					this.header.cells[i].setValue(name);
				}
			} else {
				var ix = this.columnCount;
				while (this.header.cellCount > this.columnCount) {
					this.header.remove(this.header.cells[ix]);
				}
			}
		} else {
			this.header = null;
		}
		//#endregion

		//#region Update rows
		if (rowCount_ < rowCount) {
			for (var i=rowCount_; i<rowCount; i++) {
				this.insertRowAt(rowKeys[i], i);
			}
		} else {
			var i=rowCount_-1;
			while (i != rowCount) {
				this.removeRowAt(i);
			}
		}
		//#endregion

		if (this.template['data-source']) {
			this.dataBind();
		}

		// invalidate width and height
		this.width = 0;
		this.height = 0;
		this.getBoundingBox();

if (false) {

		var cc = this.columnKeys.length;
		var rc = this.rowKeys.length;
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

		//await Promise.all(p);
		if (this.dataSource) {
			this.dataBind();
		}

		this.titlebar.setValue(this.title);

		// invalidate width and height
		this.width = 0;
		this.height = 0;
		this.getBoundingBox();
}
	};
	//#endregion

 	Table.prototype.dataBind = function(source, field) {
		if (this.mode == Table.modes.TABLE) {
 			Table.base.dataBind.call(this, source, field);
		} else {
			glui.Control.prototype.dataBind.call(this, source, field);
			var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
			var keys = Object.keys(dataSource);
			var k = 0;
			for (var i=0; i<this.items.length; i++) {
				var row = this.items[i];
				if (row.constructor != Row) continue;
				for (var j=0; j<row.items.length; j++) {
					var cell = row.items[j];
					if (k < keys.length) {
						cell.dataBind(dataSource, keys[k++].toString());
					}
				}
			}
		}
// 		glui.Control.prototype.dataBind.call(this, source, field);
// 		var dataSource = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
// debugger
// 		for (var i=0; i<this.rowKeys.length; i++) {
// 			var key = this.rowKeys[i];
// 			this.rows[key].dataBind(dataSource, key);
// 		}
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
	Table.prototype.setRenderer = function setRenderer(mode, context) {
		Table.base.setRenderer.call(this, mode, context);
	};
	Table.prototype.getBestSizeInPixel = function getBestSizeInPixel(isInner) {
		var height = 0;
		if (this.titlebar) {
			height += this.titlebar.height;
		}
		if (this.showHeader && this.header) {
			//this.renderer.setFont(this.style.header.font);
			//this.height += this.renderer.convertToPixel(this.style.header.height, true);
			height += this.header.renderer.convertToPixel(this.header.style.height, true);
			height += 2*this.header.renderer.convertToPixel(this.header.renderer.border.width, true);
		}
		for (var i=0; i<this.rowKeys.length; i++) {
			var row = this.rows[this.rowKeys[i]];
			height += row.height;
		}

		height += 2*this.renderer.border.width;

		var width = 0;
		for (var i=0; i<this.columnKeys.length; i++) {
			var column = this.columns[this.columnKeys[i]];
			width += this.renderer.convertToPixel(column.width, false);
		}
		if (this.rowKeys.length > 0) {
			width += 2*this.items[1].renderer.border.width;
		}
		width += 2*this.renderer.border.width;
		return [width, height];
	};
	Table.prototype.getBoundingBox = function getBoundingBox() {
		this.width = this.width || this.renderer.convertToPixel(this.template.style.width, false);
		this.height = this.height || this.renderer.convertToPixel(this.template.style.height, true);
		return Table.base.getBoundingBox.call(this);
    };
	Table.prototype.update = function update() {
		// titlebar
		if (this.titlebar) {
			this.titlebar.setVisible(!!this.title);
			this.titlebar.setValue(!!this.title);
		}

		this.isDirty = false;
	};
	Table.prototype.insertColumnAt = function insertColumnAt(key, ix) {
		var rt = this.rowTemplate;
		var reference = rt && rt[key] && rt[key].column ? rt[key].column : null;
		var name = Table.resolveReference(reference, key);
		if (ix != undefined && ix < this.columnCount) {
			this.columnKeys.splice(ix, 0, name);
			for (var i=0; i<this.columnCount; i++) {
				this.columns[i+1] = this.columns[i];
			}
		}
		else {
			this.columnKeys.push(name);
			ix = this.columnCount;
		}

		this.columns[ix] = this.columns[name] = new Column(name, key, this);
		// update rows
		var template = this.rowTemplate[key];
		for (var ri=0; ri<this.rowCount; ri++) {
			var row = this.rows[this.rowKeys[ri]];
			var ctrl = glui.create(key, template, row);
			this.columns[name].add(ctrl, ri);
		}

		this.columnCount++;
		return this.columns[name];
	};
	Table.prototype.insertRowAt = function insertRowAt(name, ix) {
		if (ix != undefined) this.rowKeys.splice(ix, 0, name);
		else this.rowKeys.push(name);
		var row = this.rows[name] = new Row(`${this.id}#row#${name}`, {'data-field':name.toString(), 'style':{'width':'100%'}}, this);
		row.setRenderer(glui.mode, this.renderer.context);
		row.index = ix;
		for (var i=ix+1; i<this.rowKeys.length; i++) this.rows[this.rowKeys[i]].index++;
		// update columns
		var height = 0;
		for (var ci=0; ci<this.columnCount; ci++) {
			var column = this.columns[ci];
			var name = column.name;
			var template = this.rowTemplate[column.key];
			var ctrl = glui.create(name, template, row);
			//await row.add(ctrl, name);
			column.add(ctrl, ix);
			height = Math.max(height, ctrl.height + 2*row.renderer.border.width);
		}
		row.height = height;
		this.rowCount++;
		this.add(row);
		return this.rows[name];
	};
	Table.prototype.removeColumnAt = function removeColumnAt(ix) {
		console.log('remove column at ' + ix);
		this.columnCount--;
		throw new Error('Not Implemented!')
	};
	Table.prototype.removeRowAt = function removeRowAt(ix) {
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
		//this.getBoundingBox();
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

	glui.schema.addType(new EnumType('TableMode', null, { 'values':Object.values(Table.modes) }));

    // Table.getStyleType = () => {
    //     return {
    //         'name':'TableStyle',
	// 		'type':'ControlStyle',
    //         'attributes': {
	// 			'spacing':	{ 'type':'string', 'isRequired':false }
    //         }
    //     };
    // };
    // Table.getTypeDescriptor = () => {
    //     return {
    //         'name':'Table',
	// 		'type':'Container',
    //         'attributes': {
	// 			'title':		{ 'type':'string', 'isRequired':false },
	// 			'show-header':	{ 'type':'bool', 'isRequired':false },
	// 			'mode':			{ 'type':'TableMode', 'isRequired':false },
	// 			'rows':			{ 'type':'int', 'isRequired':false },
	// 			'cols':			{ 'type':'int', 'isRequired':false },
	// 			'title-style':	{ 'type':glui.schema.types.get('ControlStyle'), 'isRequired':false },
	// 			'header-style':	{ 'type':glui.schema.types.get('ControlStyle'), 'isRequired':false },
	// 			'cell-template':{ 'type':glui.schema.types.get('Control'), 'isRequired':false },
	// 			'row-template':	{ 'type': { 'type':'list', 'elemType': glui.schema.types.get('Control') }, 'isRequired':false },
    //             'style':		{ 'type':Table.getStyleType(), 'isRequired':false }
    //         }
    //     };
    // };
	//#endregion

    glui.schema.buildType({
		'name':'Table',
		'attributes': {
			'title':		{ 'type':'string', 'isRequired':false, 'default':'Table' },
			'show-header':	{ 'type':'bool', 'isRequired':false, 'default':true },
			'mode':			{ 'type':'TableMode', 'isRequired':false, 'default':Table.modes.TABLE },
			'rows':			{ 'type':'int', 'isRequired':false, 'default':2 },
			'cols':			{ 'type':'int', 'isRequired':false, 'default':2 },
			'title-style':	{ 'type':glui.schema.types.get('ControlStyle'), 'isRequired':false, 'default':{} },
			'header-style':	{ 'type':glui.schema.types.get('ControlStyle'), 'isRequired':false, 'default':{} },
			'cell-template':{ 'type':glui.schema.types.get('Control'), 'isRequired':false, 'default':{} },
			'row-template':	{ 'type': { 'type':'list', 'elemType': glui.schema.types.get('Control') }, 'isRequired':false, 'default':[] },
			'style': {
				'type': {
					'name':'TableStyle',
					'type':'ControlStyle',
					'attributes': {
						'spacing':	{ 'type':'string', 'isRequired':false }
					}					
				},
				'isRequired':false
			}
        },
		'type':'Container',
    });
	publish(Table, 'Table', glui);

})();
