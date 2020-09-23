include('input.js');
(function() {
    function Filter(parent, controls) {
        this.parent = parent;
        this.ai = [.0, .0, .0];
        this.bi = [.0, .0, .0];
        this.ci = [.0, .0, .0];
        this.ui = [.0, .0, .0];
        this.vi = [.0, .0, .0];

        this.lp = [.0, .0];
        this.hp = [.0, .0];

        this.amp = controls.amp;
        this.cut = controls.cut;
        this.res = controls.res;
        this.mod = controls.mod;
        this.mode = controls.mode;
    }
    
    Filter.prototype.run = function run(input) {
        // Apply filter
        var gain = 1.0/this.ai[0];
        var lp = (this.bi[0]*input + this.bi[1]*this.ui[0] + this.bi[2]*this.ui[1] - this.ai[1]*this.lp[0] - this.ai[2]*this.lp[1])*gain;
        var hp = (this.ci[0]*input + this.ci[1]*this.vi[0] + this.ci[2]*this.vi[1] - this.ai[1]*this.hp[0] - this.ai[2]*this.hp[1])*gain;
        // lp inputs
        this.ui[1] = this.ui[0]; this.ui[0] = input;
        // hp inputs
        this.vi[1] = this.vi[0]; this.vi[0] = input;
        // lp outputs
        this.lp[1] = this.lp[0]; this.lp[0] = lp;
        // hp outputs
        this.hp[1] = this.hp[0]; this.hp[0] = hp;

        var output = 0.0;
        if ((this.mode.value & psynth.Filter.modes.LOWPASS) != 0)
            output += lp;
        if ((this.mode.value & psynth.Filter.modes.HIGHPASS) != 0)
            output += hp;
        if ((this.mode.value & psynth.Filter.modes.BANDPASS) != 0) {
            output += input - hp - lp;
            gain *= 1.5;
        }
        return gain * output;
    };
    Filter.prototype.onchange = function onchange(cut) {
        // Update filter coefficients
        var res = (this.res.value < 0.000001) ? 1.0: 1.0 - this.res.value;
        var e = (this.cut.value + this.mod.value * cut)/2;
        var g = -res * e;
        var b0 = e*e;
        this.bi[0] = this.bi[1] = b0; this.bi[2] = 2*b0;
        this.ci[0] = this.ci[2] = 1; this.ci[1] = -2;
        this.ai[0] = b0 + 1.0 - g;
        this.ai[2] = b0 + 1.0 + g;
        this.ai[1] = 2*(b0 - 1);

    };

    Filter.createControls = function createControls() {
        return {
            amp: new psynth.PotF32(0, 1, .5),
            cut:  new psynth.PotF32(0, 1, .1),
            res: new psynth.PotF8(0, 1, .2),
            mod: new psynth.PotF8(0, 1, .0),
            mode: new psynth.Pot(0, 7, 1)
        };
    }

    Filter.modes = {
        NONE:       0,
        LOWPASS:    1,
        BANDPASS:   2,
        HIGHPASS:   4
    };

    public(Filter, 'Filter', psynth);
})();
