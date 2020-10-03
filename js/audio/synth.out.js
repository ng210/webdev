var psynth = {};

var preset = {
    "default": {
        "amp": 0.80,

        "lfo1.amp": 0.15, "lfo1.dc":  0.70, "lfo1.fre":  0.30, "lfo1.wave": 1,
        "lfo2.amp": 0.10, "lfo2.dc":  0.00, "lfo2.fre":  0.60, "lfo2.wave": 1,

        "env1.amp": 1.00, "env1.dc":  0.00, "env1.atk":  0.00, "env1.dec": 0.01, "env1.sus": 0.20, "env1.rel": 0.01,
        "env2.amp": 0.40, "env2.dc":  0.00, "env2.atk":  0.00, "env2.dec": 0.90, "env2.sus": 0.80, "env2.rel": 0.40,
        "env3.amp": 0.50, "env3.dc":  0.00, "env3.atk":  0.00, "env3.dec": 0.02, "env3.sus": 0.50, "env3.rel": 0.20,

        "osc1.amp": 0.60, "osc1.fre": 0.00, "osc1.tune":  0.00, "osc1.psw": 0.30, "osc1.wave": 8,
        "osc2.amp": 0.20, "osc2.fre": 0.50, "osc2.tune": 12.00, "osc2.psw": 0.50, "osc2.wave": 8,

        "flt1.cut": 0.0, "flt1.res": 0.8, "flt1.mod": 0.6, "flt1.mode": 1
    }
};

function extend(b, e) {
    e.prototype = Reflect.construct(b, []);
    e.prototype.constructor = e;
    e.base = b.prototype;
}

function getObjectAt(path, obj) {
    obj = obj || psynth;
    var tokens = path.split('.');
    for (var i=0; i<tokens.length; i++) {
        obj = obj[tokens[i]];
        if (typeof obj !== 'object' || obj == null) {
            if (i != tokens.length-1) obj = null;
            break;
        }
    }
    return obj;
}

/* synth\psynth.js ***********************************************************/
(function() {
    psynth.theta = 2 * Math.PI;

    // 00 01 02 03 04 05 06 07 08 09 10 11 12
    // C  C# D  D# E  F  F# G  G# A  A# H  C'
    // 0 = 0, 1 = C-1, 70 = A4 = 440Hz
    psynth.freqTable = (function() {
        var table = [0];
        for (var i=0; i<128; i++) {
            var oi = Math.floor(i/12);
            var ti = (i % 12) - 9;
            var base = 440*Math.pow(2, oi-5);
            table.push(base*Math.pow(2, ti/12));
        }
        return table;
    })();

    psynth.p2f_ = function p2f_(p) {
        var i = Math.floor(p);
        var f = p - i;
        var f1 = psynth.freqTable[i];
        var f2 = psynth.freqTable[i+1];
        return (1-f)*f1 + f*f2;
    }

    // c = pow(2, 1/12); f = pow(c, pitch)*ref_freq (=C0)
    psynth.p2f = p => ((p == 0) ? 0.0 : (Math.pow(1.05946309436, p) * 7.7169265821269392473555397165444));


//     publish(psynth, 'psynth');
})();
/* synth\input.js ************************************************************/
// include('psynth.js');
(function() {
    function Pot(min, max, value) {
        this.min = min;
        this.max = max;
        this.value = value;
    }
    Pot.prototype.set = function set(value) {
        if (value > this.min) {
            if (value < this.max) {
                this.value = value;
            } else {
                this.value = this.max;
            }
        } else {
            this.value = this.min;
        }
        return this.value;
    };
    Pot.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readUint8());
    };

    function PotF8(min, max, value) {
        PotF8.base.constructor.call(this, min, max, value);
    }
    extend(Pot, PotF8);
    PotF8.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readUint8()/255);
    };

    function PotF32(min, max, value) {
        PotF32.base.constructor.call(this, min, max, value);
    }
    extend(Pot, PotF32);
    PotF32.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readFloat32());
    };

//     publish(Pot, 'Pot', psynth);
    psynth['Pot'] = Pot;
//     publish(PotF8, 'PotF8', psynth);
    psynth['PotF8'] = PotF8;
//     publish(PotF32, 'PotF32', psynth);
    psynth['PotF32'] = PotF32;
})();
/* synth\env.js **************************************************************/
// include('input.js');
(function() {
    function Env(parent, controls) {
        this.parent = parent;
        this.gate = 0;
        this.velocity = 0;
        this.phase = psynth.Env.phase.IDLE;
        this.timer = 0;
        this.ticks = 0;
        this.rate = 0;
    
        this.amp = controls.amp;
        this.dc  = controls.dc;
        this.atk = controls.atk;
        this.dec = controls.dec;
        this.sus = controls.sus;
        this.rel = controls.rel;
    }

    Env.prototype.setGate = function setGate(velocity) {
        if (this.gate <= 0) {
            if (velocity > 0) {
                // slope up: retrigger envelope
                this.phase = psynth.Env.phase.UP;
                this.timer = 0;
                this.ticks = 0;
                this.gate = 1;
                this.velocity = velocity;
            }            
        } else {
            if (velocity <= 0) {
                // slope down: start release phase
                this.phase = psynth.Env.phase.DOWN;
                this.timer = this.sus.value;
                this.gate = 0;
            }
        }
    };

    Env.prototype.run = function run(am) {
        switch (this.phase) {
            case Env.phase.UP: // atk precalc
                // 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
                // 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate = 4/smpRate
                //   X : Xs -> 1/(3.995*X + 0.005)/smpRate
                this.rate = 1/(this.parent.smpRate * (3.995 * this.atk.value + 0.005));
                this.phase++;
            case Env.phase.ATK: // atk
                this.timer += this.rate;
                if (this.timer >= 1.0) {
                    this.phase++;
                    this.timer = 1.0;
                }
                //smp = smooth(this.timer);
                break;
            case Env.phase.DEC: // dec precalc
                // 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
                // 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate
                //   X : Xs -> 1/(3.995*X + 0.005)/smpRate
                this.rate = 1/(this.parent.smpRate * (3.995 * this.dec.value + 0.005));
                this.phase++;
            case Env.phase.SUS: // dec/sustain
                if (this.timer <= this.sus.value) {
                    this.timer = this.sus.value;
                } else {
                    this.timer -= this.rate;
                    //var susm1 = 1- this.sus;
                    //smp = susm1*smooth((this.timer-this.sus)/susm1) + this.sus;
                }
                break;
            case Env.phase.DOWN: // rel precalc
                // 0.0 :  0.005s -> 1/(0*9.995 + 0.005)/smpRate = 200/smpRate
                // 1.0 : 10.0s -> 1/(1*9.995 + 0.005)/smpRate
                //   X :  Xs -> 1/(9.995*X + 0.005)/smpRate
                this.rate = 1/(this.parent.smpRate * (9.995 * this.rel.value + 0.005));
                this.phase++;
            case Env.phase.REL: // rel
                this.timer -= this.rate;
                if (this.timer <= 0.0) {
                    this.phase = Env.phase.IDLE; // set to idle
                    this.timer = 0.0;
                }
                //smp = this.sus*smooth(this.timer/this.sus);
                break;
        }
        this.ticks++;
        return this.amp.value*am*this.timer*this.velocity + this.dc.value;
    };

    Env.createControls = function createControls() {
        return {
            'amp': new psynth.PotF32(0, 1, .5),
            'dc':  new psynth.PotF32(0, 1, .5),
            'atk': new psynth.PotF8(0, 1, .5),
            'dec': new psynth.PotF8(0, 1, .5),
            'sus': new psynth.PotF8(0, 1, .5),
            'rel': new psynth.PotF8(0, 1, .5)
        }
    };

    Env.phase = {
        UP:      1,
        ATK:     2,
        DEC:     3,
        SUS:     4,
        DOWN:    5,
        REL:     6,
        IDLE:    7
    };

//     publish(Env, 'Env', psynth);
    psynth['Env'] = Env;
})();
/* synth\input.js ************************************************************/
// include('psynth.js');
(function() {
    function Pot(min, max, value) {
        this.min = min;
        this.max = max;
        this.value = value;
    }
    Pot.prototype.set = function set(value) {
        if (value > this.min) {
            if (value < this.max) {
                this.value = value;
            } else {
                this.value = this.max;
            }
        } else {
            this.value = this.min;
        }
        return this.value;
    };
    Pot.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readUint8());
    };

    function PotF8(min, max, value) {
        PotF8.base.constructor.call(this, min, max, value);
    }
    extend(Pot, PotF8);
    PotF8.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readUint8()/255);
    };

    function PotF32(min, max, value) {
        PotF32.base.constructor.call(this, min, max, value);
    }
    extend(Pot, PotF32);
    PotF32.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readFloat32());
    };

//     publish(Pot, 'Pot', psynth);
    psynth['Pot'] = Pot;
//     publish(PotF8, 'PotF8', psynth);
    psynth['PotF8'] = PotF8;
//     publish(PotF32, 'PotF32', psynth);
    psynth['PotF32'] = PotF32;
})();
/* synth\osc.js **************************************************************/
// include('input.js');
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

//     publish(Osc, 'Osc', psynth);
    psynth['Osc'] = Osc;
})();
/* synth\filter.js ***********************************************************/
// include('input.js');
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

//     publish(Filter, 'Filter', psynth);
    psynth['Filter'] = Filter;
})();
/* synth\voice.js ************************************************************/
// include('env.js')
// include('osc.js')
// include('filter.js')
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

//     publish(Voice, 'Voice', psynth);
    psynth['Voice'] = Voice;
})();
/* synth\synth.js ************************************************************/
/******************************************************************************
 * PSynth library
 *****************************************************************************/
// include('voice.js');
(function() {
    /*****************************************************************************/
    function Synth(smpRate, voiceCount) {
        this.smpRate = smpRate;
        this.omega = psynth.theta / smpRate;
        this.isActive = true;
        this.nextVoice = 0;
        this.label = '';
        // create controls
        this.controls = psynth.Synth.createControls();
        // create voices
        this.voices = [];
        for (var i=0; i<voiceCount; i++) {
            this.voices.push(new psynth.Voice(this));
        }
        this.soundBank = null;
    }

    Synth.prototype.setup = function(values) {
        for (var i=0; i<values.length; i+=2) {
            var ctrlId = values[i];
            var key = Object.keys(psynth.Synth.controls).find(
                function(k) {
                    return psynth.Synth.controls[k] == ctrlId;
                }
            );
            if (key === undefined) {
                console.log('No control with the id ' + ctrlId + ' was found!');
            }
            this.getControl(values[i]).value = values[i+1];
        }
    };
    Synth.prototype.getControl = function(controlId) {
        var pot = null;
        switch (controlId) {
            case psynth.Synth.controls.amp: pot = this.controls.amp; break;
            // LFO
            case psynth.Synth.controls.lfo1amp: pot = this.controls.lfo1.amp; break;
            case psynth.Synth.controls.lfo1dc: pot = this.controls.lfo1.dc; break;
            case psynth.Synth.controls.lfo1fre: pot = this.controls.lfo1.fre; break;
            case psynth.Synth.controls.lfo1wave: pot = this.controls.lfo1.wave; break;

            case psynth.Synth.controls.lfo2fre: pot = this.controls.lfo2.fre; break;
            case psynth.Synth.controls.lfo2dc: pot = this.controls.lfo2.dc; break;
            case psynth.Synth.controls.lfo2amp: pot = this.controls.lfo2.amp; break;
            case psynth.Synth.controls.lfo2wave: pot = this.controls.lfo2.wave; break;

            // ENV
            case psynth.Synth.controls.env1amp: pot = this.controls.env1.amp; break;
            case psynth.Synth.controls.env1dc:  pot = this.controls.env1.dc; break;
            case psynth.Synth.controls.env1atk: pot = this.controls.env1.atk; break;
            case psynth.Synth.controls.env1dec: pot = this.controls.env1.dec; break;
            case psynth.Synth.controls.env1sus: pot = this.controls.env1.sus; break;
            case psynth.Synth.controls.env1rel: pot = this.controls.env1.rel; break;

            case psynth.Synth.controls.env2amp: pot = this.controls.env2.amp; break;
            case psynth.Synth.controls.env2dc:  pot = this.controls.env2.dc; break;
            case psynth.Synth.controls.env2atk: pot = this.controls.env2.atk; break;
            case psynth.Synth.controls.env2dec: pot = this.controls.env2.dec; break;
            case psynth.Synth.controls.env2sus: pot = this.controls.env2.sus; break;
            case psynth.Synth.controls.env2rel: pot = this.controls.env2.rel; break;

            case psynth.Synth.controls.env3amp: pot = this.controls.env3.amp; break;
            case psynth.Synth.controls.env3dc:  pot = this.controls.env3.dc; break;
            case psynth.Synth.controls.env3atk: pot = this.controls.env3.atk; break;
            case psynth.Synth.controls.env3dec: pot = this.controls.env3.dec; break;
            case psynth.Synth.controls.env3sus: pot = this.controls.env3.sus; break;
            case psynth.Synth.controls.env3rel: pot = this.controls.env3.rel; break;

            // OSC
            case psynth.Synth.controls.osc1amp: pot = this.controls.osc1.amp; break;
            case psynth.Synth.controls.osc1dc:  pot = this.controls.osc1.dc; break;
            case psynth.Synth.controls.osc1fre: pot = this.controls.osc1.fre; break;
            case psynth.Synth.controls.osc1note: pot = this.controls.osc1.note; break;
            case psynth.Synth.controls.osc1tune: pot = this.controls.osc1.tune; break;
            case psynth.Synth.controls.osc1psw: pot = this.controls.osc1.psw; break;
            case psynth.Synth.controls.osc1wave: pot = this.controls.osc1.wave; break;

            case psynth.Synth.controls.osc2amp: pot = this.controls.osc2.amp; break;
            case psynth.Synth.controls.osc2dc:  pot = this.controls.osc2.dc; break;
            case psynth.Synth.controls.osc2fre: pot = this.controls.osc2.fre; break;
            case psynth.Synth.controls.osc2note: pot = this.controls.osc2.note; break;
            case psynth.Synth.controls.osc2tune: pot = this.controls.osc2.tune; break;
            case psynth.Synth.controls.osc2psw: pot = this.controls.osc2.psw; break;
            case psynth.Synth.controls.osc2wave: pot = this.controls.osc2.wave; break;

            // FILTER
            case psynth.Synth.controls.flt1amp: pot = this.controls.flt1.amp; break;
            case psynth.Synth.controls.flt1cut:  pot = this.controls.flt1.cut; break;
            case psynth.Synth.controls.flt1res: pot = this.controls.flt1.res; break;
            case psynth.Synth.controls.flt1mod: pot = this.controls.flt1.mod; break;
            case psynth.Synth.controls.flt1mode: pot = this.controls.flt1.mode; break;

            default: console.log('The control id ' + controlId + ' is invalid!'); break
        }
        return pot;
    };
    Synth.prototype.setNote = function(note, velocity) {
        var voice = null;
        if (velocity != 0) {
            // get free voice
            var voice = this.voices[0];
            //var ix = 0;
            for (var i=0; i<this.voices.length; i++) {
                if (voice.getTicks() < this.voices[i].getTicks()) {
                    voice = this.voices[i];
                    //ix = i;
                }
                if (!this.voices[i].isActive()) {
                    voice = this.voices[i];
                    //ix = i;
                    break;
                }
            }
            voice.setNote(note, velocity);
            //this.voices[this.nextVoice].setNote(note, velocity);
            //console.log(`${this.label}.on #${ix}: ${note} - ${voice.getTicks()}`);
            return;
        } else {
            for (var i=0; i<this.voices.length; i++) {
                voice = this.voices[i];
                if (voice.envelopes[0].phase < 5 && voice.note.value == note) {
                    voice.setNote(note, 0);
                    //console.log(`${this.label}.off #${i}: ${note}`);
                    return;
                }
            }
        }
        //console.log(`${this.label}.off ???: ${note}`);
        //throw new Error('voice not found!');
    };
    Synth.prototype.run = function(left, right, start, end) {
        if (this.isActive) {
            for (var i=start; i<end; i++) {
                var smp = 0;
                for (var j=0; j<this.voices.length; j++) {
                    smp += this.voices[j].run(1);
                }
                left[i] += smp;
                right[i] += smp;
            }
            //console.log(buffer[start]);
        }
    };
    Synth.prototype.setProgram = function setProgram(id) {
        var sb = this.soundBank;
        var count = sb.readUint8(0);
        if (id < count) {
            offset = 1 + 16*id;
            // this.selectedProgram = sb.readString(offset);
            offset = sb.readUint16(offset + 14);
            count = sb.readUint8();
            for (var i=0; i<count; i++) {
                var id = sb.readUint8();
                this.getControl(id).setFromStream(sb);
            }
        }
    };

    Synth.prototype.getParameters = function getParameters() {
        return [{
            name: 'amp',
            defaultValue: 0.8,
            minValue: 0,
            maxValue: 1,
            automationRate: 'a-rate'
        }];
    };

    Synth.createControls = function createControls() {
        return {
            amp: new psynth.PotF8(0, 1, .8),
            env1: psynth.Env.createControls(),
            env2: psynth.Env.createControls(),
            env3: psynth.Env.createControls(),
            lfo1: psynth.Osc.createControls(),
            lfo2: psynth.Osc.createControls(),
            osc1: psynth.Osc.createControls(),
            osc2: psynth.Osc.createControls(),
            flt1: psynth.Filter.createControls(),
        };
    };

    Synth.controls = {
        // GENERAL
        amp:       0,

        // LFO
        lfo1amp:  10,
        lfo1dc:   11,
        lfo1fre:  12,
        lfo1wave: 13,

        lfo2amp:  20,
        lfo2dc:   21,
        lfo2fre:  22,
        lfo2wave: 23,

        // env
        env1amp:  30,
        env1dc:   31,
        env1atk:  32,
        env1dec:  33,
        env1sus:  34,
        env1rel:  35,

        env2amp:  40,
        env2dc:   41,
        env2atk:  42,
        env2dec:  43,
        env2sus:  44,
        env2rel:  45,

        env3amp:  70,
        env3dc:   71,
        env3atk:  72,
        env3dec:  73,
        env3sus:  74,
        env3rel:  75,

        // osc
        osc1amp:  50,
        osc1dc:   51,
        osc1fre:  52,
        osc1note: 53,
        osc1tune: 54,
        osc1psw:  55,
        osc1wave: 56,

        osc2amp:  60,
        osc2dc:   61,
        osc2fre:  62,
        osc2note: 63,
        osc2tune: 64,
        osc2psw:  65,
        osc2wave: 66,

        // flt
        flt1amp:  80,
        flt1cut:  81,
        flt1res:  82,
        flt1mod:  84,
        flt1mode: 83
    },

//     publish(Synth, 'Synth', psynth);
    psynth['Synth'] = Synth;
})();

var theta = 0;
var synth = null;
class AudioProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.port.onmessage = msg => {
            //console.log('w:'+new Date().getTime());
            switch (msg.data.code) {
                case 'init':
                    console.log('Initialize');
                    theta = 2*Math.PI/sampleRate;
                    // delta = 0.4/sampleRate;
                    // ampFactor = 4/sampleRate;
                    console.log(`Init: samplint rate = ${sampleRate}, theta = ${theta}`);
                    synth = new psynth.Synth(sampleRate, 1);
                    var data = preset.default;
                    for (var i in data) {
                        var ctrl = getObjectAt(i, synth.controls);
                        ctrl.set(data[i]);
                    }
                    break;
                case 'setControl':
                    synth.getControl(msg.data.id).value = msg.data.value;
                    break;
                case 'setNote':
                    synth.setNote(msg.data.note, msg.data.velocity);
                    break;
            }
        }
    }

    // static get parameterDescriptors() {
    //     return synth.getParameters();
    // }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        var channel = output[0];
        //synth.parameters = parameters;
        synth.run(output[0], output[1], 0, channel.length);
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);