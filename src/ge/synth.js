/******************************************************************************
 * PSynth library
 *****************************************************************************/
(function() {

	var ns_synth = {

		WF_NONE: 0,
		WF_SIN:  1,
		WF_TRI:  2,
		WF_SAW:  4,
		WF_PLS:  8,
		WF_RND: 16,

		Ctrl: {
			// GENERAL
			amp: 	  1,	// master amplification

			// LFO
			Lfo1fre: 10,
			Lfo1amp: 11,
			Lfo1wav: 12,

			Lfo2fre: 20,
			Lfo2amp: 21,
			Lfo2wav: 22,

			// ENV
			Env1atk: 30,	// attack of envelope #1
			Env1dec: 31,	// decay of envelope #1
			Env1sus: 32,	// sustain of envelope #1
			Env1rel: 33,	// release of envelope #1
			Env1off: 34,	// offset of envelope #1
			Env1amp: 35,	// amplification of envelope #1

			Env2atk: 40,	// attack of envelope #2
			Env2dec: 41,	// decay of envelope #2
			Env2sus: 42,	// sustain of envelope #2
			Env2rel: 43,	// release of envelope #2
			Env2off: 44,	// offset of envelope #2
			Env2amp: 45,	// amplification of envelope #2

			Osc1fre: 50,	// frequency of oscillator #1
			Osc1amp: 51,	// amplitude of oscillator #1
			Osc1psw: 52,	// pulse width of oscillator #1
			Osc1wav: 53,	// waveform of oscillator #1
			Osc1tun: 54,	// tune of oscillator #1

			Osc2fre: 60,	// frequency of oscillator #2
			Osc2amp: 61,	// amplitude of oscillator #2
			Osc2psw: 62,	// pulse width of oscillator #2
			Osc2wav: 63,	// waveform of oscillator #2
			Osc2tun: 64		// tune of oscillator #2
		},

		theta: 2 * Math.PI,

		p2f: function(p) {
			// c = pow(2, 1/12); f = pow(c, pitch)*ref_freq
			var f = ((p == 0) ? 0.0 : (Math.pow(1.05946309436, p) * 20.60172230705));
			return f;
		},

		/******************************************************************************
		 * Prototype of an envelope generator
		 *****************************************************************************/
		Env: function(parent) {
			this.parent = parent;
			this.gate = 0;
			this.phase = 0;
			this.timer = 0;

			this.atk = 0;
			this.dec = 0;
			this.sus = 0;
			this.rel = 0;
			this.off = 0;
			this.amp = 1;
		},

		/******************************************************************************
		 * Prototype of an oscillator
		 *****************************************************************************/
		Osc: function(parent) {
			this.parent = parent;
			this.timer = 0;
			this.fre = 0;
			this.note = 0;
			this.tune = 0;
			this.psw = 0;
			this.wave = ns_synth.WF_NONE;
			this.smp = 0;
		},

		/******************************************************************************
		 * Prototype of a simple software synth
		 *****************************************************************************/
		Synth: function(smpRate) {
			this.smpRate = smpRate;
			this.amp = 1;
			this.note = 0;
			this.gate = 0;
			this.lfos = [];
			this.envelopes = [];
			this.oscillators = [];
			this.omega = ns_synth.theta / smpRate;
		}
	};

	ns_synth.Env.prototype.setGate = function(v) {
		if (this.gate == 0) {
			if (v > 0) {
				// slope up: retrigger envelope
				this.phase = 1;
				this.timer = 0;
				this.gate = 1;
			}			
		} else {
			if (v <= 0) {
				// slope down: start release phase
				this.phase = 4;
				this.timer = this.sus;
				this.gate = 0;
			}
		}
	};
	ns_synth.Env.prototype.run = function(am) {
		var smp = 0;
		var rate = 0;
		
		if (this.phase > 0) {
			
			switch (this.phase) {
				case 1:	// atk
						// 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
						// 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate
						//   X : Xs -> 1/(3.995*X + 0.005)/smpRate
					rate = 1/(this.parent.smpRate * (3.995 * this.atk + 0.005));
					this.timer += rate;
					if (this.timer >= 1.0) {
						this.phase++;
						this.timer = 1.0;
					}
					smp = this.timer;
					//smp = smooth(this.timer);
					break;
				case 2:	// dec/sustain
						// 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
						// 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate
						//   X : Xs -> 1/(3.995*X + 0.005)/smpRate
					if (this.timer <= this.sus) {
						this.timer = this.sus;
					} else {
						rate = 1/(this.parent.smpRate * (3.995 * this.dec + 0.005));
						this.timer -= rate;
						//var susm1 = 1- this.sus;
						//smp = susm1*smooth((this.timer-this.sus)/susm1) + this.sus;
					}
					smp = this.timer;
					break;
				case 4:	// rel
						// 0.0 :  0.005s -> 1/(0*9.995 + 0.005)/smpRate = 200/smpRate
						// 1.0 : 10.0s -> 1/(1*9.995 + 0.005)/smpRate
						//   X :  Xs -> 1/(9.995*X + 0.005)/smpRate
					rate = 1/(this.parent.smpRate * (9.995 * this.rel + 0.005));
					this.timer -= rate;
					if (this.timer <= 0.0) {
						this.phase = 0;	// set to idle
						this.timer = 0.0;
					}
					smp = this.timer;
					//smp = this.sus*smooth(this.timer/this.sus);
					break;
			}
		}
		return am*smp;
	};

	ns_synth.Osc.prototype.run = function(am, fm, pm) {
		var pitch = this.note + this.tune;
		var delta = (this.fre + fm + ns_synth.p2f(pitch))/this.parent.smpRate;
		if (delta >= 1.0) {
			delta = 0.99999999;
		}
		var psw = pm + this.psw;
		var out = 0.0;
		var wf = this.wave;
		var wfc = 0;
		if ((wf & ns_synth.WF_SIN) != 0) {
			var arg = ns_synth.theta * this.timer;
			out += Math.sin(arg);
			wfc++;
		}
		if ((wf & ns_synth.WF_TRI) != 0) {
			var tmp = ((this.timer < psw) ? this.timer/psw : (1.0 - this.timer)/(1.0 - psw));
			out += 2*tmp - 1.0;
			wfc++;
		}
		if ((wf & ns_synth.WF_SAW) != 0) {
			out += ((this.timer < psw) ? 2.0 * this.timer/psw : 0.0);
			out -= 1.0;
			wfc++;
		}
		if ((wf & ns_synth.WF_PLS) != 0) {
			out += this.timer < psw ? 1.0 : -1.0;
			wfc++;
		}
		if ((wf & ns_synth.WF_RND) != 0) {
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
		return this.amp*am*out;
	};

	ns_synth.Synth.prototype.setup = function(values) {
		// create a basic synth with 2 oscillators and 2 envelopes for AM
		this.envelopes.push(new ns_synth.Env(this));
		this.envelopes.push(new ns_synth.Env(this));
		this.lfos.push(new ns_synth.Osc(this));
		this.lfos.push(new ns_synth.Osc(this));
		this.oscillators.push(new ns_synth.Osc(this));
		this.oscillators.push(new ns_synth.Osc(this));
		for (var i=0; i<values.length; i+=2) {
			this.setControl(values[i], values[i+1]);
		}
	};

	ns_synth.Synth.prototype.getControl = function(controlId) {
		var value = 0;
		switch (controlId) {
			case ns_synth.Ctrl.amp: this.amp = value; break;
		
			case ns_synth.Ctrl.Lfo1fre: value = this.lfos[0].fre; break;
			case ns_synth.Ctrl.Lfo1amp: value = this.lfos[0].amp; break;
			case ns_synth.Ctrl.Lfo1wav: value = this.lfos[0].wave; break;
			case ns_synth.Ctrl.Lfo2fre: value = this.lfos[1].fre; break;
			case ns_synth.Ctrl.Lfo2amp: value = this.lfos[1].amp; break;
			case ns_synth.Ctrl.Lfo2wav: value = this.lfos[1].wave; break;
		
			case ns_synth.Ctrl.Env1atk: value = this.envelopes[0].atk; break;
			case ns_synth.Ctrl.Env1dec: value = this.envelopes[0].dec; break;
			case ns_synth.Ctrl.Env1sus: value = this.envelopes[0].sus; break;
			case ns_synth.Ctrl.Env1rel: value = this.envelopes[0].rel; break;
			case ns_synth.Ctrl.Env1amp: value = this.envelopes[0].amp; break;
			case ns_synth.Ctrl.Env1off: value = this.envelopes[0].off; break;

			case ns_synth.Ctrl.Env2atk: value = this.envelopes[1].atk; break;
			case ns_synth.Ctrl.Env2dec: value = this.envelopes[1].dec; break;
			case ns_synth.Ctrl.Env2sus: value = this.envelopes[1].sus; break;
			case ns_synth.Ctrl.Env2rel: value = this.envelopes[1].rel; break;
			case ns_synth.Ctrl.Env2amp: value = this.envelopes[1].amp; break;
			case ns_synth.Ctrl.Env2off: value = this.envelopes[1].off; break;

			case ns_synth.Ctrl.Osc1fre: value = this.oscillators[0].fre; break;
			case ns_synth.Ctrl.Osc1amp: value = this.oscillators[0].amp; break;
			case ns_synth.Ctrl.Osc1psw: value = this.oscillators[0].psw; break;
			case ns_synth.Ctrl.Osc1wav: value = this.oscillators[0].wave; break;
			case ns_synth.Ctrl.Osc1tun: value = this.oscillators[0].tune; break;

			case ns_synth.Ctrl.Osc2fre: value = this.oscillators[1].fre; break;
			case ns_synth.Ctrl.Osc2amp: value = this.oscillators[1].amp; break;
			case ns_synth.Ctrl.Osc2psw: value = this.oscillators[1].psw; break;
			case ns_synth.Ctrl.Osc2wav: value = this.oscillators[1].wave; break;
			case ns_synth.Ctrl.Osc2tun: value = this.oscillators[1].tune; break;
		}
		return value;
	};

	ns_synth.Synth.prototype.setControl = function(controlId, value) {
		switch (controlId) {
			case ns_synth.Ctrl.amp: this.amp = value; break;
		
			case ns_synth.Ctrl.Lfo1fre: this.lfos[0].fre = value; break;
			case ns_synth.Ctrl.Lfo1amp: this.lfos[0].amp = value; break;
			case ns_synth.Ctrl.Lfo1wav: this.lfos[0].wave = value; break;
			case ns_synth.Ctrl.Lfo2fre: this.lfos[1].fre = value; break;
			case ns_synth.Ctrl.Lfo2amp: this.lfos[1].amp = value; break;
			case ns_synth.Ctrl.Lfo2wav: this.lfos[1].wave = value; break;
		
			case ns_synth.Ctrl.Env1atk: this.envelopes[0].atk = value; break;
			case ns_synth.Ctrl.Env1dec: this.envelopes[0].dec = value; break;
			case ns_synth.Ctrl.Env1sus: this.envelopes[0].sus = value; break;
			case ns_synth.Ctrl.Env1rel: this.envelopes[0].rel = value; break;
			case ns_synth.Ctrl.Env1amp: this.envelopes[0].amp = value; break;
			case ns_synth.Ctrl.Env1off: this.envelopes[0].off = value; break;

			case ns_synth.Ctrl.Env2atk: this.envelopes[1].atk = value; break;
			case ns_synth.Ctrl.Env2dec: this.envelopes[1].dec = value; break;
			case ns_synth.Ctrl.Env2sus: this.envelopes[1].sus = value; break;
			case ns_synth.Ctrl.Env2rel: this.envelopes[1].rel = value; break;
			case ns_synth.Ctrl.Env2amp: this.envelopes[1].amp = value; break;
			case ns_synth.Ctrl.Env2off: this.envelopes[1].off = value; break;

			case ns_synth.Ctrl.Osc1fre: this.oscillators[0].fre = value; break;
			case ns_synth.Ctrl.Osc1amp: this.oscillators[0].amp = value; break;
			case ns_synth.Ctrl.Osc1psw: this.oscillators[0].psw = value; break;
			case ns_synth.Ctrl.Osc1wav: this.oscillators[0].wave = value; break;
			case ns_synth.Ctrl.Osc1tun: this.oscillators[0].tune = value; break;

			case ns_synth.Ctrl.Osc2fre: this.oscillators[1].fre = value; break;
			case ns_synth.Ctrl.Osc2amp: this.oscillators[1].amp = value; break;
			case ns_synth.Ctrl.Osc2psw: this.oscillators[1].psw = value; break;
			case ns_synth.Ctrl.Osc2wav: this.oscillators[1].wave = value; break;
			case ns_synth.Ctrl.Osc2tun: this.oscillators[1].tune = value; break;
		}
	};
	ns_synth.Synth.prototype.setNote = function(note, velocity) {
		for (var i=0; i<this.oscillators.length; i++) {
			this.oscillators[i].note = note;
		}
		for (var i=0; i<this.envelopes.length; i++) {
			this.envelopes[i].setGate(velocity);
		}
	};

	ns_synth.Synth.prototype.run = function(buffer, start, end) {
		for (var i=start; i<end; i++) {
			// run LFOs
			var lfo1 = 1.0;	//1.0 - this.lfos[0].amp + (this.lfos[0].amp + this.lfos[0].run(1.0, 0.0, 0.0))/2;
			var lfo2 = this.lfos[1].run(1.0, 0.0, 0.0);
			// // run main oscillators
			var amp = this.envelopes[0].run(lfo1);
			var psw = 0.0;	//this.envelopes[1].run(1.0);
			var smp1 = this.oscillators[0].run(amp, lfo2, psw);
			var smp2 = this.oscillators[1].run(amp, lfo2, psw);
			buffer[i] = smp1 + smp2;
		}
	};

	module.exports = ns_synth;
})();
