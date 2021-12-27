include('../icomponent.js');
include('/lib/math/v3.js');
(function() {
    function ActorState() {
        this.position = new V3();
    }
    function Actor(engine, id) {
        Actor.base.constructor.call(this, engine, id);
        this.id = id;
        this.current = new ActorState();
        this.next = new ActorState();
        this.isActive = false;
        this.isDirty = true;
        this.mechanics = null;
        this.updaters = [];
        this.constraints = [];
        this.updateState = function() {
            this.current.position.set(this.next.position);
        };
    }
    extend(ge.IComponent, Actor);

    Actor.prototype.initialize = async function initialize() {

    };

    // Add mechanics to actor:
    // - adds mechanics properties
    // - adds updater
    // TODO: add mass and forces
    Actor.prototype.addMechanics = function addMechanics(mechanics) {
        this.mechanics = mechanics;
        mechanics.setup(this);
    };

    Actor.prototype.addCollider = function addCollider(collider) {
        this.constraints.push(collider, []);
    };

    Actor.prototype.update = function update(dt) {
        if (this.isActive && this.ttl > 0) {
            this.ttl--;
            for (var i=0; i<this.updaters.length;) {
                this.updaters[i++].update(this, dt, this.updaters[i++]);
            }
            for (var i=0; i<this.constraints.length;) {
                this.constraints[i++].check(this, dt, 0, ...this.constraints[i++]);
            }
            this.updateState();
        }
        this.renderer.update(this);
    };

    Actor.prototype.setCurrent = function setCurrent(property, value) {
        if (typeof this.current[property].set === 'function') {
            this.current[property].set(value);
        } else {
            this.current[property] = value;
        }
    };

    publish(Actor, 'Actor', ge);
})();