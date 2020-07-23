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
		var width = ctrl.width - 2*this.border.width;
		var widthPercent = 0;
		var columnWithoutWidth = 0;
		var columns = [];
		var headerHeight = 0, height = 0;
		for (var ci=0; ci<ctrl.columnCount; ci++) {
			var column = ctrl.columns[ci];
			if (!column.style.width) {
				columnWithoutWidth++;
				columns.push(column);
			} else if (column.style.width.endsWith('%')) {
				widthPercent += parseFloat(column.style.width);
				columns.push(column);
			} else {
				width -= column.width = column.cells[0].renderer.convertToPixel(column.style.width, 0);
			}
			if (ctrl.rowTemplate) {
				headerHeight = Math.max(ctrl.rows[headKey].cells[ci].height, height);
			}
			height = Math.max(ctrl.rows[ctrl.rowKeys[1]].cells[ci].height, height);
		}
		var restWidth = (100 - widthPercent)/columnWithoutWidth + '%';
		for (var ci=0; ci<columns.length; ci++) {
			var column = columns[ci];
			var colWidth = column.style.width;
			if (!colWidth) {
				colWidth = restWidth;
			}
			column.width = this.convertToPixel(colWidth, width);
		}
		ctrl.width - 2*this.border.width
		var left = 0;
		var startRow = 0;
		if (ctrl.rowTemplate) {
			if (ctrl.showHeader) {
				var row = this.rows[headKey];
				for (var ci=0; ci<ctrl.columnCount; ci++) {
					var cell = row.cells[ci];
					cell.move(left, top);
					cell.width = cell.column.width;
					cell.render();
					left += cell.width;
				}
				top += headerHeight;
			}
			startRow = 1;
		}
		for (var ri=startRow; ri<startRow+ctrl.rowCount; ri++) {
			var row = ctrl.rows[ctrl.rowKeys[ri]];
			for (var ci=0; ci<ctrl.columnCount; ci++) {
				var cell = row.cells[ci];
				cell.move(left, top);
				cell.width = cell.column.width;
				cell.render();
				left += cell.width;
			}
			left = 0;
			top += height;
		}
	};

	function Grid(id, template, parent, context) {
		this.rowCount = 0;
		this.columnCount = 0;
		this.rowKeys = [];
		this.rows = {};
		this.columnKeys = [];
		this.columns = {};
		Grid.base.constructor.call(this, id, template, parent, context);
	};
	extend(glui.Container, Grid);

	Grid.prototype.getTemplate = function getTemplate() {
		var template = Grid.base.getTemplate.call(this);
		template.style.cell = null;
		template.style.title = null;
		template.style.header = null;
		template.title = this.id;
		template.rows = 0;
		template.cols = 0;
		template.header = false;
		template['row-template'] = null;
		template['cell-template'] = null;
		return template;
	};
	Grid.prototype.applyTemplate = function applyTemplate(tmpl) {
		var template = Grid.base.applyTemplate.call(this, tmpl);
		if (tmpl.style && !tmpl.style.height) {
			delete template.style.height;
			this.style.height = 0;
		}
		// build cell style:
		// - merge default style with grid's style, remove height and width
		var defaultStyle = glui.Control.getStyleTemplate();
		var cellStyle = mergeObjects(defaultStyle, template.style, true);
		cellStyle.height = defaultStyle.height;
		delete cellStyle.width;
		// - merge style with template.style.cell
		this.cellStyle = mergeObjects(cellStyle, template.style.cell);
		if (template['row-template']) {
			for (var i in template['row-template']) {
				template['row-template'][i].style = mergeObjects(this.cellStyle, template['row-template'][i].style);
			}
		}
		cellStyle.width = defaultStyle.width;
		if (!template['cell-template']) {
			template['cell-template'] = glui.Label.prototype.getTemplate();
		}
		template['cell-template'].style = mergeObjects(this.cellStyle, template['cell-template'].style);

		this.style.header = mergeObjects(this.cellStyle, template.style.header);
		this.style.title = mergeObjects(this.cellStyle, template.style.title);
		this.style.title.width = '100%';
		this.rowTemplate = template['row-template'];
		this.cellTemplate = template['cell-template'];
		this.title = template.title;

		this.showHeader = !!template.header;

        if (this.dataSource && this.dataField) {
            this.dataBind();
		} else {
			this.update();
		}

		return template;
	};
	Grid.prototype.dataBind = function(source, field) {
		source = source || this.dataSource;
        if (source) {
			this.dataField = field !== undefined ? field : this.dataField;
			this.dataSource = source;
		}
		this.update();
		return this.dataSource;
	};
    Grid.prototype.getHandlers = function getHandlers() {
        var handlers = Grid.base.getHandlers.call(this);
        handlers.push(
            { name: 'mousedown', topDown: true },
            { name: 'mouseup', topDown: false }
        );
        return handlers;
	};
    Grid.prototype.setVisible = function setVisible(visible) {
		Grid.base.setVisible.call(this, visible);
		visible = visible && this.showHeader;
		var head = this.rows[headKey];
		if (head){
        	for (var i=0; i<this.columnCount; i++) {
            	head.cells[i].setVisible(visible);
			}
		}
	};
	Grid.prototype.createRenderer = mode => mode == glui.Render2d ? new GridRenderer2d() : 'GridRenderer3d';
    // Grid.prototype.setRenderer = function(mode, context) {
	// 	Grid.base.setRenderer.call(this, mode, context);
    //     if (mode == glui.Render2d) {
    //         if (this.renderer2d == null) {
    //             this.renderer2d = new GridRenderer2d(this, context);
    //         }
    //         this.renderer = this.renderer2d;
    //     } else if (mode == glui.Render3d) {
    //         if (this.renderer3d == null) {
    //             this.renderer3d = new GridRenderer3d(this, context);
    //         }
    //         this.renderer = this.renderer3d;
	// 	}
		
	// };
	Grid.prototype.getBoundingBox = function getBoundingBox() {
		if (this.height == 0) {
			var rowCount = this.rowCount;
			if (this.titlebar) {
				this.height += this.titlebar.height;
			}
			if (this.showHeader) {
				this.renderer.setFont(this.style.header.font);
				this.height += this.renderer.convertToPixelV(this.style.header.height);
				//rowCount--;
			}
			if (rowCount > 0) {
				var h = 0;
				if (this.rowTemplate) {
					var style = this.rowTemplate[this.columnKeys[0]].style;
					h = this.renderer.convertToPixelV(style.height);
					// for (var ci=0; ci<this.columnKeys.length; ci++) {
					// 	var style = this.rowTemplate[this.columnKeys[ci]].style;
					// 	this.renderer.setFont(style.font);
					// 	h = Math.max(h, this.renderer.convertToPixelV(style.height));
					// }
				} else {
					h = this.renderer.convertToPixelV(this.cellTemplate.style.height);
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
		for (var ri=0; ri<this.rowCount; ri++) {
			var row = this.rows[this.rowKeys[ri]];
			for (var ci=0; ci<this.columnCount; ci++) {
				row.cells[this.columnKeys[ci]].move(0, 0);
			}
		}
	};
	Grid.prototype.build = function() {
		// titlebar
		if (this.title) {
			if (!this.titlebar) {
				this.titlebar = glui.Control.create(`${this.id}#title`,
				{
					'type': 'Label',
					'style': this.style.title,
					'z-index': this.zIndex + 1
				}, this);
			}
			this.titlebar.setValue(this.title);
			this.add(this.titlebar);
		} else {
			if (this.titlebar) {
				this.remove(this.titlebar);
				this.titlebar = null;
			}
		}
		var source = this.dataSource ? (this.dataField ? this.dataSource[this.dataField] : this.dataSource) : null;
		if (this.rowTemplate) {
			if (source) {
				this.rowKeys = Object.keys(source);
				this.rowCount = this.template.rows ? this.template.rows : this.rowKeys.length;
			} else {
				this.rowKeys = [];
				this.rowCount = this.template.rows ? this.template.rows : 5;	// default = 5
				for (var i=0; i<this.rowCount; i++) {
					this.rowKeys.push(i);
				}
			}
			this.columnKeys = Object.keys(this.rowTemplate);
			var rowTemplateCount = this.columnKeys.length;
			this.columnCount = parseInt(this.template.cols) ? this.template.cols : rowTemplateCount;
			for (var i=rowTemplateCount; i<this.columnCount; i++) {
				this.rowTemplate[i] = this.cellTemplate;
				this.columnKeys.push(i);
			}
		} else {
			this.columnCount = this.template.cols;
			this.rowCount = this.template.rows;
			if (source) {
				var count = Object.keys(source).length;
				if (!this.columnCount && !this.rowCount) {
					this.columnCount = 2;
					this.rowCount = Math.ceil(count/this.columnCount);
				} else if (!this.columnCount) {
					this.columnCount = Math.ceil(count/this.rowCount);
				} else if (!this.rowCount) {
					this.rowCount = Math.ceil(count/this.columnCount);
				}
				for (var i=0; i<this.columnCount; i++) {
					this.columnKeys.push(i);
				}
			} else {
				this.columnKeys = [];
				this.columnCount = this.template.cols ? this.template.cols : 2;	// default = 2
				this.rowCount = this.template.rows ? this.template.rows : 5;	// default = 5
				for (var i=0; i<this.columnCount; i++) {
					this.columnKeys.push(i);
				}
			}
			for (var i=0; i<this.rowCount; i++) {
				this.rowKeys.push(i);
			}
		}

		// create columns
		for (var ci=0; ci<this.columnCount; ci++) {
			var name = this.columnKeys[ci].toString();
			var column = new Grid.Column(name, this);
			column.style = this.rowTemplate ? this.rowTemplate[name].style : this.cellTemplate.style;
			this.columns[ci] = column;
			this.columns[name] = column;
		}
		// add header row
		var startRow = 0;
		if (this.rowTemplate) {
			var row = new Grid.Row(headKey, this);
			this.rows[headKey] = row;
			this.rowKeys.unshift(headKey);
			for (var ci=0; ci<this.columnCount; ci++) {
				var key = this.columnKeys[ci];
				var column = this.columns[key];
				var cell = glui.create(`0#${ci}`, { 'type': 'Label', 'style':this.style.header }, row);
				cell.setValue(Grid.resolveReference(this.rowTemplate[key].column, key));
				cell.setVisible(this.showHeader);
				cell.row = row;
				cell.column = column;
				column.cells.push(cell);
				row.cells[ci] = cell;
				row.cells[column.name] = cell;
				this.add(cell);
			}
			startRow = 1;
		}

		// add rows
		var cellId = 0;
		for (var ri=startRow; ri<startRow+this.rowCount; ri++) {
			var name = this.rowKeys[ri];
			var row = new Grid.Row(name, this);
			this.rows[name] = row;
			row.dataSource = this.rowTemplate && source && source[name] ? new DataLink(source[name]) : null;
			for (var ci=0; ci<this.columnCount; ci++) {
				var key = this.columnKeys[ci];
				var column = this.columns[key];
				var cell = glui.create(`${ri}#${ci}`, this.rowTemplate ? this.rowTemplate[key] : this.cellTemplate, row);
				cell.row = row;
				cell.column = column;
				if (this.rowTemplate) {
					if (row.dataSource) cell.dataBind(row.dataSource, key);
				} else {
					if (source && source[cellId] != undefined) cell.dataBind(source[cellId]);
				}				
				column.cells.push(cell);
				row.cells[ci] = cell;
				row.cells[column.name] = cell;
				this.add(cell);
				cellId++;
			}			
		}

		return;
	};
	Grid.prototype.update = function() {
		// remove every item
		for (var i=0; i<this.items.length; i++) {
			delete this.items[i];
		}
		this.items = [];
		this.rowKeys = [];
		this.columnKeys = [];
		this.rows = {};
		this.columns = {};

		this.build();
		// if (this.rowKeys.length == 0) {
		// 	this.build();
		// } else {
		// 	console.log(this.template.rows)
		// 	console.log(this.rowCount)
		// 	console.log(this.rowKeys.length)
		// }
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

	Grid.Column = function Column(name, parent) {
		this.id = `${parent.id}#${name}`;
		this.name = name;
		this.parent = parent;
		this.cells = [];
	};

	Grid.Row = function Row(name, parent) {
		this.id = `${parent.id}#${name}`;
		this.name = name;
		this.parent = parent;
		this.dataSource = null;
		this.cells = {};
		this.handlers = {};
		this.context = parent;
	};
	Grid.Row.prototype = {
		get width() { return this.parent.width; },
		get renderer() { return this.parent.renderer; }/*,
		get handlers() { return this.parent.handlers; }*/
	};

	public(Grid, 'Grid', glui);

})();

