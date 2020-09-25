include('env.js')
include('osc.js')
include('filter.js')
(function() {
    function Voice(parent) {
        this.velocity = new psynth.Pot(0, 1, 0);
        this.note = new psynth.Pot(0, 127, 0);
        // create a basic synth with 2 oscillators and 2 envelopes for AM
        this.envelopes = [
            new psynth.Env(parent, parent.controls.env1),
            new psynth.Env(parent, parent.controls.env2),
            new psynth.Env(parent, parent.controls.env3)
        ];
        this.lfos = [
            new psynth.Osc(parent, parent.controls.lfo1),
            new psynth.Osc(parent, parent.controls.lfo2)
        ];
        parent.controls.osc1.note = this.note;
        parent.controls.osc2.note = this.note;
        this.oscillators = [
            new psynth.Osc(parent, parent.controls.osc1),
            new psynth.Osc(parent, parent.controls.osc2)
        ];
        this.filter = new psynth.Filter(parent, parent.controls.flt1);
    }

    Voice.prototype.setNote = function(note, velocity) {
        this.note.value = note;
        for (var i=0; i<this.lfos.length; i++) {
            this.lfos[i].timer = 0;
        }
        for (var i=0; i<this.envelopes.length; i++) {
            this.envelopes[i].setGate(velocity);
        }
    };
    Voice.prototype.run = function() {
        // run LFOs
        var lfo1 = this.lfos[0].run(1.0, 0.0, 0.0);
        var lfo2 = this.lfos[1].run(1.0, 0.0, 0.0);
        // run main oscillators
        var amp = this.envelopes[0].run(lfo1);
        var psw = this.envelopes[1].run(1.0);
        var cut = this.envelopes[2].run(1.0);
        var smp1 = this.oscillators[0].run(amp, lfo2, psw);
        var smp2 = this.oscillators[1].run(amp, lfo2, psw);
        this.filter.onchange(cut);
        var out = this.filter.run(smp1 + smp2);
        return out;
    };
    Voice.prototype.isActive = function() {
        return this.envelopes[0].phase < 7;
    };
    Voice.prototype.getTicks = function() {
        return this.envelopes[0].ticks;
    };

    publish(Voice, 'Voice', psynth);
})();