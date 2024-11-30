include('/lib/data/b-tree.js');
include('/lib/utils/schema.js');
include('/lib/utils/syntax.js');
/****************************************************************************************
* Repository
 - data storage
 - entity manager

 Data storage
 - stores entities in data sets
 - manages indices
 - stores and executes queries

 Entity manager
 - create/read/update/delete entities
 - lazy/instant loading
 - mapping between references and entity keys
 - store/load entities from data storage
****************************************************************************************/
(function() {

    //#region REPOSITORY
    const DEFAULT_DATA_SIZE = 256;

    function Index(name, type, attribute, indexedType, isUnique) {
        this.name = name;
        this.type = type;
        this.attribute = attribute;
        this.isUnique = isUnique;
        this.data = null;
        var method = null;
        switch (indexedType.basicType.name) {
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
    Object.defineProperties(Index.prototype, {
        'count': {
            enumerable: true,
            configurable: false,
            get: function () { return this.data.count; }
        }
    });
    Index.prototype.getAt = function getAt(ix) {
        return this.data.getAt(ix);
    };

    function Expression(syntax) {
        Expression.base.constructor.call(this, syntax);
    }
    extend(Syntax.Expression, Expression);
    Expression.prototype.mergeNodes = function(nodes) {
        // terms should be treated as literals
        var result = null;
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
        var parsed = Repository.syntax.parse(expression, true);
        this.expression = parsed.resolve(this);

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
        this.schema = schemaInfo.schema;
        if (schemaInfo.definition) {
            this.addSchema(schemaInfo.definition)
        }
    }
    Repository.prototype.addType = function addType(definition) {
        // create data type
        var name = definition.name;
        var type = this.schema.types[name];
        var typeDef = this.dataTypes[type.name] = {
            type: type,
            indices: [],
            ctor: null
        };

        if (type instanceof Schema.ComplexType) {
            this.data[type.name] = [];  //new Array(DEFAULT_DATA_SIZE);
            this[type.name] = {
                create: data => this.createEntity(this.dataTypes[type.name], data),
                read: data => this.readEntity(this.dataTypes[type.name], data),
                update: data => this.updateEntity(this.dataTypes[type.name], data),
                delete: data => this.deleteEntity(this.dataTypes[type.name], data)
            };
            if (typeof self[type.name] === 'function') {
                typeDef.ctor = self[type.name];
            }
        }
    };
    Repository.prototype.addKey = function addKey(definition) {
        var entity = this.dataTypes[definition.entity];
        if (!entity || !entity.type.attributes[definition.field]) throw new Error(`Could not add key '${definition.field}' to entity '${definition.entity}'!`);
        entity.key = {field: definition.field, counter: 1};
        // also add as unique index
        this.addIndex({ "type":"index", "name":definition.field, "entity":definition.entity, "field":definition.field, "isUnique":true });
    };
    Repository.prototype.addLink = function addLink(definition) {
        var source = this.dataTypes[definition.entity];
        var field = definition.field;
        if (!source) throw new Error(`Could not find source entity '${definition.entity}'!`);
        if (definition.query) {
            if (!this.queries[definition.query]) throw new Error(`Could not find query '${definition.query}'!`);
            // check parameters
            for (var pi in definition.parameters) {
                var pk = definition.parameters[pi];
                if (!source.type.attributes[pk]) throw new Error(`Invalid query parameter '${pi}:${pk}' for entity '${definition.entity}'!`);
            }
            source.links = source.links || {};
            source.links[field] = { query:definition.query, parameters:definition.parameters };
        // } else {
        //     if (!source.type.attributes[field]) throw new Error(`Could not find source of link '${definition.entity}'.'${field}'!`);
        //     var target = this.dataTypes[definition.linkedEntity];
        //     if (!target || !target.type.attributes[definition.linkedField]) throw new Error(`Could not find target of link '${definition.linkedEntity}'.'${definition.linkedField}'!`);
        //     source.links = source.links || {};
        //     source.links[field] = { "entity":target, "field":definition.linkedField };
        }
    };
    Repository.prototype.addIndex = function addIndex(definition) {
        var name = definition.name || 'index' + ('00' + this.indices.length).slice(-3);
        var entity = this.dataTypes[definition.entity];
        if (!entity || !entity.type.attributes[definition.field]) throw new Error(`Could not set index for entity '${definition.entity}' on attribute '${definition.field}'!`);
        var isUnique = definition.isUnique == true;
        if (entity.key.field == definition.field) isUnique = true;
        var type = entity.type.attributes[definition.field].type;
        if (type.isReference) {
            var indexedEntity = this.dataTypes[type.baseType.name];
            var keyField = indexedEntity.key.field;
            type = indexedEntity.type.attributes[keyField].type;
        }
        var index = new Index(name, entity.type, definition.field, type, isUnique);
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
        var type = !typeName ? obj.__type__ : this.schema.types[typeName];
        if (!type) throw new Error('Unknown type ' + typeName);

        // insert object
        var dataType = this.dataTypes[type.name];
        this.data[type.name].push(obj);

        // update indices
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

        return obj;
    };
    Repository.prototype.addSchema = function addSchema(definition) {
        if (definition.DataTypes) {
            // get data types
            for (var i=0; i<definition.DataTypes.length; i++) {
                var type = definition.DataTypes[i];
                if (!this.schema.types[type.name]) {
                    this.schema.buildType(type);
                }
                this.addType(definition.DataTypes[i]);
            }
        }
        // build queries
        if (definition.Queries) {
            for (var i=0; i<definition.Queries.length; i++) {
                this.addQuery(definition.Queries[i]);
            }
        }
        // process constraints
        if (definition.Constraints) {
            for (var i=0; i<definition.Constraints.length; i++) {
                var con = definition.Constraints[i];
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
        }
    }
    Repository.prototype.remove = function remove(typeName, attribute, value) {
        var item = this.get(typeName, attribute, value);
        if (item) {
            // remove index entries
            var type = this.dataTypes[typeName];
            for (var ii in type.indices) {
                if (type.indices.hasOwnProperty(ii)) {
                    type.indices[ii].data.remove(item);
                }
            }
            // remove item from data
            var data = this.data[typeName];
            for (var i=0; i<data.length; i++) {
                if (data[i][attribute] == value) {
                    item = data.splice(i, 1)[0];
                }
            }
        }
        return item;
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
                            break;
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
    // Repository.prototype.setLink = function setLink(entity, field, typeName) {
    //     var result = false;
    //     typeName = typeName || entity.constructor.name;
    //     var type = this.dataTypes[typeName];
    //     if (type) {
    //         var link = type.links[field];
    //         var value = entity[field];
    //         if (value && link) {
    //             var target = this.get(link.entity.type.name, link.field, value);
    //             if (target) {
    //                 entity[field] = target;
    //                 result = true;
    //             }
    //         }
    //     }
    //     return result;
    // };
    // Repository.prototype.updateLinks = function updateLinks(entity, typeName) {
    //     var results = [];
    //     typeName = typeName || entity.constructor.name;
    //     var type = this.dataTypes[typeName];
    //     if (type) {
    //         for (var lk in type.links) {
    //             var link = type.links[lk];
    //             var value = entity[lk];
    //             var target = null;
    //             if (value && link) {
    //                 target = this.get(link.entity.type.name, link.field, value);
    //                 if (target) {
    //                     entity[lk] = target;
    //                 } else {
    //                     results.push(new Error(`Link '${lk}: ${link.entity.type.name}.${link.field}' not valid!`));
    //                 }
    //             }
    //         }
    //     } else {
    //         results.push(new Error(`Type '${typeName}' not found!`));
    //     }
    //     return results;
    // };

    Repository.schemaDefinition = '/lib/data/repo-schema.json';

    Repository.create = async function create(definition) {
        var errors = [];
        if (!Repository.grammar) {
            await load('/lib/data/repo-grammar.js');
            Repository.syntax = new Syntax(Repository.grammar, 0);
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
                data[2] = this.parameters[right.data.value];
            } else {
                isValid = false;
            }
        }
        if (!isValid) throw new Error('Syntax error!');
        this.query.queue.push(data);
        return node.data.value;
    };
    Repository.term = function term(op, right) {
        //throw new Error('Not implemented!');
    };
    
    Repository.grammar = null;
    //#endregion

    //#region ENTITY
    function checkKey(entityType) {
        if (entityType.key == undefined || entityType.key.field == undefined) throw new Error(`Entity '${entityType.type.name}' requires to have a key attribute for entity action!`);
    }
//     Repository.prototype.TryReadOrCreateEntity = function TryReadOrCreateEntity(entityType, obj, errors) {
//         var result = null;
//         errors = errors || [];
//         // try to read entity by key
// debugger
//         checkKey(entityType, obj);
//         result = this.get(entityType.type.name, key, obj[key]);
//         if (!result) {
//             // try to create entity
//             // check unique attributes
//             var ixKey = null;
//             for (ixKey in entityType.indices) {
//                 var ix = entityType.indices[ixKey];
//                 var attr = ix.attribute;
//                 if (ix.isUnique && this.get(entityType.type.name, attr, obj[attr])) {
//                     errors.push(new Error(`Entity violates unique index '${ixKey}'`));
                    
//                 }
//             }
//             if (errors.length == 0) {
//                 // create blank entity
//                 result.entity = entityType.ctor ? Reflect.construct(entityType.ctor, []) : entityType.type.create();
//             }
//         }

//         // read/create attributes
//         for (var i in entityType.type.attributes) {
//             var attr = entityType.type.attributes[i];
//             var basicType = attr.type.basicType;
//             var data = obj[i];
//             // create blank attribute
//             result[i] = attr.type.create();
//             if (attr.type.isReference) {
//                 // data is an entity
//                 var entity = this.dataTypes[attr.type.baseType.name];
//                 var key = entity.key.field;
//                 var elem = this.readOrCreateEntity(entity, data, data[key] == undefined);
//                 result[i] = elem[key];
//             } else if (basicType == this.schema.types.list && attr.type.elemType.isReference) {
//                 // ref is a list of entities
//                 var entity = this.dataTypes[attr.type.elemType.baseType.name];
//                 var key = entity.key.field;
//                 for (var j=0; j<ref.length; j++) {
//                     var elem = !ref[j][key] ? this.createEntity(entity, ref[j]) : this.get(entity.type.name, key, ref[j][key]);
//                     result[i][j] = elem[key];
//                 }
//             } else if (basicType == this.schema.types.map && attr.type.valueType.isReference) {
//                 // ref is a map of entities
//                 var entity = this.dataTypes[attr.type.valueType.baseType.name];
//             } else {
//                 result[i] = ref;
//             }
//         }

//         return result;
//     };
    Repository.prototype.createEntity = function createEntity(entityType, obj) {
        var result = null;
        checkKey(entityType, obj);
        result = this.get(entityType.type.name, entityType.key.field, key);
        
        return result;
    };
    Repository.prototype.readEntity = function readEntity(entityType, key) {
        var result = null;
        checkKey(entityType);
        result = this.get(entityType.type.name, entityType.key.field, key);
        if (result != null) {
            // read links
            for (var li in entityType.links) {
                var link = entityType.links[li];
                if (link.query) {
                    var parameters = {};
                    for (var pi in link.parameters) {
                        parameters[pi] = result[link.parameters[pi]];
                    }
                    var hits = this.query(link.query, parameters);
                    var linkedEntity = this.dataTypes[this.queries[link.query].entities[0]];
debugger
                    result[li] = [];
                    var key = linkedEntity.key.field;
                    for (var i=0; i<hits.length; i++) {
                        result[li].push(this.readEntity(linkedEntity, hits[i][key]));
                    }
                } else if (link.entity && link.linkedField) {
                    var entity = this.get(link.entity, )
                    result[li] = entity[link.field];
                }
            }
            // read dependencies
            for (var ai in entityType.type.attributes) {
                var attr = entityType.type.attributes[ai];
                var basicType = attr.type.basicType;
                if (attr.type.isReference) {
                    var type = this.dataTypes[attr.type.baseType.name];
                    result[ai] = this.readEntity(type, result[ai]);
                } else if (basicType == this.schema.types.list && attr.type.elemType.isReference) {
                    var type = this.dataTypes[attr.type.elemType.name]
                    for (var j=0; j<result[ai].length; j++) {
                        result[ai][j] = this.readEntity(type, result[ai][j]);
                    }
                } else if (basicType == this.schema.types.map && attr.type.valueType.isReference) {
                    var type = this.dataTypes[attr.type.valueType.name]
                    for (var j in result[ai]) {
                        result[ai][j] = this.readEntity(type, result[ai][j]);
                    }
                }
            }
        }
        return result;
    };
    Repository.prototype.updateEntity = function updateEntity(type, data) {

    };
    Repository.prototype.deleteEntity = function deleteEntity(data) {

    };
    //#endregion

    publish(Repository, 'Repository');
})();