include('repository.js');
(function() {
    function Item(id) {
        this.id = id;
        this.references = [];
    }

    Item.prototype.load = function load(data) {
        this.id = data.id;
    };

    Item.prototype.unload = function unload(data) {
        throw new Error('Not implemented!');
    };

    publish(Item, 'Item', GE.Repo);
})();