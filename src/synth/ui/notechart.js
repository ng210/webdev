include('/ui/multichart.js');

(function() {
    Ui.NoteChart = function(id, template, parent) {
        this.template = template || {};
        this.template.unit = template?.unit || [20.0, 8.0];
        this.template['grid-color'] = template['grid-color'] || [0.5, 0.5, 0.5];
        this.template.color = template?.color || [1.0, 1.0, 0.5];
        //template.type = template.type || 'notechart';
        Ui.MultiChart.call(this, id, template, parent, 'ui');
    };
    extend(Ui.MultiChart, Ui.NoteChart);

    Ui.MultiChart.RenderModes['bar2'].shader = 'note';
    Ui.Control.Types['notechart'] = { ctor: Ui.NoteChart, tag: 'DIV' };

    Ui.NoteChart.prototype.onSet = function(from, to) {
        var dx = Math.abs(to[0] - from[0]) + 1;
        var dy = Math.abs(to[1] - from[1]) + 1;
        var velocity = Math.floor(255 * dy * this.uniforms.uUnit.value[1]/this.uniforms.uSize.value[1]);
        var note = [from[0], from[1], velocity, dx];
        this.series.set(note);
    };
    // Ui.NoteChart.prototype.render = async function(ctx) {
    //     Ui.NoteChart.base.render.call(this, ctx);
    // };

})();