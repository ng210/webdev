include('/lib/webgl/sprite/sprite.js');
(function() {

    // Ball as Actor
    function Ball(sprMgr) {
        Ball.base.constructor.call(this, sprMgr);
        this.position2 = new V3();
        this.velocity = new V3();
        this.velocity2 = new V3();
        this.acceleration = new V3();
        this.acceleration2 = new V3();
        this.mass = 1.0;
    }
    extend(webGL.Sprite, Ball);
    
    Ball.prototype.update = function update(dt) {
        throw new Error('Not implemented!');
    };

    Ball.prototype.render = function render(dt) {
    };

    publish(Ball, 'Ball');
})();

