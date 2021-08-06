(function() {
    function IContainer() {
    }

    IContainer.create = async function create(name) {
        throw new Error('Not implemented!');
    };
    IContainer.prototype.read = async function read(offset, length) {
        throw new Error('Not implemented!');
    };
    IContainer.prototype.update = async function update(offset, data, length) {
        throw new Error('Not implemented!');
    };
    IContainer.prototype.delete = async function delete_() {
        throw new Error('Not implemented!');
    };

    publish(Container, 'Container');
})();