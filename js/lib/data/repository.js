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
    Index.prototype.getAt = function getAt(ix) {
        return this.data.getAt(ix);
    };

    function Expression(syntax) {
        Expression.base.constructor.call(this, syntax);
    }
    extend(Syntax.Expression, Expression);
    Expression.prototype.mergeNodes = function(nodes) {
        // terms should be treated as literals
        var bix = nodes.findIndex(x => Repository.syntax.symbols[x.data.code] == Repository.grammar.term.symbol);
        if (bix != -1) {
            var aix = 1 - bix;
            this.tree.addEdge(nodes[aix], nodes[bix]);
            result = nodes[aix];
        } else {
            result = Expression.base.mergeNodes.call(this, nodes);
        }
        return result;
    };

    function Query(name, expression) {
        this.name = name;
        this.queue = [];
        this.entities = [];
        this.fields = [];
        this.terms = [];
        this.where = null;

        // compile expression
        this.expression = Repository.syntax.parse(expression, true).resolve(this);

        var select = this.expression.lastNode;
        // select must have at least 2 children:
        // - 1 or more entity nodes
        // - 1 where expression node
        if (select.data.type != Repository.grammar.prototypes.select) {
            throw new Error('Invalid query expression!');
        }
        for (var i=0; i<select.edges.length; i++) {
            var node = select.edges[i].to;
            if (node.data.code == Repository.syntax.literalCode) {
                this.entities.push(node.data.value);
            } else {
                this.where = node;
            }
        }

        if (this.entities.length < 1 || this.where == null) {
            throw new Error('Invalid query expression!');
        }
    }
    Query.prototype.getArgument = function getArgument(term, entity) {
        var value = term;
        if (Array.isArray(term)) {
            value = entity[term];
        }
        return value;
    }

    function Repository(schemaInfo) {
        this.dataTypes = {};
        this.indices = [];
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
        this.indices.push(index);
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
    Repository.prototype.query = function query(queryName, parameters) {
        var results = [];
        var query = this.queries[queryName];
        if (!query) throw new Error(`Query '${queryName}' not defined!`);
        // use parameters
        query.expression.evaluate({query:query,parameters:parameters});
        // check entities and fields for indices
        var entity = this.dataTypes[query.entities[0]];
        // for (var i=0; i<query.terms.length; i++) {
        //     var attribute = query.terms[i].edges[0].to.data.value;
        //     if (entity.indices[attribute]) {
        //         debugger
        //     }
        // }

        var stack = [];
        for (var i=0; i<this.data[query.entities[0]].length; i++) {
            var entity = this.data[query.entities[0]][i];
            for (var j=0; j<query.queue.length;) {
                // get function
                var item = query.queue[j++];
                if (item[0].length == 2) {
                var right = (item[2] == null) ? stack.pop() : query.getArgument(item[2], entity);
                var left = (item[1] == null) ? stack.pop() : query.getArgument(item[1], entity);
                    stack.push(item[0](left, right));
                } else {
                    throw new Error('Only binary operators are supported!');
                }
            }
            if (stack.pop()) {
                results.push(entity);
            }
        }
        return results;
    };

    Repository.schemaDefinition = '/lib/data/repo-schema.json';

    Repository.create = async function create(definition) {
        var errors = [];
        if (!Repository.grammar) {
            await load('./repo-grammar.js');
            Repository.syntax = new Syntax(Repository.grammar, false);
            Repository.syntax.createExpression = function createExpression() {
                return new Expression(this);
            };
            Repository.syntax.termCode = Repository.syntax.symbols.findIndex(x => x == Repository.grammar.term.symbol);
            Repository.syntax.parameter = Repository.syntax.symbols.findIndex(x => x == Repository.grammar.parameter.symbol);
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
    Repository.operator = function operator(left, right, node) {
        var lc = left.data.code;
        var rc = right.data.code;
        var data = [node.data.type.operator, null, null];
        var isValid = false;
        if (lc == Repository.syntax.termCode) {
            // op1(op2,op3)
            if (rc == Repository.syntax.termCode) {
                isValid = true;
            }
        } else if (lc == Repository.syntax.literalCode) {
            isValid = true;
            data[1] = [left.data.value];
            this.query.terms.push(node);
            if (rc == Repository.syntax.termCode) {
                // op1(field,op2)
            } else if (rc == Repository.syntax.literalCode) {
                // op1(field,constant)
                var ch = right.data.term.charAt(0);
                if ((ch == '"' || ch == '\'') && right.data.term.endsWith(ch)) {
                    data[2] = right.data.term.slice(1, -1);
                } else {
                    // op1(field,reference)
                    data[2] = [right.data.value];
                    this.query.fields.push(right.data.value);
                }
            } else if (rc == Repository.syntax.parameter) {
                // op1(field, parameter)
                data[2] = this.parameters[right.edges[0].to.data.value];
            } else {
                isValid = false;
            }
        }
        if (!isValid) throw new Error('Syntax error!');
        this.query.queue.push(data);
        return node.data.value;
    };
    Repository.term = function term(op, right) {
    };

    Repository.grammar = null;

    publish(Repository, 'Repository');
})();