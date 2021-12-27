include('./mechanics.js');
(function() {
    //#region BasicMechanicsFactory
    function BasicMechanicsFactory() {
        BasicMechanicsFactory.base.constructor.call(this);
    };
    extend(ge.IComponentFactory, BasicMechanicsFactory);

    BasicMechanicsFactory.prototype.getDependencies = function getDependencies() {
        return null;
    };
    BasicMechanicsFactory.prototype.getTypes = function getTypes() {
        return [BasicMechanics];
    };
    BasicMechanicsFactory.prototype.instantiate = function instantiate(engine, type, id) {
        return new BasicMechanics(engine, id);
    };
    //#endregion

    //#region BasicMechanics
    function Force() {
    }
    Force.prototype.apply = function apply(obj) {
        throw new Error('Not implemented!');
    }
    function ForceField(f) {
        ForceField.base.constructor.call(this);
        this.f = f;
    }
    extend(Force, ForceField);
    ForceField.prototype.apply = function apply(obj) {
        // a += F/m
        var f = new V3(this.f); //.divC(obj.current.mass);
        obj.current.acceleration.add(f);
    };

    function ForcePoint(center, amount) {
        ForceField.base.constructor.call(this);
        this.center = center;
        this.amount = amount;
    }
    extend(Force, ForcePoint);
    ForcePoint.prototype.apply = function apply(obj) {
        // a += f*M/r²
        var d = this.center.diff(obj.current.position);
        var l = 1/d.len2;
        obj.current.acceleration.add(d.norm().mul(this.amount).scale(l));
    };

    function BasicMechanics(engine, id) {
        BasicMechanics.base.constructor.call(this, engine, id);
        this.config = {
            damping: 1.0,
            timeToLive: 4
        };
        this.forces = [];
    }
    extend(ge.Mechanics, BasicMechanics);

    BasicMechanics.prototype.initialize = async function initialize(config) {
        for (var i in config) {
            if (i.toLowerCase() == 'forces' && Array.isArray(config[i])) {
                this.addForces(config[i]);
            } else
            if (this.config[i] != undefined && config[i] != undefined) {
                if (typeof this.config[i].set === 'function') this.config[i].set(config[i]);
                else this.config[i] = config[i];
            }
        }
    };
    BasicMechanics.prototype.clearForces = function clearForces() {
        this.forces.length = 0;
    };
    BasicMechanics.prototype.addForces = function addForces(forces) {
        for (var j=0; j<forces.length; j++) {
            var fj = forces[j];
            var force = null;
            switch (fj.type.toLowerCase()) {
                case 'field':
                    force = new ForceField(fj.direction)
                    break;
                case 'point':
                    force = new ForcePoint(fj.center, fj.amount);
                    break;
                default:
                    throw new Error(`Invalid force type '${fj.type}'!`);
            }
            this.forces.push(force);
        }
    };

    BasicMechanics.prototype.update = function update(obj, dt) {
        var a = obj.current.acceleration.set([0, 0, 0]);
        for (var i=0; i<this.forces.length; i++) {
            this.forces[i].apply(obj);
        }
        var v0 = obj.current.velocity;
        // v1 = v0 + a*dt
        var v1 = obj.next.velocity.set(v0.sum(a.prodC(dt)));
        // v = (v0 + v1)/2
        var v = v0.sum(v1).scale(0.5);
        // TODO: add a proper minimum value        
        obj.averageVelocity = v;
        // p1 = p + v*dt
        var dp = v.prodC(dt);
        if (dp.len < 0.1) dp.set([0, 0, 0]);
        obj.next.position.set(dp.add(obj.current.position));
    };
    BasicMechanics.prototype.resolveCollision = function resolveCollision(obj, dt, i, n) {
        var p = obj.current.position;
        var v = obj.averageVelocity;
        var dp = i.len;
        // t1 = time till collision
        var t1 = dp/v.len;
        // move object to point of collision
        //p.add(i.scale(0.5));
        // time after collision
        var t2 = dt - t1;
        // calculate new velocity
        // r = i - 2*dot(n, i)*n
        var ndi = n.dot(i);
        var r = n.prodC(-2*ndi).add(i).norm();
        // v0' = r*|v1|;
        obj.current.velocity.set(r.scale(v.len*this.config.damping));
        // update object after collision
        obj.update(t2);
    };
    BasicMechanics.prototype.setup = function setup(obj, args) {
        obj.current.velocity = new V3();
        obj.current.acceleration = new V3();
        obj.next.velocity = new V3();
        obj.current.mass = 1.0;
        //obj.next.acceleration = new V3();
        obj.averageVelocity = new V3();
        obj.updaters.push(this, args);
        obj.updateState = this.updateState;
    };
    BasicMechanics.prototype.updateState = function updateState() {
        this.current.position.set(this.next.position);
        this.current.velocity.set(this.next.velocity);
    };
    //#endregion

    publish(BasicMechanicsFactory, 'BasicMechanicsFactory', ge);
    publish(BasicMechanics, 'BasicMechanics', ge);
})();