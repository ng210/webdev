include('input.js');
(function() {
    function Osc(parent, controls) {
        this.parent = parent;
        this.reset();
        
        this.amp = controls.amp;
        this.dc  = controls.dc;
        this.fre  = controls.fre;
        this.note = controls.note;
        this.tune = controls.tune;
        this.psw  = controls.psw;
        this.wave = controls.wave;
    }

    Osc.prototype.reset = function reset() {
        this.timer = 0;
        this.smp = 0;
    };

    Osc.prototype.run = function run(am, fm, pm) {
        var pitch = this.note.value + this.tune.value;
        var delta = (this.fre.value + fm + psynth.p2f(pitch))/this.parent.smpRate;
        if (delta >= 1.0) {
            delta = 0.99999999;
        }
        var psw = pm + this.psw.value;
        var out = 0.0;
        var wf = this.wave.value;
        var wfc = 0;
        if ((wf & psynth.Osc.waveforms.SINUS) != 0) {
            var arg = psynth.theta * this.timer;
            out += Math.sin(arg);
            wfc++;
        }
        if ((wf & psynth.Osc.waveforms.TRIANGLE) != 0) {
            var tmp = (this.timer <= psw) ? this.timer/psw : (1.0 - this.timer)/(1.0 - psw);
            out += 2*tmp - 1.0;
            wfc++;
        }
        if ((wf & psynth.Osc.waveforms.SAW) != 0) {
            out += (this.timer <= psw) ? 2.0 * this.timer/psw : 0.0;
            out -= 1.0;
            wfc++;
        }
        if ((wf & psynth.Osc.waveforms.PULSE) != 0) {
            out += this.timer <= psw ? 1.0 : -1.0;
            wfc++;
        }
        if ((wf & psynth.Osc.waveforms.NOISE) != 0) {
            if (this.timer < delta ||
                this.timer > 0.5 && this.timer < 0.5 + delta)
                this.smp = Math.random();
            out += this.smp;
            wfc++;
        }
        if (wfc > 1) {
            out /=  wfc;
        }
        if ((this.timer += delta) > 1.0) {
            this.timer -= 1.0;
        }
        return this.amp.value*am*out + this.dc.value;
    };

    Osc.createControls = function createControls() {
        return {
            amp: new psynth.PotF32(0, 100, 1.0),
            dc:  new psynth.PotF32(0, 100, .0),
            fre: new psynth.PotF32(0, 1000, .5),
            note: new psynth.Pot(0, 127, 0),
            tune: new psynth.Pot(0, 24, .0),
            psw: new psynth.PotF8(0, 1, .5),
            wave: new psynth.Pot(0, 127, 1),
        };
    };

    Osc.waveforms = {
        NONE:      0,
        SINUS:     1,
        TRIANGLE:  2,
        SAW:       4,
        PULSE:     8,
        NOISE:    16
    };

    public(Osc, 'Osc', psynth);
})();
