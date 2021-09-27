include('./ge.js');
include('/lib/math/v3.js');
(function() {

    function Actor(id) {
        this.id = id;
        this.current = {
            position: new V3()
        };
        this.next = {
            position: new V3()
        };
        this.isDirty = true;
        this.updaters = [];
        this.constraints = [];
        this.updateState = null;
    }

    Actor.prototype.addSprite = function addSprite() {
        var sprMgr = ge.getComponent('SpriteManager');
        this.sprite = sprMgr.addSprite();
        var sr = ge.getComponent('SpriteRenderer');
        this.renderer = sr;
        this.updateState = sr;
        return this.sprite;
    };

    // Add mechanics to actor:
    // - adds mechnics properties
    // - adds updater
    // TODO: add acceleration, forces
    Actor.prototype.addSimpleMechanics = function addSimpleMechanics(args) {
        this.current.velocity = new V3();
        this.updaters.push(ge.getComponent('SimpleMechanics'), args);
        //this.resolveCollision = 
    };

    Actor.prototype.addSegmentCollider = function addSegmentCollider(segmentList) {
        this.constraints.push(ge.getComponent('SegmentCollider2d'), [segmentList]);
    };

    Actor.prototype.update = function update(dt) {
        for (var i=0; i<this.updaters.length;) {
            this.updaters[i++].update(this, dt, this.updaters[i++]);
        }
        for (var i=0; i<this.constraints.length;) {
            this.constraints[i++].check(this, dt, ...this.constraints[i++]);
        }
        this.updateState.update(this);
    };

    Actor.prototype.setCurrent = function setCurrent(property, value) {
        this.current[property].set(value);
    };

    publish(Actor, 'Actor', ge);
})();