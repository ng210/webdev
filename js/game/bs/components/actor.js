include('./icomponent.js');
include('/lib/math/v3.js');
(function() {
    function Actor(engine, id) {
        Actor.base.constructor.call(this, engine, id);
        this.id = id;
        this.current = {
            position: new V3()
        };
        this.next = {
            position: new V3()
        };
        this.isActive = false;
        this.isDirty = true;
        this.updaters = [];
        this.constraints = [];
        this.updateState = function() {
            this.current.position.set(this.next.position);
        };
    }
    extend(ge.IComponent, Actor);

    Actor.prototype.initialize = async function initialize() {

    };

    Actor.prototype.addSprite = function addSprite(spriteManager) {
        if (!spriteManager) {
            var c = this.engine.getComponent('SpriteManager');
            if (c) {
                spriteManager = c.instances.getAt(0);
                if (!spriteManager) throw new Error('No sprite manager component created!');
            }
        }
        this.sprite = spriteManager.addSprite();
        this.sprite.actor = this;
        this.renderer = spriteManager.renderer;
        return this.sprite;
    };

    // Add mechanics to actor:
    // - adds mechanics properties
    // - adds updater
    // TODO: add mass and forces
    Actor.prototype.addMechanics = function addMechanics(mechanics) {
        mechanics.setup(this);
    };

    Actor.prototype.addCollider = function addCollider(collider) {
        this.constraints.push(collider, []);
    };

    Actor.prototype.update = function update(dt) {
        if (this.isActive) {
            for (var i=0; i<this.updaters.length;) {
                this.updaters[i++].update(this, dt, this.updaters[i++]);
            }
        } else {
            this.next.position.set(this.current.position);
        }
        for (var i=0; i<this.constraints.length;) {
            this.constraints[i++].check(this, dt, ...this.constraints[i++]);
        }
        this.updateState();
        this.renderer.update(this);
    };

    Actor.prototype.setCurrent = function setCurrent(property, value) {
        this.current[property].set(value);
    };

    publish(Actor, 'Actor', ge);
})();