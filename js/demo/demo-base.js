include('glui/glui-lib.js');
(function() {

    // internal variables and functions

    function Demo(name, settings) {
        // Member variables
        // required by the framework
        this.name = name;
        this.settings = settings;
        // {
        //     setting1: { label: 'Setting #1', value: 0, min:0, max:1, step: 0.01, type: 'float', link: null }
        // };
        // custom variables
    
        // Member functions
        // required by the framework
    }
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