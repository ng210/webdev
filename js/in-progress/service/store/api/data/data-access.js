(function() {
    // Data Access Interface
    function DataAccess() {
    }

    DataAccess.prototype.read = function read(path) {
        throw new Error('Not Implemented!');
    };
    DataAccess.prototype.write = function read(path, content) {
        throw new Error('Not Implemented!');
    };
    DataAccess.prototype.list = function list(path) {
        throw new Error('Not Implemented!');
    };

    publish(DataAccess, 'DataAccess');
})();