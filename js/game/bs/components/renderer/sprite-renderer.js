include('./renderer.js');
(function() {
    function SpriteRenderer(engine, id) {
        SpriteRenderer.base.constructor.call(this, engine, id);
        this.sprMgr = null;
    }
    extend(ge.Renderer, SpriteRenderer);

    SpriteRenderer.prototype.initialize = async function initialize(sprMgr) {
        this.sprMgr = sprMgr;
    };

    SpriteRenderer.prototype.resize = function resize() {
        this.sprMgr.resize(this.engine.resolution[0], this.engine.resolution[1]);
    };

    SpriteRenderer.prototype.prerender = function prerender() {
        // nothing to do
    };

    SpriteRenderer.prototype.render = function render() {
        this.sprMgr.update();
        this.sprMgr.render();
    };

    SpriteRenderer.prototype.update = function update(obj, args) {
        obj.sprite.setPosition(obj.current.position);
        this.sprMgr.updateSprite(obj.sprite);
    };

    publish(SpriteRenderer, 'SpriteRenderer', ge);
})();