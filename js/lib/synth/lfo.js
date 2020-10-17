include('osc.js');
(function() {
    function LFO(parent, controls) {
        LFO.base.constructor.call(this, parent, controls);

        this.dc = controls.dc;
    }
    extend(psynth.Osc, LFO);

    LFO.prototype.run = function run(am, fm, pm) {
        var delta = this.fre.value/this.parent.smpRate;
        if (delta >= 1.0) {
            delta = 0.99999999;
        }
        var arg = psynth.theta * this.timer;
        var out = Math.sin(arg);

        // var tmp = (this.timer <= psw) ? this.timer/psw : (1.0 - this.timer)/(1.0 - psw);
        // out += 2*tmp - 1.0;

        if ((this.timer += delta) > 1.0) {
            this.timer -= 1.0;
        }
        return this.amp.value*out + this.dc.value;
    };

    LFO.createControls = function createControls() {
        return {
            amp: new psynth.PotF32(0, 100, 1.0),
            dc:  new psynth.PotF32(0, 100, .0),
            fre: new psynth.PotF32(0, 1000, .5)
        };
    };

    publish(LFO, 'LFO', psynth);
})();
