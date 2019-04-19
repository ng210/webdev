include('/ui/control.js');
// strict structure of controls based on rows and columns
// templates for rows or for cells
try {
(function() {
	Ui.Grid = function(id, template, parent) {
		Ui.Control.call(this, id, template, parent);
		// set rows/columns array
		this.rowKeys = null;
		this.rows = null;
		this.rowCount = parseInt(template['rows']) || 0;
		this.columnKeys = null;
		this.columns = null;
		this.columnCount = parseInt(template['cols']) || 0;
		// set templates
		this.rowTemplate = template['row-template'] || null;
		this.cellTemplate = template['cell-template'] || null;

		this.constructor = Ui.Grid;
	};
	Ui.Grid.base = Ui.Control.prototype;
	Ui.Grid.prototype = new Ui.Control('grid');
	Ui.Control.Types['grid'] = { ctor: Ui.Grid, tag: 'DIV' };

	Ui.Grid.prototype.buildRow = function(row, src, rowTmpl) {
		// build a row from the given data source
		// using the selected template
		var ri = row.id;
		for (var ci=0; ci<this.columnKeys.length; ci++) {
			var key = this.columnKeys[ci];
			var column = this.columns[key];
			var tmpl = rowTmpl[key];
			var dataField = tmpl['data-field'] || key;
			var cell = Ui.Control.create(this.id + '#' + ri + '#' + ci, tmpl, row);
			if (tmpl.label === true) {
				cell.label = row.name + '.' + key;
			}
			src = cell.dataBind(src, dataField);
			cell.row = row; cell.column = column;
			row.cells[ci] = row.cells[key] = cell;
			column.cells.push(cell);
		}
		return row;
	};
	Ui.Grid.prototype.updateColumnCountFromDataSource = function(src) {
		// The count of columns/cells is defined by columnCount (or maximum count of items in the data source)
		for (var i in src) {
			var rowItem = src[i];
			if (!Array.isArray(rowItem) && typeof rowItem !== 'object') {
				throw new Error('Invalid item at row ' +  i + '! It has to be an enumerable.');
			}
			var count = Object.keys(rowItem);
			if (count > this.columnCount) {
				this.columnCount = count;
			}
		}
	};
	Ui.Grid.prototype.build = function() {
		var src = this.dataSource[this.dataField];
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
				this.columns[ci] = {id:ci, name:ci, cells:[], parent:this};
			}
		} else {
			// create columns
			// keys of columns are defined by the first row in the data source
			this.columnKeys = Object.keys(rowTemplate);
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				var key = this.columnKeys[ci]
				this.columns[key] = this.columns[ci] = {id:ci, name:key, cells:[], parent:this};
			}
		}
		// create rows and cells
		for (var ri=0; ri<this.rowKeys.length; ri++) {
			var rowKey = this.rowKeys[ri];
			var srcRow = src[rowKey];
			var row = { id: ri, name: rowKey, cells:{}, parent: this };
			this.buildRow(row, srcRow, rowTemplate);
			this.rows[rowKey] = row;
		}
		Ui.Control.registerHandler.call(this);
	};
	Ui.Grid.prototype.dataBind = function(obj, field) {
		var dataLink = Ui.Grid.base.dataBind.call(this, obj, field);
		this.build();
		return dataLink;
	};
	Ui.Grid.prototype.getCell = function(ri, ci) {
		if (typeof ri === 'string') {
			var tokens = ri.split('#');
			ri = tokens[0];
			ci = tokens[1];
		}
		var row = this.rows[ri];
		return row ? row.cells[ci] : null;
	};
	Ui.Grid.prototype.render = function(ctx) {
		Ui.Grid.base.render.call(this, ctx);
		var table = document.createElement('TABLE');
		table.className = 'grid table';
		this.element.appendChild(table);
		for (var ri=0; ri<this.rowKeys.length; ri++) {
			var row = this.rows[this.rowKeys[ri]];
			var tr = document.createElement('TR');
			var rowClass = ri % 2 ? 'r0' : 'r1';
			tr.className = 'grid row ' + rowClass;
			for (var ci=0; ci<this.columnKeys.length; ci++) {
				var key = this.columnKeys[ci];
				var td = document.createElement('TD');
				var cellClass = rowClass + ' ' + (ci % 2 ? 'c0' : 'c1');
				td.className = 'grid cell ' + cellClass;
				var cell = row.cells[ci];
				var tmplLabel = cell.template.label;
				// tmplLabel=true => cell.label = calculated value
				// tmplLabel=string => cell.label = tmplLabel
				// tmplLabel="$key" => cell.label = key

				if (typeof tmplLabel === 'string') {
					if (tmplLabel == '$key') {
						cell.label = key;
					} else if (tmplLabel === '$Key') {
						cell.label = key.charAt(0).toUpperCase() + key.substring(1);
					} else {
						cell.label = tmplLabel;
					}
				} else if (tmplLabel === false) {
					label = '';
				}/* else if (tmplLabel === true) {
					label = cell.label;
				}*/

				cell.render({node: td});
				td.appendChild(cell.element);
				tr.appendChild(td);
			}
			table.appendChild(tr);
		}
	};
})();
} catch (err) {
	Dbg.prln(err);
}
