include('glui/glui-lib.js');
(function() {

    // internal variables and functions

    var Demo = {
        // Member variables
        // required by the framework
        name: 'Demo-name',
        settings: {
            setting1: { label: 'Setting #1', value: 0, min:0, max:1, step: 0.01, type: 'float', link: null }
        },
        // custom variables
    
        // Member functions
        // required by the framework
        initialize: function initialize() { // optional

        },
        resize: function resize(e) {
        },
        update: function update(frame, dt) {
        },
        render: function render(frame, dt) {
        }

        // custom functions

    };

    publish(Demo, 'Demo');
})();