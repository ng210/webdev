include('/lib/data/b-tree.js');
include('/lib/utils/schema.js');
/****************************************************************************************
* Repository
 - stores entities
 - manages indices
 - stores and executes queries
****************************************************************************************/
(function() {
    function Index(definition) {
        this.name = definition.name;
        this.type = definition.type;
        this.attribute = definition.attribute;
        this.isUnique = definition.unique == true;
        this.data = null;
        this.count = 0;

        var type = this.type.attributes[this.attribute].type.basicType;
        var method = null;
        switch (type.name) {
            case 'int':
                method = function(a,b) {
                    return a[this.attribute] - b[this.attribute];
                };
            break;
            case 'string':
                method = function(a,b) {
                    return a[this.attribute].localeCompare(b[this.attribute]);
                };
                break;
        }
        // TODO: calculate degree and page size from key cardinality
        var dg = 4, ps = 16;
        this.data = new BTree(dg, ps, { 'context':this, 'method':method });
    }

    function Repository(schemaInfo) {
        this.dataTypes = {};
        this.indices = {};
        this.queries = {};
        this.data = {};
        this.definition = schemaInfo.definition;
        this.schema = schemaInfo.schema;
        if (this.definition) {
            // get data types
            for (var i=0; i<this.definition.DataTypes.length; i++) {
                this.addType(this.definition.DataTypes[i]);
            }
            // build indices
            for (var i=0; i<this.definition.Indices.length; i++) {
                this.addIndex(this.definition.Indices[i]);
            }
            // build queries
            for (var i=0; i<this.definition.Queries.length; i++) {
                this.addQuery(this.definition.Queries[i]);
            }
        }
    }
    Repository.prototype.addType = function addType(definition) {
        // create data type
        var name = definition.name;
        var type = this.schema.types[name];
        this.dataTypes[type.name] = {
            type: type,
            indices: []
        };
        this.data[type.name] = [];
    };
    Repository.prototype.addIndex = function addIndex(definition) {
        definition.name = definition.name || 'index' + ('00' + this.indices.length).slice(-3);
        definition.type = this.schema.types[definition.type];
        var index = new Index(definition);
        this.indices[index.name] = index;
        // assign index to data type
        var typeIndices = this.dataTypes[index.type.name].indices || {};
        typeIndices[index.attribute] = index;
    };
    Repository.prototype.addQuery = function addQuery(definition) {
        var errors = [];
        this.queries[definition.name] = {
            name: definition.name,
            arguments: null,
            expression: null,
            access: []
        };
        // compile expression
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }
    };

    Repository.prototype.add = function add(obj, typeName) {
        if (!typeName) {
            typeName = obj.constructor != Object ? obj.constructor.name : null;
        }
        type = !typeName ? obj.__type__ : this.schema.types[typeName];
        if (!type) throw new Error('Unknown type ' + typeName);

        // insert object
        this.data[type.name].push(obj);

        // update indices
        var dataType = this.dataTypes[type.name];
        for (var i in dataType.indices) {
            if (dataType.indices.hasOwnProperty(i)) {
                var index = dataType.indices[i];
                var attribute = index.attribute;
                var found = index.data.tryGet(obj);
                if (index.isUnique) {
                    if (found) {
                        throw new Error(`Attribute value is not unique: ${attribute}=${obj[attribute]}`);
                    }
                    index.data.add(obj);
                } else {
                    var block = null;
                    if (found) {
                        block = index.data.lastResult.node.data[index.data.lastResult.index];
                    } else {
                        block = {_data:[]};
                        block[attribute] = obj[attribute];
                        index.data.add(block);
                    }
                    block._data.push(obj);
                }
                
            }
        }
    };
    Repository.prototype.remove = function remove() {

    };

    Repository.prototype.get = function get(typeName, attribute, value) {
        var res = null;
        var type = this.dataTypes[typeName];
        if (type) {
            var data = this.data[typeName];
            if (data) {
                var index = type.indices[attribute];
                if (index) {
                    var item = {};
                    item[attribute] = value;
                    var result = {};
                    if (index.data.tryGet(item, result)) {
                        res = result.node.data[result.index];
                        if (!index.isUnique) res = res._data;
                    }
                } else {
                    for (var i=0; i<data.length; i++) {
                        if (data[i][attribute] == value) {
                            res = data[i];
                        }
                    }
                }
            }
        }
        return res;
    };

    Repository.schemaDefinition = '/lib/data/repo-schema.json';

    Repository.create = async function create(definition) {
        var errors = [];
        var schemaInfo = {
            schemaDefinition: Repository.schemaDefinition,
            schema: null,
            validate: 'Repository'
        };
        schemaInfo.definition = await Schema.load(schemaInfo, definition, errors);
        if (errors.length > 0) throw new Error(errors.join('\n'));
        for (var i=0; i<schemaInfo.definition.DataTypes.length; i++) {
            schemaInfo.schema.buildType(schemaInfo.definition.DataTypes[i]);
        }
        return new Repository(schemaInfo);
    };

    publish(Repository, 'Repository');
})();