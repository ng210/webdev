include('./ge.js');
(function() {
    //#region InputHandlerFactory
    function InputHandlerFactory() {
        InputHandlerFactory.base.constructor.call(this);
    };
    extend(ge.IComponentFactory, InputHandlerFactory);

    InputHandlerFactory.prototype.getDependencies = function getDependencies() {
        return ['keyboard-handler.js', 'mouse-handler.js'];
    };
    InputHandlerFactory.prototype.getTypes = function getTypes() {
        return [ge.KeyboardHandler, ge.MouseHandler];
    };
    InputHandlerFactory.prototype.instantiate = function instantiate(engine, type, id) {
        var inst = null;
        switch (type) {
            case 'KeyboardHandler': inst = new ge.KeyboardHandler(engine, id); break;
            case 'MouseHandler': inst = new ge.MouseHandler(engine, id); break;
        }
        return inst;
    };
    //#endregion

    function InputHandler(engine, id) {
        InputHandler.base.constructor.call(this, engine, id);
    }
    extend(ge.IComponent, InputHandler);

    InputHandler.prototype.initialize = async function initialize() {

    };

    InputHandler.prototype.oninput = function oninput(e, args) {
        throw new Error('Not implemented!');
    };

    InputHandler.prototype.update = function update() {
        throw new Error('Not implemented!');
    };

    publish(InputHandlerFactory, 'InputHandlerFactory', ge);
    publish(InputHandler, 'InputHandler', ge);
})();