include('idata-store.js');
include('ientity-mgr.js');
include('/lib/type/schema.js');
include('/lib/utils/syntax.js');

(function() {

    function Repo(schemaInfo) {
        this.schema = schemaInfo.schema;
        if (schemaInfo.definition) {
            this.addSchema(schemaInfo.definition)
        }
        this.dataStore = new Repository.DataStore(this);
        this.entityMgr = new Repository.EntityMgr(this);
    }
    Repo.prototype.addType = function addType(definition) {
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
    Repo.prototype.addKey = function addKey(definition) {
        var entity = this.dataTypes[definition.entity];
        if (!entity || !entity.type.attributes[definition.field]) throw new Error(`Could not add key '${definition.field}' to entity '${definition.entity}'!`);
        entity.key = {field: definition.field, counter: 1};
        // also add as unique index
        this.addIndex({ "type":"index", "name":definition.field, "entity":definition.entity, "field":definition.field, "isUnique":true });
    };
    Repo.prototype.addLink = function addLink(definition) {
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
    Repo.prototype.addIndex = function addIndex(definition) {
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
    Repo.prototype.addQuery = function addQuery(definition) {
        this.queries[definition.name] = new Query(definition.name, definition.expression);
    };

    Repo.prototype.addSchema = function addSchema(definition) {
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
    };
    Repository.create = async function(definition) {
        var errors = [];
        if (!Repository.grammar) {
            await load('./repo-grammar.js');
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
        return new Repo(schemaInfo);
    };
})();