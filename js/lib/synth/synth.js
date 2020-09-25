/******************************************************************************
 * PSynth library
 *****************************************************************************/
include('voice.js');
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

    publish(Synth, 'Synth', psynth);
})();
