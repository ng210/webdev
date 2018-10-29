(function() {
    function Demo(id, canvas) {
        this.id = id;
        this.canvas = canvas;
        this.config = {};
        this.constructor = Demo;
    }
    Demo.prototype.initialize = function() { throw new Error('Not implemented'); };
    Demo.prototype.processInputs = function() { throw new Error('Not implemented'); };
    Demo.prototype.update = function() { throw new Error('Not implemented'); };
    Demo.prototype.render = function() { throw new Error('Not implemented'); };
    Demo.prototype.onresize = function(e) { throw new Error('Not implemented'); };
    Demo.prototype.onsettingchanged = function(e) { throw new Error('Not implemented'); };

    public(Demo, 'Demo');

})();