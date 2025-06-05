/*******************************************************************************
 * Streamed sound playback
 ******************************************************************************/
export default class Sound {
    #context = null;
    #audioNode = null;
    #sampleRate = 0;
    isRunning = false;
    #fillBuffer = null;
    get BUFFER_SIZE() {
        return 1024;
    }

    constructor(smpRate, callback) {
        this.#sampleRate = smpRate || 48000;
        // TODO: if (this.context) delete context/change sampling rate
        let o = {
            sampleRate: smpRate
        };
        this.#context = self.AudioContext ? new self.AudioContext(o) :
            self.webkitAudioContext ? new self.webkitAudioContext(o) :
            self.mozAudioContext ? new self.mozAudioContext(o) :
            self.oAudioContext ? new self.oAudioContext(o) :
            self.msAudioContext ? new self.msAudioContext(o) :
            undefined;
        if (!this.#context) throw new Error('Could not create sound context!');
        this.#audioNode = this.#context.createScriptProcessor(this.BUFFER_SIZE, 0, 2);
        this.#audioNode.onaudioprocess = audioProcessingEvent => this.onaudioprocess(audioProcessingEvent);
        this.#fillBuffer = callback || function(left, right, count, offset) {};
        this.#audioNode.connect(this.#context.destination);
        this.#context.suspend();
    }

    onaudioprocess(audioProcessingEvent) {
        let outputBuffer = audioProcessingEvent.outputBuffer;
        let left = outputBuffer.getChannelData(0);
        let right = outputBuffer.getChannelData(1);
        this.#fillBuffer(left, right, outputBuffer.length, 0);
    }

    start() {
        this.#context.resume();
        this.isRunning = true;
    }

    stop() {
        this.#context.suspend();
        this.isRunning = false;
    }
}