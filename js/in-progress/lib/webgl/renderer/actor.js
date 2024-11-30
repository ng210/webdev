include('repo-item.js');
// ********************************************************************************************
//
// Actor
//
// ********************************************************************************************
(function() {
    function Actor(id) {
        Actor.base.constructor.call(this, id);
        // statics
        this.components = [];
        // dynamics
        this.modifiers = [];
        this.constraints = [];
    }
	extend(webGL.RepoItem, Actor);

	Actor.prototype.onunload = function onunload() {
		// unload resources
    };
    
    Actor.Type = 'actor';
    webGL.Repository.registerClass(Actor.Type, Actor, ['meshes']);

    publish(Actor, 'Actor', webGL);
})();
