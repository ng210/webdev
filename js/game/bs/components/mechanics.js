include('./ge.js');

(function() {
    function Mechanics(engine, id) {
        Mechanics.base.constructor.call(this, engine, id);

    }
    extend(ge.IComponent, Mechanics);

    Mechanics.prototype.update = function update(obj, dt) {
        throw new Error('Not implemented!');
    };

    Mechanics.prototype.resolveCollision = function resolveCollision(dt, incidentVector, normalVector) {
        throw new Error('Not implemented!');
    };

    Mechanics.ForceTypes = {
        Field: 1,
        Point: 2
    };

    publish(Mechanics, 'Mechanics', ge);
})()