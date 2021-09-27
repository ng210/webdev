include('/lib/glui/glui-lib.js');
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
    Demo.onmousemove = function onmousemove(x, y, e) {
        if (e) {
            this.cursor[0] = this.ratio[0] * x;
            this.cursor[1] = this.ratio[1] * y;
        }
    };

    // custom functions

    publish(Demo, 'Demo');
})();