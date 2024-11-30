include('item.js');
// ********************************************************************************************
//
// Actor
//
// ********************************************************************************************
(function() {
    function Actor(id) {
        Actor.base.constructor.call(this, id);
        // components
        this.components = [];
        // logic
        this.modifiers = [];
        this.constraints = [];
    }
	extend(GE.Repo.Component, Actor);

    Actor.prototype.update = function update(dt) {
        for (var i=0; i<this.components.length; i++) {
            this.components[i].update();
        }
    };

    Actor.prototype.render = function render(context) {
        for (var i=0; i<this.components.length; i++) {
            this.components[i].render();
        }
    };

    publish(Actor, 'Actor', GE.Repo);
})();
