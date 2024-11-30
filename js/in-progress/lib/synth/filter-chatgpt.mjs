import fs from 'node:fs';

class IIRFilter {
    constructor(type, order, cutoff, sampleRate) {
        this.type = type;
        this.order = order;
        this.cutoff = cutoff;
        this.sampleRate = sampleRate;

        // Compute normalized frequency
        let nyquist = 0.5 * sampleRate;
        let normalizedCutoff = cutoff / nyquist;

        // Compute filter coefficients using Butterworth approximation
        this.a = [];
        this.b = [];
        this.computeCoefficients(normalizedCutoff);
    }

    computeCoefficients(normalizedCutoff) {
        let poles = this.order;
        let theta = Math.PI * normalizedCutoff;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        let alpha = sinTheta / (2.0 * Math.sqrt(2)); // Butterworth filter

        this.b[0] = 1 - cosTheta;
        this.b[1] = this.type === 'lowpass' ? this.b[0] : -this.b[0];
        this.b[2] = 0;

        this.a[0] = 1 + alpha;
        this.a[1] = -2 * cosTheta;
        this.a[2] = 1 - alpha;

        // Normalize coefficients
        for (let i = 0; i < this.b.length; i++) {
            this.b[i] /= this.a[0];
        }
        for (let i = 1; i < this.a.length; i++) {
            this.a[i] /= this.a[0];
        }
        this.a[0] = 1;
    }

    filter(signal) {
        let output = new Float32Array(signal.length).fill(0.0);
        for (let n = 2; n < signal.length; n++) {
            output[n] = this.b[0] * signal[n] + this.b[1] * signal[n - 1] + this.b[2] * signal[n - 2]
                        - this.a[1] * output[n - 1] - this.a[2] * output[n - 2];
        }
        return output;
    }
}

// Example usage
let sampleRate = 44100; // 44.1 kHz sample rate
let cutoffFrequency = 1000; // 1 kHz cutoff frequency
let order = 2; // 2nd order filter
let type = 'lowpass'; // Lowpass filter

// Create the filter
let filter = new IIRFilter(type, order, cutoffFrequency, sampleRate);

// Example input signal (sine wave + noise)
let inputSignal = new Float32Array(44100).fill(0).map((_, i) => Math.sin(2 * Math.PI * 110 * i / sampleRate) + Math.random() * 0.1);

// Apply the filter
let outputSignal = filter.filter(inputSignal);

// Output signal can now be used or saved
fs.writeFileSync('sample-in.smp', inputSignal);
fs.writeFileSync('sample-out.smp', outputSignal);