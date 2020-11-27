include('control.js');
include('renderer2d.js');

(function() {
    function _CONTROL_Renderer2d(control, context) {
        _CONTROL_Renderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, _CONTROL_Renderer2d);

    _CONTROL_Renderer2d.prototype.renderControl = function renderControl() {
    };


    function _CONTROL_(id, template, parent, context) {
        _CONTROL_.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Control, _CONTROL_);

    _CONTROL_.prototype.getTemplate = function getTemplate() {
        var template = _CONTROL_.base.getTemplate.call(this);
        return template;
    };
    _CONTROL_.prototype.applyTemplate = function applyTemplate(tmpl) {

    };
    _CONTROL_.prototype.createRenderer = mode => mode == glui.Render2d ? new _CONTROL_Renderer2d() : '_CONTROL_Renderer3d';
    _CONTROL_.prototype.setRenderer = async function(mode, context) {
        await _CONTROL_.base.setRenderer.call(this, mode, context);
    };

    _CONTROL_.prototype.getHandlers = function getHandlers() {
        var handlers = _CONTROL_.base.getHandlers();
        handlers.push(
            {
                name: 'eventName', topDown: true
            }
        );
        return handlers;
    };


    publish(_CONTROL_, '_CONTROL_', glui);
    publish(_CONTROL_Renderer2d, '_CONTROL_Renderer2d', glui);
})();
