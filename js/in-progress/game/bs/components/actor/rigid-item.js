// Basic element for 2d rigitd body physics
// Element inherits position and bounding box from Item2d and
// contains linear and angular velocity, mass
include('../ge..js');
(function() {
    function RigidItem2d() {
        RigidItem2d.base.constructor.call(this);
        this.angle = 0;
        this.velocity = new V2();
        this.omega = 0;
        // acc, force, torque
    }
    extend(ge.Item2d, RigidItem2d);

    publish(RigidItem2d, 'RigidItem2d', ge)
})();