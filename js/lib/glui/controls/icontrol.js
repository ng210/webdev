include('glui/glui.js');
(function() {

    function IControl() {
    }

    IControl.prototype.destroy = function destroy() {
        throw new Error('Not implemented!');
    };
    IControl.prototype.fromNode = function fromNode(node) {
        throw new Error('Not implemented!');
    };
    IControl.prototype.getTemplate = function getTemplate() {
        throw new Error('Not implemented!');
    };
    IControl.prototype.getHandlers = function getHandlers() {
        throw new Error('Not implemented!');
    };
    IControl.prototype.dataBind = function dataBind(source, field) {
        throw new Error('Not implemented!');
    };
    IControl.prototype.addHandler = function addHandler(event, handler) {
        throw new Error('Not implemented!');
    };
    IControl.prototype.setRenderer = function setRenderer(mode, context) {
        throw new Error('Not implemented!');
    };
    IControl.prototype.createRenderer = function createRenderer(mode) {
        throw new Error('Not implemented!');
    };

    public(IControl, 'IControl', glui);
})();