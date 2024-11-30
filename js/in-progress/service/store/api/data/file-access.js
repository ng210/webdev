const fs = require('fs');
include('./data-access.js');

(function() {

    const STORAGE_PATH = 'd:\\code\\tmp\\store';

    function FileAccess() {
    }

    extend(DataAccess, FileAccess);

    FileAccess.prototype.read = async function read(path) {
        var buffer = null;
        try {
            var buffer = fs.readFileSync(STORAGE_PATH + '\\' + path);
        } catch (err) {
            debug_('read error: ' + err.message);
        }
        return buffer;
    };
    FileAccess.prototype.write = async function read(path, content) {
        throw new Error('Not Implemented!');
    };
    FileAccess.prototype.list = async function list(path) {
        throw new Error('Not Implemented!');
    };

    publish(FileAccess, 'FileAccess');
})();


