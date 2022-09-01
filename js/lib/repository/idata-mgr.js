include('repo-ns.js');
include('data-table.js');
include('/lib/type/schema.js');
(function() {
    function IDataMgr() {
        this.dataTypes = {};
        this.schema = null;
    }
    // IDataStore.prototype.addType = function addType(definition) {
        
    // };
    IDataMgr.prototype.addSchema = function addSchema(definition) {
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
    IDataMgr.prototype.create = function create(type, data) {
        throw new Error('Not implemented!');
    };
    IDataMgr.prototype.read = function read(type, data) {
        throw new Error('Not implemented!');
    };
    IDataMgr.prototype.update = function update(type, data) {
        throw new Error('Not implemented!');
    };
    IDataMgr.prototype.delete = function delete_(type, data) {
        throw new Error('Not implemented!');
    };
    publish(IDataMgr, 'IDataMgr', Repository);
})();

