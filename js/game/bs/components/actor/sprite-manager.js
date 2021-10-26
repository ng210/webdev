include('../icomponent-factory.js');
include('/lib/webgl/sprite/sprite-manager.js');
(function() {

    //#region SpriteMangerFactory
    function SpriteManagerFactory() {
        SpriteManagerFactory.base.constructor.call(this);
    };
    extend(ge.IComponentFactory, SpriteManagerFactory);

    SpriteManagerFactory.prototype.getDependencies = function getDependencies() {
        return ['renderer/sprite-renderer.js'/*, 'sprite-collider.js'*/];
    };
    SpriteManagerFactory.prototype.getTypes = function getTypes() {
        return [SpriteManager, ge.SpriteRenderer/*, ge.SpriteCollider*/];
    };
    SpriteManagerFactory.prototype.instantiate = function instantiate(engine, componentName, id) {
        var inst = null;
        switch (componentName) {
            case 'SpriteManager': inst = new SpriteManager(engine, id, arguments[3], arguments[4]); break;
            //case 'SpriteCollider': inst = new ge.SpriteCollider(engine, componentName); break;
            case 'SpriteRenderer': inst = new ge.SpriteRenderer(engine, id); break;
        }
        return inst;
    };
    //#endregion

    //#region SpriteManager
    function SpriteManager(engine, id) {
        SpriteManager.base.constructor.call(this, engine, id);
        this.sprMgr = null;
    };
    extend(ge.IComponent, SpriteManager);

    SpriteManager.prototype.initialize = async function initialize(mapUrl, spriteCount) {
        this.sprMgr = new webGL.SpriteManager(null);  // TODO: pass a player instance
        await this.sprMgr.initialize(mapUrl, spriteCount);
        //this.collider = await ge.createInstance('SpriteCollider', this.id+'Collider1', this.sprMgr);
        this.renderer = await ge.createInstance('SpriteRenderer', this.id+'Renderer1', this.sprMgr);
    };

    SpriteManager.prototype.addSprite = function addSprite() {
        return this.sprMgr.addSprite();
    };

    SpriteManager.prototype.update = function update() {
        this.sprMgr.update();
    };

    SpriteManager.prototype.updateSprite = function updateSprite(spr) {
        this.sprMgr.updateSprite(spr);
    };

    SpriteManager.prototype.render = function render() {
        this.sprMgr.render();
    };

    SpriteManager.prototype.resize = function resize(size) {
        this.sprMgr.resize(size.x, size.y);
    };
    //#endregion

    ge.addSprite = function(id, spriteManager) {
        var a = ge.addActor(id);
        if (!spriteManager) {
            var c = this.getComponent('SpriteManager');
            if (c) {
                spriteManager = c.instances.getAt(0);
                if (!spriteManager) throw new Error('No sprite manager component created!');
            }
        }
        a.sprite = spriteManager.addSprite();
        a.sprite.actor = a;
        a.renderer = spriteManager.renderer;
        return a;
    }

    publish(SpriteManagerFactory, 'SpriteManagerFactory', ge);
    publish(SpriteManager, 'SpriteManager', ge);
})();
