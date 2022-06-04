include('/lib/data/dictionary.js');
include('/lib/data/b-tree.js');
include('/lib/type/schema.js');
// Data Table - in-memory data storage
//  - typed columns
//  - indices 
//  - queries

(function() {
    //#region DataColumn
    function DataColumn(name, type, defaultValue, isKey) {
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue;
        this.isKey = isKey || false;
    }
    //#endregion

    //#region DataIndex
    function DataIndex(name, column, isUnique) {
        this.name = name;
        this.type = column.type;
        //this.field = column.name;
        this.column = column;
        this.isUnique = isUnique;
        // TODO: calculate degree and page size from key cardinality
        var dg = 4, ps = 8;
        this.data = new BTree(dg, ps, {
            'context': this,
            'method': function(a, b) { return this.type.compare(a[this.column.name], b[this.column.name]); } 
        });
    }
    Object.defineProperties(DataIndex.prototype, {
        'count': {
            enumerable: true,
            configurable: false,
            get: function () { return this.data.count; }
        }
    });
    DataIndex.prototype.get = function get(obj) {
        return this.data.tryGet(obj) ? this.data.lastResult : null;
    };
    DataIndex.prototype.getAt = function getAt(ix) {
        return this.data.getAt(ix);
    };
    DataIndex.prototype.add = function add(obj) {
        var key = this.column.name;
        var item = this.get(obj);
        if (this.isUnique) {
            if (item) {
                throw new Error(`Attribute value is not unique: ${key}=${item[key]}`);
            }
            this.data.add(obj);
        } else {
            var block = null;
            if (item) {
                block = this.data.lastResult.node.data[this.data.lastResult.index];
            } else {
                block = { _data:[] };
                block[key] = obj[key];
                this.data.add(block);
            }
            block._data.push(obj);
        }
    };
    DataIndex.prototype.remove = function remove(obj) {
        if (this.isUnique) {
            this.data.remove(obj);
        } else {
            var block = this.get(obj);
            for (var i=0; i<block._data.length; i++) {
                var item = block_data[i];
                var isMatching = true;
                for (var j in item) {
                    if (item[j] != obj[j]) {
                        isMatching = false;
                        break;
                    }
                }
                if (isMatching) {
                    block._data.splice(i, 1);
                    break;
                }
            }
        }
    };
    //#endregion

    //#region DataTable
    function DataTable(nameOrDefinition, schema) {
        this.name = nameOrDefinition;
        this.columns = new Dictionary();
        this.keyColumn = null;
        this.data = [];
        this.count = 0;
        this.indices = new Dictionary();

        if (typeof nameOrDefinition === 'object') {
            schema = schema || DataTable.schema;
            var results = schema.validate(nameOrDefinition, 'DataTable');
            if (results.length > 0) {
                var err = new Error('Invalid DataTable definition!');
                err.details = results;
                throw err;
            }
            this.name = nameOrDefinition.name;
            for (var i=0; i<nameOrDefinition.columns.length; i++) {
                var colDef = nameOrDefinition.columns[i];
                var name = colDef.name || 'Col' + ('000' + this.columns.size).slice(-3);
                var type = schema.getOrBuildType(colDef.type);
                var defaultValue = colDef.default;
                var isKey = colDef.key == true;
                this.addColumn(name, type, defaultValue, isKey);
            }
            for (var i=0; i<nameOrDefinition.indices.length; i++) {
                var ixDef = nameOrDefinition.indices[i];
                var name = ixDef.name || 'Ix' + ('000' + this.indices.size).slice(-3);
                var columnName = ixDef.column;
                var isUnique = ixDef.unique;
                this.addIndex(name, columnName, isUnique);
            }
        }
    }

    DataTable.prototype.addColumn = function addColumn(name, type, defaultValue, isKey) {
        defaultValue = defaultValue || null;
        var column = name instanceof DataColumn ? name : new DataColumn(name, type, defaultValue, isKey);
        if (!this.columns.has(column.name)) {
            this.columns.add(column.name, column);
        } else {
            throw new Error(`Column '${column.name}' already exists!`);
        }
        if (isKey) {
            if (this.keyColumn != null) throw new Error(`A key column (${this.keyColumn.name}) already exists!`);
            this.keyColumn = column;
            this.addIndex('key_' + name, name, true);
        }
        // initialize column
        if (defaultValue == null) value = column.type.createDefaultValue().valueOf();
        for (var i=0; i<this.data.length; i++) {
            this.data[i][column.name] = value;
        }
    };

    DataTable.prototype.add = function add(data) {
        var item = {};
        for (var i=0; i<this.columns.size; i++) {
            var column = this.columns.getAt(i);
            var index = this.indices.get(column.name);
            var value = Array.isArray(data) ? data[i] : data[column.name];
            if (value != undefined) {
                var results = [];
                if (!column.type.validate(value, results)) {
                    throw new Error(`Value for column '${column.name}' not valid (${results.join(';')}`);
                }
            } else {
                value = column.type.createDefaultValue();
            }
            item[column.name] = value;
            if (index) index.add(item);
        }
        this.data.push(item);
        this.count++;
    };

    DataTable.prototype.indexOf = function indexOf(obj) {
        var ix = -1;
        if (this.indices.size > 0) {
            var index = this.keyColumn ?
                this.indices.get(this.keyColumn.name) :
                // todo: pick the ideal index?
                this.indices.getAt(0);
            ix = index.data.indexOf(obj);
        } else {
            // linear search
            for (var i=0; i<this.data.length; i++) {
                var item = this.data[i];
                var isMatching = false;
                this.columns.iterate(function(k, col) {
                    var result = true;
                    if (col.type.compare(item[col.name], obj[col.name]) == 0) {
                        isMatching = true;
                        result = false;
                    }
                    return result;
                });
                if (isMatching) {
                    ix = i;
                    break;
                }
            }
        }
        return ix;
    };

    DataTable.prototype.removeAt = function removeAt(ix) {
        var item = null;
        if (ix > 0 && ix < this.data.length) {
            // remove data
            item = this.data[ix];
            this.data[ix] = null;
            this.count--;
            // remove from indices
            this.indices.iterate( (k, index) => index.remove(item) );
        }
        return item;
    };

    DataTable.prototype.remove = function remove(obj) {
        var ix = this.indexOf(obj);
        return this.removeAt(ix);
    };

    DataTable.prototype.addIndex = function addIndex(name, columnName, isUnique) {
        if (typeof name === 'object') {
            var definition = name;
            name = definition.name || 'index' + ('00' + this.indices.size).slice(-3);
            columnName = definition['column'];
            isUnique = definition.unique;
        }
       
        if (this.indices.has(name)) throw new Error(`Index '${name}' already defined!`);
        if (!this.columns.has(columnName)) throw new Error(`Column '${columnName}' not defined!`);
        var column = this.columns.get(columnName);
        if (column.isKey) isUnique = true;
        
        var index = new DataIndex(name, column, isUnique);
        this.indices.put(columnName, index);
    };

    DataTable.useSchema = async function useSchema(schema) {
        if (!schema) {
            schema = await Schema.build(DataTable.schemaDefinition);
        }
        DataTable.schema = schema;

        return schema;
    };

    DataTable.schema = null;

    DataTable.schemaDefinition = {
        "use-default-types": true,
        "definition": [
            {   "name":"DataColumn",
                "ref":"name",
                "attributes": {
                    "name": { "type":"string", "isRequired":true },
                    "type": { "type":"type", "isRequired":true },
                    "key": { "type":"bool", "isRequired":false },
                    "default": { "type": "string", "isRequired":false }
                }
            },
            {   "name":"DataIndex",
                "attributes": {
                    "name": { "type":"string", "isRequired":true },
                    "column": { "type":"ref DataColumn", "isRequired":true },
                    "unique": { "type":"bool", "isRequired":false }
                }
            },
            {   "name":"DataTable",
                "attributes": {
                    "name": { "type":"string", "isRequired":true },
                    "columns": { "type":{"name":"ColumnList", "type":"list", "elemType":"DataColumn" }, "isRequired":true },
                    "indices": { "type":{"name":"IndexList", "type":"list", "elemType":"DataIndex" }, "isRequired":true }
                }
            }
        ]
    };

    //#endregion

    publish(DataIndex, 'DataIndex');
    publish(DataColumn, 'DataColumn');
    publish(DataTable, 'DataTable');
})();