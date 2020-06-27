include('container.js');
include('renderer2d.js');
include('label.js');

(function() {
// strict structure of controls based on rows and columns
// templates for rows or for cells

	const headKey = '__head';

	function GridRenderer2d(control, context) {
		GridRenderer2d.base.constructor.call(this, control, context);
	}
	extend(glui.Renderer2d, GridRenderer2d);

	GridRenderer2d.prototype.renderControl = function renderControl() {
		var ctrl = this.control;
		var top = 0;
		// draw titlebar
		if (ctrl.titlebar) {
			ctrl.titlebar.render();
			top += ctrl.titlebar.height;
		}
		// draw rows
		var left = 0;
		for (var ri=0; ri<ctrl.rowKeys.length; ri++) {
			var key = ctrl.rowKeys[ri];
			if (key == headKey && !ctrl.showHeader) continue;
			var row = ctrl.rows[key];
			var height = 0;
			for (var ci=0; ci<ctrl.columnKeys.length; ci++) {
				var cell = row.cells[ctrl.columnKeys[ci]];
				cell.move(left, top);
				cell.width = cell.column.width;
				cell.render();
				left += cell.width;
				height = Math.max(height, cell.height);
			}
			left = 0;
			top += height;
		}
	};

	function Grid(id, template, parent, context) {
		Grid.base.constructor.call(this, id, template, parent, context);
	};
	extend(glui.Container, Grid);

	Grid.prototype.getTemplate = function getTemplate() {
		var template = Grid.base.getTemplate.call(this);
		template.style.height = 0;
		template.style.title = glui.Control.getStyleTemplate();
		template.style.title.width = '100%';
		template.style.header = glui.Control.getStyleTemplate();
		delete template.style.header.width;
		template.style.header.height = 0;
		template.title = this.id;
		template.rows = '0';
		template.cols = '0';
		template.header = false;
		template['row-template'] = null;
		template['cell-template'] = null;
		return template;
	};
	Grid.prototype.applyTemplate = function applyTemplate(tmpl) {
		var template = Grid.base.applyTemplate.call(this, tmpl);
		this.cellStyle = glui.Control.mergeFields(tmpl.style);
		this.cellStyle.width = 0;
		this.cellStyle.height = '1.5em';
		delete this.cellStyle.visible;
		if (tmpl['row-template']) {
			var rowTemplate = { };
			for (var i in tmpl['row-template']) {
				rowTemplate[i] = glui.Control.mergeFields(tmpl['row-template'][i]);
				rowTemplate[i].style = glui.Control.mergeFields(this.cellStyle, rowTemplate[i].style);
			}
		 	template['row-template'] = rowTemplate;
		}
		if (tmpl['cell-template']) {
			var template = glui.Control.mergeFields(tmpl);
			template['cell-template'] = glui.Control.mergeFields(this.style, template.style);
		}
		if (tmpl.style.header) {
			tmpl.style.header = glui.Control.mergeFields(this.style, tmpl.style.header);
		}
		if (tmpl.style.title) {
			tmpl.style.title = glui.Control.mergeFields(this.style, tmpl.style.title);
			tmpl.style.title.width = '100%';
		}
		this.rowCount = parseInt(template.rows);
		this.colCount = parseInt(template.cols);
		this.rowTemplate = template['row-template'];
		this.cellTemplate = template['cell-template'];
		this.title = template.title;

		// set rows/columns array
		this.rowKeys = null;
		this.rows = null;
		this.columnKeys = null;
		this.columns = null;

		this.showHeader = !!template.header;

        if (this.dataSource && this.dataField) {
            this.dataBind();
        }
		return template;
	};
	Grid.prototype.dataBind = function(source, field) {
		source = source || this.dataSource;
        if (source) {
            //this.dataSource = source instanceof DataLink ? source : new DataLink(source);
			this.dataField = field !== undefined ? field : this.dataField;
			this.dataSource = source;
		}
		this.build();
		return this.dataSource;
	};
    Grid.prototype.getHandlers = function getHandlers() {
        var handlers = Grid.base.getHandlers.call(this);
        handlers.push('mousedown', 'mouseup', 'click');
        return handlers;
	};
    Grid.prototype.setRenderer = function(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = new GridRenderer2d(this, context);
            }
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = new GridRenderer3d(this, context);
            }
            this.renderer = this.renderer3d;
		}
		if (this.titlebar) {
			this.titlebar.setRenderer(mode, context);
		}
		if (this.rowKeys) {
			var width = this.width;
			var count = 0;
			for (var i in this.rowTemplate) {
				var colWidth = this.renderer.convertToPixel(this.rowTemplate[i].style.width, this.width);
				if (colWidth) {
					this.columns[i].width = colWidth;
					width -= colWidth;
				} else count++;
			}
			var colWidth = Math.floor(width/count);
			for (var ri=0; ri<this.rowKeys.length; ri++) {
				var row = this.rows[this.rowKeys[ri]];
				for (var ci=0; ci<this.columnKeys.length; ci++) {
					var cell = row.cells[this.columnKeys[ci]];
					if (!cell.column.width) {
						cell.column.width = width > colWidth ? colWidth : width;
					}
					cell.setRenderer(mode, context);
				}
			}
		}
	};
	// Grid.prototype.render = function() {
    //     if (this.renderer) {
	// 		this.getBoundingBox();
	// 		this.renderer.render();
    //     }
	// };
	Grid.prototype.getBoundingBox = function getBoundingBox() {
		if (this.height == 0) {
			var rowCount = this.rowKeys.length;
			if (this.titlebar) {
				this.height += this.titlebar.height;
			}
			if (this.showHeader) {
				this.renderer.setFont(this.style.header.font);
				this.height += this.renderer.convertToPixelV(this.style.header.height);
				rowCount--;
			}
			if (rowCount > 0) {
				var h = 0;
				for (var ci=0; ci<this.columnKeys.length; ci++) {
					var style = this.rowTemplate[this.columnKeys[ci]].style;
					this.renderer.setFont(style.font);
					h = Math.max(h, this.renderer.convertToPixelV(style.height));
				}
				this.height += h * rowCount;
			}
			this.height += 2*this.renderer.border.width;
		}
        return [this.left, this.top, this.width, this.height];
    };
    Grid.prototype.move = function move(dx, dy) {
		Grid.base.move.call(this, dx, dy);
		if (this.titlebar) this.titlebar.move(0, 0);
		for (var ri=0; ri<this.rowKeys.length; ri++) {
			var row = this.rows[this.rowKeys[ri]];
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				row.cells[this.columnKeys[ci]].move(0, 0);
			}
		}
    };
	Grid.prototype.buildRow = function(row, src, rowTmpl) {
		// build a row from the given data source
		// using the selected template
		var ri = row.id;
		for (var ci=0; ci<this.columnKeys.length; ci++) {
			var key = this.columnKeys[ci];
			var column = this.columns[key];
			var tmpl = rowTmpl[key];
			var dataField = tmpl['data-field'] || key;
			tmpl['z-index'] = this.zIndex + 1;
			var cell = glui.create(this.id + '#' + ri + '#' + ci, tmpl, this, this);
			this.add(cell);
			// if (tmpl.label === true) {
			// 	cell.label = row.name + '.' + key;
			// }
			src = cell.dataBind(src, dataField);
			cell.row = row; cell.column = column;
			row.cells[ci] = row.cells[key] = cell;
			column.cells.push(cell);
		}
		return row;
	};
	Grid.prototype.updateColumnCountFromDataSource = function(src) {
		// The count of columns/cells is defined by columnCount (or maximum count of items in the data source)
		for (var i in src) {
			if (src.hasOwnProperty(i)) {
				var rowItem = src[i];
				if (!Array.isArray(rowItem) && typeof rowItem !== 'object') {
					throw new Error('Invalid item at row ' +  i + '! It has to be an enumerable.');
				}
				var count = Object.keys(rowItem);
				if (count > this.columnCount) {
					this.columnCount = count;
				}
			}
		}
	};
	Grid.prototype.build = function() {
		if (this.title) {
			if (!this.titlebar) {
				this.titlebar = glui.create(`${this.id}#title`,
				{
					'type': 'Label',
					'style': this.style.title || this.style,
					'z-index': this.zIndex + 1
				}, this, this.context);
			}
			this.titlebar.style.height = '2.0em';
			this.titlebar.setValue(this.title);
			this.add(this.titlebar);
		} else {
			if (this.titlebar) {
				this.remove(this.titlebar);
				this.titlebar = null;
			}
		}

		var src = this.dataField ? this.dataSource[this.dataField] : this.dataSource;
		// get or create row template
		var rowTemplate = this.rowTemplate;
		this.rows = {};
		this.rowKeys = Object.keys(src);
		this.columns = {};
		if (rowTemplate == null) {
			// create row template based on cell templates
			this.updateColumnCountFromDataSource(src);
			if (this.columnCount == 0 || this.cellTemplate == null) {
				throw new Error('When not providing a row-template, the attributes \'cols\' and \'cell-template\' have to be present!');
			}
			// create columns, build row template
			this.columnKeys = [];
			rowTemplate = [];
			for (var ci=0; ci<this.columnCount; ci++) {
				// column keys are the ordinals
				this.columnKeys[ci] = ci+'';
				rowTemplate[ci] = this.cellTemplate;
				this.columns[ci] = new Grid.Column(ci, ci, this);
			}
		} else {
			// create columns, the keys of columns are defined by the first row in the data source
			this.columnKeys = Object.keys(rowTemplate);
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				var key = this.columnKeys[ci]
				this.columns[key] = this.columns[ci] = new Grid.Column(ci, key, this);
			}
			this.columnCount = this.columnKeys.length;
		}
		// create rows and cells
		if (this.template.header) {
			this.rowKeys.unshift(headKey);
			var row = new Grid.Row(-1, headKey, this);
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				var key = this.columnKeys[ci];
				var column = this.columns[key];
				var style = glui.Control.mergeFields(this.rowTemplate[key].style, this.style.header);
				var cell = glui.create(this.id + '#00' + '#' + ci, {'type':'Label', 'style':style, 'z-index': this.zIndex+1}, row, this.context);
				cell.setValue(Grid.resolveReference(rowTemplate[key].column, key));
				cell.row = row; cell.column = column;
				row.cells[ci] = row.cells[key] = cell;
				this.add(cell);
				//column.cells.push(cell);
			}
			this.rows[headKey] = row;
		}
		for (var ri=0; ri<this.rowKeys.length; ri++) {
			var rowKey = this.rowKeys[ri];
			if (rowKey == headKey) continue;
			var srcRow = src[rowKey];
			var row = new Grid.Row(ri, rowKey, this);
			this.buildRow(row, srcRow, rowTemplate);
			this.rows[rowKey] = row;
		}
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

	Grid.resolveReference = function(reference, key) {
		var result = reference;
		if (typeof reference === 'string') {
			if (reference == '$key') {
				result = key.charAt(0).toLowerCase() + key.substring(1);
			} else if (reference === '$Key') {
				result = key.charAt(0).toUpperCase() + key.substring(1);
			}
		}
		return result;
	};

	Grid.Column = function Column(id, name, parent) {
		this.id = id;
		this.name = name;
		this.parent = parent;
		this.cells = [];
	};

	Grid.Row = function Row(id, name, parent) {
		this.id = id;
		this.name = name;
		this.parent = parent;
		this.cells = {};
		this.handlers = {};
	};
	Grid.Row.prototype = {
		get width() { return this.parent.width; },
		get renderer() { return this.parent.renderer; },
		get handlers() { return this.parent.handlers; }
	};

	public(Grid, 'Grid', glui);

})();

