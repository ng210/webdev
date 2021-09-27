include('./ge.js');
(function() {
    function Renderer() {
    }

    Renderer.prototype.resize = function resize() {
        throw new Error('Not implemented!');
    };

    Renderer.prototype.prerender = function prerender() {
        throw new Error('Not implemented!');
    };

    Renderer.prototype.render = function render() {
        throw new Error('Not implemented!');
    };

    publish(Renderer, 'Renderer', ge);
})();