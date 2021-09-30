include('./ge.js');

(function() {
    function Mechanics() {

    }
    Mechanics.prototype.update = function update(dt) {
        throw new Error('Not implemented!');
    };

    Mechanics.prototype.resolveCollision = function resolveCollision(dt, incidentVector, normalVector) {
        throw new Error('Not implemented!');
    };

    publish(Mechanics, 'Mechanics', ge);
})()