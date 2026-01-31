// Hangok egyszerűen WebAudio használatával
export default class SoundManager {

	static freqTable = {
	'C': 32.70, 'C#': 34.65, 'D': 36.71, 'D#': 38.89,
	'E': 41.20, 'F': 43.65, 'F#': 46.25,
	'G': 49.00, 'G#': 51.91, 'A': 55.00, 'A#': 58.27, 'H': 61.74 }

	static pitchTable = [
		/*'C':*/ 32.70, /*'D':*/ 36.71,	/*'E':*/ 41.20,
		/*'F':*/ 43.65, /*'G':*/ 49.00, /*'A':*/ 55.00,
		/*'H':*/ 61.74, /*'C':*/ 65.40
	]

	constructor() {
		this.ctx = null;
		try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
	}

	static getFreq(freq) {
		if (isNaN(freq)) {
			let tone = freq[0]
			let octave = freq[1]
			if (freq[1] == '#') {
				tone += freq[1]
				octave = freq[2]
			}
			octave -= '0';
			freq = SoundManager.freqTable[tone]
			freq *= Math.pow(2, octave)
		}
		return freq
	}

	freq(tone) {
		return SoundManager.getFreq(tone)
	}

	p2f(pitch, range = 1, offset = 0) {
		pitch = BigInt(pitch) % (BigInt(range) * 7n) + BigInt(offset)
		const note = pitch % 7n
		const octave = Number(pitch / 7n)
		const baseFreq = SoundManager.pitchTable[note]
		return Math.pow(2, octave) * baseFreq
	}

	tone(freq, amp = 0.5, length = 0.08, type = 'sine', when = 0) {
		amp += 0.0001;
		if (!this.ctx) return;
		const o = this.ctx.createOscillator();
		const g = this.ctx.createGain();
		o.type = type;
		o.frequency.value = freq;
		o.connect(g); g.connect(this.ctx.destination);
		g.gain.value = 0.0001;
		const t = this.ctx.currentTime + when;
		o.frequency.linearRampToValueAtTime(freq, t + 0.04)
		g.gain.exponentialRampToValueAtTime(amp, t + 0.02);
		o.start(t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + length);
		o.stop(t + length + 0.02);
	}
}