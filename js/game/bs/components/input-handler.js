include('./ge.js');
(function() {
    function InputHandler() {
    }

    InputHandler.prototype.oninput = function oninput(e, args) {
        throw new Error('Not implemented!');
    };

    InputHandler.prototype.update = function update() {
        throw new Error('Not implemented!');
    };

    publish(InputHandler, 'InputHandler', ge);
})();