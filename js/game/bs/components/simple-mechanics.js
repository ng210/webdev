include('./mechanics.js');
(function() {
    //#region SimpleMechanicsFactory
    function SimpleMechanicsFactory() {
        SimpleMechanicsFactory.base.constructor.call(this);
    };
    extend(ge.IComponentFactory, SimpleMechanicsFactory);

    SimpleMechanicsFactory.prototype.getDependencies = function getDependencies() {
        return null;
    };
    SimpleMechanicsFactory.prototype.getTypes = function getTypes() {
        return [SimpleMechanics];
    };
    SimpleMechanicsFactory.prototype.instantiate = function instantiate(engine, type, id) {
        return new SimpleMechanics(engine, id);
    };
    //#endregion

    //#region SimpleMechanics
    function SimpleMechanics(engine, id) {
        SimpleMechanics.base.constructor.call(this, engine, id);
    }
    extend(ge.Mechanics, SimpleMechanics);

    SimpleMechanics.prototype.initialize = async function initialize() {
    };

    SimpleMechanics.prototype.update = function update(obj, dt) {
        var a = obj.current.acceleration;
        var v0 = obj.current.velocity;
        // v1 = v0 + a*dt
        var v1 = obj.next.velocity.set(v0.sum(a.prodC(dt)));
        // v = (v0 + v1)/2
        var v = obj.averageVelocity = v0.sum(v1).scale(0.5);
        // p1 = p + v*dt
        obj.next.position.set(v.prodC(dt).add(obj.current.position));
    };
    SimpleMechanics.prototype.resolveCollision = function resolveCollision(dt, i, n) {
        var p = this.current.position;
        var v = this.averageVelocity;
        var dp = i.len;
        // t1 = time till collision
        var t1 = dp/v.len;
        // move object to point of collision
        p.add(i);
        // time after collision
        var t2 = dt - t1;
        // calculate new velocity
        // r = i - 2*dot(n, i)*n
        var r = n.prodC(-2*n.dot(i)).add(i).norm();
        // v0' = r*|v1|;
        this.current.velocity.set(r.scale(v.len));
        // update object after collision
        this.update(t2);
    };
    SimpleMechanics.prototype.setup = function setup(obj, args) {
        obj.current.velocity = new V3();
        obj.current.acceleration = new V3();
        obj.next.velocity = new V3();
        obj.next.acceleration = new V3();
        obj.averageVelocity = new V3();
        obj.updaters.push(this, args);
        obj.resolveCollision = this.resolveCollision;
        obj.updateState = this.updateState;
    };
    SimpleMechanics.prototype.updateState = function updateState() {
        this.current.position.set(this.next.position);
        this.current.velocity.set(this.next.velocity);
    };
    //#endregion

    publish(SimpleMechanicsFactory, 'SimpleMechanicsFactory', ge);
    publish(SimpleMechanics, 'SimpleMechanics', ge);
})();