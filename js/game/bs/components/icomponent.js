include('./ge.js');
(function() {
    function IComponent(engine, id) {
        this.engine = engine;
        this.id = id;
    }

    IComponent.prototype.initialize = function initialize() {
        throw new Error('Not implemented!');
    };

    publish(IComponent, 'IComponent', ge)
})();