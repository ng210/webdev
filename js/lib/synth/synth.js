/******************************************************************************
 * PSynth library
 *****************************************************************************/
include('voice.js');
(function() {
    /*****************************************************************************/
    function Synth(smpRate, voiceCount) {
        this.smpRate = smpRate;
        this.omega = psynth.theta / smpRate;
        this.isActive = false;
        this.nextVoice = 0;
        this.label = '';
        // create controls
        this.createControls();
        // create voices
        this.voices = [];
        this.setVoiceCount(voiceCount);
        this.soundBank = null;
    }
    Synth.prototype.setVoiceCount = function setVoiceCount(voiceCount) {
        var oldCount = this.voices.length;
        if (oldCount < voiceCount) {
            for (var i=oldCount; i<voiceCount; i++) {
                this.voices.push(new psynth.Voice(this));
            }
        } else {
            this.voices.splice(voiceCount, oldCount - voiceCount);
        }
    };
    Synth.prototype.getControl = function(controlId) {
        var ctrl = this.idToControl[controlId];
        if (!ctrl) console.log('The control id ' + controlId + ' is invalid!');
        return ctrl;
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
    Synth.prototype.setControl = function(controlId, value) {
        this.getControl(controlId).set(value);
        //console.log('setcontrol:', controlId, value);
    };
    Synth.prototype.run = function(left, right, start, end) {
        if (this.isActive) {
            for (var i=start; i<end; i++) {
                var smp = 0;
                for (var j=0; j<this.voices.length; j++) {
                    smp += this.controls.amp.value*this.voices[j].run(1);
                }
                left[i] += smp;
                right[i] += smp;
            }
            //console.log(buffer[start]);
        }
    };
    Synth.prototype.setProgram = function setProgram(id) {
        var sb = this.soundBank;
        this.isActive = true;
        var count = sb.readUint8(0);
        if (id < count) {
            offset = 1 + 16*id;
            // this.selectedProgram = sb.readString(offset);
            offset = sb.readUint16(offset + 14);
            count = sb.readUint8(offset);
            for (var i=0; i<count; i++) {
                var id = sb.readUint8();
                this.getControl(id).setFromStream(sb);
            }
        }
    };

    Synth.prototype.createControls = function createControls() {
        this.controls = {
            amp: new psynth.PotF8(0, 1, .8),
            env1: psynth.Env.createControls(),
            env2: psynth.Env.createControls(),
            env3: psynth.Env.createControls(),
            lfo1: psynth.LFO.createControls(),
            lfo2: psynth.LFO.createControls(),
            osc1: psynth.Osc.createControls(),
            osc2: psynth.Osc.createControls(),
            flt1: psynth.Filter.createControls(),
        };

        this.controls.lfo1.amp.init(0, 1, 0.01);
        this.controls.lfo1.fre.init(0, 1000, 0.1);
        this.controls.lfo2.amp.init(0, 100, 0.1);
        this.controls.lfo2.fre.init(0, 1000, 0.1);
        this.controls.env3.amp.set(1.0);
        this.controls.flt1.mode.init(1, 7, 1);
        this.controls.flt1.cut.set(0.0);

        this.idToControl = [];
        var keys1 = Object.keys(this.controls);
        for (var i=0; i<keys1.length; i++) {
            var key1 = keys1[i];
            var obj = this.controls[key1];
            if (inherits(obj, psynth.PotBase)) {
                this.idToControl.push(obj);
            } else {
                var keys2 = Object.keys(obj);
                for (var j=0; j<keys2.length; j++) {
                    var key2 = keys2[j];
                    if (inherits(obj[key2], psynth.PotBase)) {
                        this.idToControl.push(obj[key2]);
                    }
                }
            }
        }
    };

    Synth.controls = (function() {
        var map = {};
        var synth = new Synth(48000, 1);
        var id = 0;
        var keys1 = Object.keys(synth.controls);
        for (var i=0; i<keys1.length; i++) {
            var key1 = keys1[i];
            var obj = synth.controls[key1];
            if (inherits(obj, psynth.PotBase)) {
                map[key1] = id++;
            } else {
                var keys2 = Object.keys(obj);
                for (var j=0; j<keys2.length; j++) {
                    var key2 = keys2[j];
                    if (inherits(obj[key2], psynth.PotBase)) {
                        map[key1+key2] = id++;
                    }
                }
            }
        }
        return map;
    })();

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

    publish(Synth, 'Synth', psynth);
})();
