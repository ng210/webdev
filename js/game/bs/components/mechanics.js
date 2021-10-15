include('./ge.js');

(function() {
    function Mechanics(engine, id) {
        Mechanics.base.constructor.call(this, engine, id);

    }
    extend(ge.IComponent, Mechanics);

    Mechanics.prototype.update = function update(dt) {
        throw new Error('Not implemented!');
    };

    Mechanics.prototype.resolveCollision = function resolveCollision(dt, incidentVector, normalVector) {
        throw new Error('Not implemented!');
    };

    publish(Mechanics, 'Mechanics', ge);
})()