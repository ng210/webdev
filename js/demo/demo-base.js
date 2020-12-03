include('glui/glui-lib.js');
(function() {

    // internal variables and functions

    function Demo(name, settings) {
        this.name = name;
        this.settings = settings;
    }
    // functions required by the framework
    Demo.prototype.initialize = function initialize() { // optional
    };
    Demo.prototype.resize = function resize(e) {
    };
    Demo.prototype.update = function update(frame, dt) {
    };
    Demo.prototype.render = function render(frame, dt) {
    };

    // custom functions

    publish(Demo, 'Demo');
})();