include('repo-item.js');
include('/math/v3.js');
(function() {
    function Component(id) {
        Component.base.constructor.call(this, id);
        this.origin = new V3();
    }
    extend(Ge.Repo.Item, Component);

    Component.prototype.update = function update(dt) {
        throw new Error('Not implemented!');
    };

    Component.prototype.render = function render(context) {
        throw new Error('Not implemented!');
    };

    //#region GE.Repo.Item
    Component.prototype.load = function load(data) {
        this.id = data.id;
        this.origin.set(data.origin);
    };

    Component.prototype.unload = function unload(data) {
        throw new Error('Not implemented!');
    };
    //#endregion

    publish(Component, 'Component', GE.Repo);
})();