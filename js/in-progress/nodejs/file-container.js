const fs = require('fs');
include('/lib/utils/icontainer.js');
(function() {
    function FileContainer(path, id) {
        this.path = path;
        this.id = id;
    }
    extend(IContainer, FileContainer);

    FileContainer.create = async function create(path) {
        var fd = fs.openSync(path, { flags:'w+'});
        var container = new FileContainer(path, fd);
        FileContainer.cache[fd] = container;
        return container;
    };
    FileContainer.cache = {};

    FileContainer.prototype.read = async function read(offset, length) {
        return fs.readFileSync()
        throw new Error('Not implemented!');
    };
    FileContainer.prototype.update = async function update(offset, data, length) {
        throw new Error('Not implemented!');
    };
    FileContainer.prototype.delete = async function delete_() {
        throw new Error('Not implemented!');
    };

    publish(FileContainer, 'FileContainer');
})();