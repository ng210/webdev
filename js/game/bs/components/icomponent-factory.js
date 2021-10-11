include('./ge.js');
include('./icomponent.js');
(function() {
    function IComponentFactory() {
    }

    IComponentFactory.prototype.getDependencies = function getDependencies() {
        throw new Error('Not implemented!');
    };

    IComponentFactory.prototype.getTypes = function getTypes() {
        throw new Error('Not implemented!');
    };

    IComponentFactory.prototype.instantiate = function instantiate(engine, type, id) {
        throw new Error('Not implemented!');
    };

    publish(IComponentFactory, 'IComponentFactory', ge)
})();