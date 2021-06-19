include('repo-ns.js');
include('/lib/utils/schema.js');
(function() {
    function IDataStore(schema) {
        this.dataTypes = {};
        this.schema = schema;
    }
    IDataStore.prototype.addType = function addType(definition) {
        
    };
    IDataStore.prototype.addSchema = function addSchema(definition) {
        
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

    };
    IDataStore.prototype.create = function create(type, data) {
        throw new Error('Not implemented!');
    };
    IDataStore.prototype.read = function read(type, data) {
        throw new Error('Not implemented!');
    };
    IDataStore.prototype.update = function update(type, data) {
        throw new Error('Not implemented!');
    };
    IDataStore.prototype.delete = function delete_(type, data) {
        throw new Error('Not implemented!');
    };

    publish(IDataStore, 'IDataStore', Repository);
})();

