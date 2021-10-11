include('./ge.js');

(function() {
    function Constraint(engine, id) {
        Constraint.base.constructor.call(this, engine, id);
    }
    extend(ge.IComponent, Constraint);

    Constraint.prototype.check = function check(obj, dt, args) {
        throw new Error('Not implemented!');
    };

    publish(Constraint, 'Constraint', ge);
})()