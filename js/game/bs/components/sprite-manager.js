include('./ge.js');
include('/lib/webgl/sprite/sprite-manager.js');
(function() {
    function SpriteManager() {
        this.sprMgr = null;
    };

    SpriteManager.prototype.initialize = async function(engine, mapUrl, spriteCount) {
        this.sprMgr = new webGL.SpriteManager(null);  // TODO: pass a player instance
        await this.sprMgr.initialize(mapUrl, spriteCount);
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

    publish(SpriteManager, 'SpriteManager', ge);
})();