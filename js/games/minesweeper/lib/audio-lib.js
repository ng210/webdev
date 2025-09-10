class Channel {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.panning = audioContext.createStereoPanner();
        this.volume = audioContext.createGain();
        this.panning.connect(this.volume);
        this.volume.connect(this.audioContext.destination);
    }

    play(buffer, volume, panning, detune) {
        var source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.detune.value = detune;
        this.panning.pan.value = panning;
        this.volume.gain.value = volume;
        source.connect(this.panning);
        source.start(0);
    }
}

class AudioLib {
    constructor(maxChannelCount) {
        this.audioContext = new AudioContext();
        this.samples = {};
        this.maxChannelCount = maxChannelCount || 2;
        this.channels = new Array(this.maxChannelCount);
        for (var ci=0; ci<this.maxChannelCount; ci++) {
            this.channels[ci] = new Channel(this.audioContext);
            
        }
        this.currentChannelId = 0;
    }

    async loadSamples(map) {
        var res = [];
        for (var id in map) {
            res.push(this.loadSample(id, map[id]));
        }
        await Promise.all(res);
    }

    async loadSample(id, url) {
        var resp = await fetch(url);
        var buffer = await resp.arrayBuffer();
        this.samples[id] = await this.audioContext.decodeAudioData(buffer);
    }

    playSample(id, volume, panning, detune) {
        var ch = this.channels[this.currentChannelId];
        this.currentChannelId = (this.currentChannelId + 1) % this.maxChannelCount;
        ch.play(this.samples[id], volume || 0.5, panning || 0.0, detune || 0.0);
    }
}

export { AudioLib }