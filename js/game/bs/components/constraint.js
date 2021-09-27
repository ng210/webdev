include('./ge.js');

(function() {
    function Constraint() {

    }

    Constraint.prototype.check = function check(obj, dt, args) {
        throw new Error('Not implemented!');
    };

    publish(Constraint, 'Constraint', ge);
})()