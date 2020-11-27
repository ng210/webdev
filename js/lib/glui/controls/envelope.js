include('control.js');
include('renderer2d.js');

(function() {
    function EnvelopeRenderer2d(control, context) {
        EnvelopeRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, EnvelopeRenderer2d);

    EnvelopeRenderer2d.prototype.renderControl = function renderControl() {
    };


    function Envelope(id, template, parent, context) {
        Envelope.base.constructor.call(this, id, template, parent, context);
        this.levels = [];
        this.times = [];
    }
    extend(glui.Control, Envelope);

    Envelope.prototype.getTemplate = function getTemplate() {
        var template = Envelope.base.getTemplate.call(this);
        return template;
    };
    Envelope.prototype.createRenderer = mode => mode == glui.Render2d ? new EnvelopeRenderer2d() : 'EnvelopeRenderer3d';
    Envelope.prototype.setRenderer = async function(mode, context) {
        await Envelope.base.setRenderer.call(this, mode, context);
    };

    publish(Envelope, 'Envelope', glui);
    publish(EnvelopeRenderer2d, 'EnvelopeRenderer2d', glui);
})();
