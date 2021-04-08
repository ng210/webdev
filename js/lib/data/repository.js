include('/lib/data/b-tree.js');
include('/lib/utils/schema.js');
include('/lib/utils/syntax.js');
/****************************************************************************************
* Repository
 - stores entities
 - manages indices
 - stores and executes queries
****************************************************************************************/
(function() {
    function Index(name, type, attribute, isUnique) {
        this.name = name;
        this.type = type;
        this.attribute = attribute;
        this.isUnique = isUnique;
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

    function Query(name, expression) {
        this.name = name;
        // compile expression
        this.expression = Repository.syntax.parse(expression, true).resolve();
    }
    Query.prototype.commit = function commit(arguments) {
        var result = this.expression.evaluate(arguments);
        return result;
    };

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
            // process constraints
            for (var i=0; i<this.definition.Constraints.length; i++) {
                var con = this.definition.Constraints[i];
                switch (con.type) {
                    case 'key':
                        this.addKey(con);
                        break;
                    case 'link':
                        this.addLink(con);
                        break;
                    case 'index':
                        this.addIndex(con);
                        break;
                    default:
                        break;
                }
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
    Repository.prototype.addKey = function addKey(definition) {
        var entity = this.dataTypes[definition.entity];
        if (!entity || !entity.type.attributes[definition.field]) throw new Error(`Could not add key '${definition.field}' to entity '${definition.entity}'!`);
        entity.key = definition.field;
    };
    Repository.prototype.addLink = function addLink(definition) {
        var source = this.dataTypes[definition.entity];
        if (!source || !source.type.attributes[definition.field]) throw new Error(`Could not find source of link '${definition.entity}'.'${definition.field}'!`);
        var target = this.dataTypes[definition.linkedEntity];
        if (!target || !target.type.attributes[definition.linkedField]) throw new Error(`Could not find target of link '${definition.linkedEntity}'.'${definition.linkedField}'!`);
        source.links = source.links || {};
        source.links[definition.field] = { "entity":target, "field":definition.linkedField };
    };
    Repository.prototype.addIndex = function addIndex(definition) {
        var name = definition.name || 'index' + ('00' + this.indices.length).slice(-3);
        var entity = this.dataTypes[definition.entity];
        if (!entity || !entity.type.attributes[definition.field]) throw new Error(`Could not set index for entity '${definition.entity}' on attribute '${definition.field}'!`);
        var isUnique = definition.isUnique == true;
        if (entity.key == definition.field) isUnique = true;
        var index = new Index(name, entity.type, definition.field, isUnique);
        this.indices[index.name] = index;
        // assign index to data type
        var typeIndices = this.dataTypes[index.type.name].indices || {};
        typeIndices[index.attribute] = index;
    };
    Repository.prototype.addQuery = function addQuery(definition) {
        this.queries[definition.name] = new Query(definition.name, definition.expression);
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
        if (!Repository.grammar) {
            await load('./repo-grammar.js');
            Repository.syntax = new Syntax(Repository.grammar, false);
        }
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

    Repository.select = function select(entityNodes, whereNode) {
debugger
        var entities = Array.isArray(entityNodes) ? entityNodes.map(x => x.data.value) : [entityNodes.data.value];
        // iterate through entities and apply where criteria
        
        
    };
    Repository.operator = function operator(left, right) {
        if (right.data.value == '$') {
            right.data.value = this[right.edges[0].to.data.value];
        }
    };

    Repository.grammar = null;

    publish(Repository, 'Repository');
})();