var psynth = {};

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

function addParameters(parameters, controls, offset, prefix) {
    for (var id in controls) {
        var control = controls[id];
        parameters[offset] = {
            name: offset,
            label: `${prefix}${id}`,
            defaultValue: control.value,
            minValue: control.min,
            maxValue: control.max,
            automationRate: 'a-rate'
        };
        offset++;
    }
}

function controlIds(obj, prefix) {
    var arr = [];
    for (var i in obj.controls) {
        arr.push(prefix+i);
    }
    return arr;
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
    function Env(parent, ix) {
        this.parent = parent;
        this.ix = ix;
        this.gate = 0;
        this.velocity = 0;
        this.phase = psynth.Env.phase.IDLE;
        this.timer = 0;
        this.ticks = 0;
        this.rate = 0;
    }

    Env.prototype = {
        get amp() { return this.parent.parameters[this.ix][0]; },
        get dc() { return this.parent.parameters[this.ix+1][0]; },
        get atk() { return this.parent.parameters[this.ix+2][0]; },
        get dec() { return this.parent.parameters[this.ix+3][0]; },
        get sus() { return this.parent.parameters[this.ix+4][0]; },
        get rel() { return this.parent.parameters[this.ix+5][0]; }
    };

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
                this.timer = this.sus;
                this.gate = 0;
            }
        }
    };

    // Env.prototype.slopeUp = function slopeUp() {
    //     // slope up: retrigger envelope
    //     this.phase = psynth.Env.phase.UP;
    //     this.timer = 0;
    //     this.ticks = 0;
    // };
    // Env.prototype.slopeDown = function slopeDown() {
    //     // slope down: start release phase
    //     this.phase = psynth.Env.phase.DOWN;
    //     this.timer = this.sus;
    // };

    Env.prototype.run = function run(am) {
        switch (this.phase) {
            case Env.phase.UP: // atk precalc
                // 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
                // 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate = 4/smpRate
                //   X : Xs -> 1/(3.995*X + 0.005)/smpRate
                this.rate = 1/(this.parent.smpRate * (3.995 * this.atk + 0.005));
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
                this.rate = 1/(this.parent.smpRate * (3.995 * this.dec + 0.005));
                this.phase++;
            case Env.phase.SUS: // dec/sustain
                if (this.timer <= this.sus) {
                    this.timer = this.sus;
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
                this.rate = 1/(this.parent.smpRate * (9.995 * this.rel + 0.005));
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
        var out = this.amp*am*this.timer*this.velocity + this.dc;
        return out;
    };

    Env.controls = {
        'amp': new psynth.PotF32(0, 1, .5),
        'dc':  new psynth.PotF32(0, 1, .5),
        'atk': new psynth.PotF8(0, 1, .5),
        'dec': new psynth.PotF8(0, 1, .5),
        'sus': new psynth.PotF8(0, 1, .5),
        'rel': new psynth.PotF8(0, 1, .5)
    };

    Env.addParameters = function(parameters, offset, prefix) {
        addParameters(parameters, Env.controls, offset, prefix);
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
/* synth\osc.js **************************************************************/
// include('input.js');
(function() {
    function Osc(voice, ix) {
        this.voice = voice;
        this.parent = voice.parent;
        this.ix = ix;
        this.reset();
    }
    Osc.prototype = {
        get amp() { return this.parent.parameters[this.ix][0]; },
        get dc() { return this.parent.parameters[this.ix+1][0]; },
        get fre() { return this.parent.parameters[this.ix+2][0]; },
        get note() { return this.voice.note; },
        get tune() { return this.parent.parameters[this.ix+3][0]; },
        get psw() { return this.parent.parameters[this.ix+4][0]; },
        get wave() { return this.parent.parameters[this.ix+5][0]; }
    };

    Osc.prototype.reset = function reset() {
        this.timer = 0;
        this.smp = 0;
    };

    Osc.prototype.run = function run(am, fm, pm) {
        var pitch = this.note + this.tune;
        var delta = (this.fre + fm + psynth.p2f(pitch))/this.parent.smpRate;
        if (delta >= 1.0) {
            delta = 0.99999999;
        }
        var psw = pm + this.psw;
        var out = 0.0;
        var wf = this.wave;
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
        return this.amp*am*out + this.dc;
    };

    Osc.controls = {
        amp: new psynth.PotF32(0, 100, 1.0),
        dc:  new psynth.PotF32(0, 100, .0),
        fre: new psynth.PotF32(0, 1000, .5),
        tune: new psynth.Pot(0, 24, .0),
        psw: new psynth.PotF8(0, 1, .5),
        wave: new psynth.Pot(0, 127, 1),
    };

    Osc.addParameters = function(parameters, offset, prefix) {
        addParameters(parameters, Osc.controls, offset, prefix);
    };

    Osc.waveforms = {
        NONE:      0,
        SINUS:     1,
        TRIANGLE:  2,
        SAW:       4,
        PULSE:     8,
        NOISE:    16
    };

    function LFO(voice, ix) {
        Osc.call(this, voice, ix);
    }

    LFO.prototype = new Osc({}, 0);

    LFO.prototype.run = function run() {
        var delta = this.fre/this.parent.smpRate;
        if (delta >= 1.0) {
            delta = 0.99999999;
        }

        var out = 0.0;

        var arg = psynth.theta * this.timer;
        out += Math.sin(arg);

        // var tmp = (this.timer <= psw) ? this.timer/psw : (1.0 - this.timer)/(1.0 - psw);
        // out += 2*tmp - 1.0;

        if ((this.timer += delta) > 1.0) {
            this.timer -= 1.0;
        }
        return this.amp*out + this.dc;
    };


    LFO.controls = {
        amp: new psynth.PotF32(0, 100, 1.0),
        dc:  new psynth.PotF32(0, 100, .0),
        fre: new psynth.PotF32(0, 1000, .5)
    };

    LFO.addParameters = function(parameters, offset, prefix) {
        addParameters(parameters, LFO.controls, offset, prefix);
    };

//     publish(Osc, 'Osc', psynth);
    psynth['Osc'] = Osc;
    psynth['LFO'] = LFO;
})();
/* synth\filter.js ***********************************************************/
// include('input.js');
(function() {
    function Filter(parent, ix) {
        this.parent = parent;
        this.ix = ix;
        this.ai = [.0, .0, .0];
        this.bi = [.0, .0, .0];
        this.ci = [.0, .0, .0];
        this.ui = [.0, .0, .0];
        this.vi = [.0, .0, .0];

        this.lp = [.0, .0];
        this.hp = [.0, .0];
    }
    
    Filter.prototype = {
        get amp() { return this.parent.parameters[this.ix][0]; },
        get cut() { return this.parent.parameters[this.ix+1][0]; },
        get res() { return this.parent.parameters[this.ix+2][0]; },
        get mod() { return this.parent.parameters[this.ix+3][0]; },
        get mode() { return this.parent.parameters[this.ix+4][0]; }
    };

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
        if ((this.mode & psynth.Filter.modes.LOWPASS) != 0)
            output += lp;
        if ((this.mode & psynth.Filter.modes.HIGHPASS) != 0)
            output += hp;
        if ((this.mode & psynth.Filter.modes.BANDPASS) != 0) {
            output += input - hp - lp;
            gain *= 1.5;
        }
        return gain * output;
    };
    Filter.prototype.onchange = function onchange(cut) {
        // Update filter coefficients
        var res = (this.res < 0.000001) ? 1.0: 1.0 - this.res;
        var e = (this.cut + this.mod * cut)/2;
        var g = -res * e;
        var b0 = e*e;
        this.bi[0] = this.bi[1] = b0; this.bi[2] = 2*b0;
        this.ci[0] = this.ci[2] = 1; this.ci[1] = -2;
        this.ai[0] = b0 + 1.0 - g;
        this.ai[2] = b0 + 1.0 + g;
        this.ai[1] = 2*(b0 - 1);

    };

    Filter.controls = {
        amp: new psynth.PotF32(0, 1, .5),
        cut:  new psynth.PotF32(0, 1, .1),
        res: new psynth.PotF8(0, 1, .2),
        mod: new psynth.PotF8(0, 1, .0),
        mode: new psynth.Pot(0, 7, 1)
    };

    Filter.modes = {
        NONE:       0,
        LOWPASS:    1,
        BANDPASS:   2,
        HIGHPASS:   4
    };

    Filter.addParameters = function(parameters, offset, prefix) {
        addParameters(parameters, Filter.controls, offset, prefix);
    };

//     publish(Filter, 'Filter', psynth);
    psynth['Filter'] = Filter;
})();
/* synth\voice.js ************************************************************/
// include('env.js')
// include('osc.js')
// include('filter.js')
(function() {
    function Voice(parent, ix) {
        this.parent = parent;
        this.ix = ix;
        this.velocity = 0;  //new psynth.Pot(0, 1, 0);
        this.note = 0;  //new psynth.Pot(0, 127, 0);
        // create a basic synth with 2 oscillators and 2 envelopes for AM
        ix += 1 + 2*16;
        this.lfos = [];
        this.lfos.push(new psynth.LFO(this, ix)); ix += Object.keys(psynth.LFO.controls).length;
        this.lfos.push(new psynth.LFO(this, ix)); ix += Object.keys(psynth.LFO.controls).length;

        this.envelopes = [];
        this.envelopes.push(new psynth.Env(parent, ix)); ix += Object.keys(psynth.Env.controls).length;
        this.envelopes.push(new psynth.Env(parent, ix)); ix += Object.keys(psynth.Env.controls).length;
        this.envelopes.push(new psynth.Env(parent, ix)); ix += Object.keys(psynth.Env.controls).length;
        
        this.oscillators = [];
        this.oscillators.push(new psynth.Osc(this, ix)); ix += Object.keys(psynth.Osc.controls).length;
        this.oscillators.push(new psynth.Osc(this, ix)); ix += Object.keys(psynth.Osc.controls).length;

        this.filter = new psynth.Filter(parent, ix);
    }

    Voice.prototype.setNote = function(note, velocity) {
        this.note = note;
        for (var i=0; i<this.lfos.length; i++) {
            this.lfos[i].timer = 0;
        }
        for (var i=0; i<this.envelopes.length; i++) {
            this.envelopes[i].setGate(velocity);
        }
    };
    Voice.prototype.run = function(i) {
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
    function Synth(smpRate, voiceCount, ix) {
        this.ix = ix;
        this.smpRate = smpRate;
        this.omega = psynth.theta / smpRate;
        this.isActive = true;
        this.nextVoice = 0;
        this.label = '';
        this.gate = 0;
        // create controls
        //this.controls = psynth.Synth.createControls();
        this.velocity = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
        // create voices
        this.voices = [];
        for (var i=0; i<voiceCount; i++) {
            this.voices.push(new psynth.Voice(this, ix));
        }
        this.soundBank = null;
    }

    // Synth.prototype.setup = function(values) {
    //     for (var i=0; i<values.length; i+=2) {
    //         var ctrlId = values[i];
    //         var key = Object.keys(psynth.Synth.controls).find(
    //             function(k) {
    //                 return psynth.Synth.controls[k] == ctrlId;
    //             }
    //         );
    //         if (key === undefined) {
    //             console.log('No control with the id ' + ctrlId + ' was found!');
    //         }
    //         this.getControl(values[i]).value = values[i+1];
    //     }
    // };
    
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
            return;
        } else {
            for (var i=0; i<this.voices.length; i++) {
                voice = this.voices[i];
                if (voice.envelopes[0].phase < 5 && voice.note == note) {
                    voice.setNote(note, 0);
                    return;
                }
            }
        }
        //throw new Error('voice not found!');
    };
    Synth.prototype.run = function(left, right, start, end) {
        if (this.isActive) {
            for (var i=start; i<end; i++) {
                var smp = 0;
                // check gate on/off events
                for (var j=0; j<16; j++) {
                    var p1 = this.parameters[psynth.Synth.controlMap.velocity0+j];
                    var p2 = this.parameters[psynth.Synth.controlMap.note0+j];
                    var v = p1.length == 1 ? p1[0] : p1[i];
                    var n = p2.length == 1 ? p2[0] : p2[i];
                    if (this.velocity[j] != v) {
                        this.setNote(n, v);
                        this.velocity[j] = v;
                    }
                }

                for (var j=0; j<this.voices.length; j++) {
                    smp += this.voices[j].run(i);
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

    Synth.controlIds = (function() {
        var arr = ['amp'];
        for (var i=0; i<16; i++) arr.push('note'+i);
        for (var i=0; i<16; i++) arr.push('velocity'+i);
        arr.push(...controlIds(psynth.LFO, 'lfo1'));
        arr.push(...controlIds(psynth.LFO, 'lfo2'));
        arr.push(...controlIds(psynth.Env, 'env1'));
        arr.push(...controlIds(psynth.Env, 'env2'));
        arr.push(...controlIds(psynth.Env, 'env3'));
        arr.push(...controlIds(psynth.Osc, 'osc1'));
        arr.push(...controlIds(psynth.Osc, 'osc2'));
        arr.push(...controlIds(psynth.Filter, 'flt1'));
        return arr;
    })();

    Synth.controlMap = (function() {
        var map = {};
        for (var i=0; i<Synth.controlIds.length; i++) {
            map[Synth.controlIds[i]] = i;
        }
        return map;
    })();

    Synth.addParameters = function addParameters(parameters, ix) {
        var offset = ix * Synth.controlIds.length;
        parameters[offset] = {
            name: offset, label: `synth${ix}amp`, automationRate: 'a-rate',
            defaultValue: 0.0, minValue: 0, maxValue: 1
        };
        offset++;
        for (var i=0; i<16; i++) {
            parameters[offset] = {
                name: offset, label: `synth${ix}note${i}`, automationRate: 'a-rate',
                defaultValue: 0, minValue: 0, maxValue: 127
            };
            parameters[offset+16] = {
                name: offset+16, label: `synth${ix}velocity${i}`, automationRate: 'a-rate',
                defaultValue: 0.0, minValue: 0, maxValue: 1
            };
            offset++;
        }
        offset += 16;

        // LFO
        psynth.LFO.addParameters(parameters, offset, `synth${ix}lfo1`);
        offset += Object.keys(psynth.LFO.controls).length;
        psynth.LFO.addParameters(parameters, offset, `synth${ix}lfo2`);
        offset += Object.keys(psynth.LFO.controls).length;
        // ENV
        psynth.Env.addParameters(parameters, offset, `synth${ix}env1`);
        offset += Object.keys(psynth.Env.controls).length;
        psynth.Env.addParameters(parameters, offset, `synth${ix}env2`);
        offset += Object.keys(psynth.Env.controls).length;
        psynth.Env.addParameters(parameters, offset, `synth${ix}env3`);
        offset += Object.keys(psynth.Env.controls).length;
        // OSC
        psynth.Osc.addParameters(parameters, offset, `synth${ix}osc1`);
        offset += Object.keys(psynth.Osc.controls).length;
        psynth.Osc.addParameters(parameters, offset, `synth${ix}osc2`);
        offset += Object.keys(psynth.Osc.controls).length;
        // FLT
        psynth.Filter.addParameters(parameters, offset, `synth${ix}flt1`);
        offset += Object.keys(psynth.Filter.controls).length;
    };

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
                    synth = new psynth.Synth(sampleRate, 1, 0);
                    break;
                // case 'setControl':
                //     synth.getControl(msg.data.id).value = msg.data.value;
                //     break;
                // case 'setNote':
                //     synth.setNote(msg.data.note, msg.data.velocity);
                //     break;
            }
        }
    }

    static get parameterDescriptors() {
        var parameters = [];
        for (var i=0; i<3; i++) {
            psynth.Synth.addParameters(parameters, i);
        }
        console.log(JSON.stringify(parameters.map(x => `'${x.label}':${x.name},`)));
        return parameters;
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        var channel = output[0];
        synth.parameters = parameters;
        synth.run(output[0], output[1], 0, channel.length);
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);