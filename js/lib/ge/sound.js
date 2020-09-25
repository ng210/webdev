/*******************************************************************************
 * Streamed sound playback
 ******************************************************************************/
(function(){
    var sound = {
        status: 0,
        context: null,
        audioNode: null,
        smpRate: 0,
        isRunning: false,

        init: function(smpRate, callback) {
            this.smpRate = smpRate || 48000;
            // TODO: if (this.context) delete context/change sampling rate
            this.context = self.AudioContext ? new self.AudioContext() :
                self.webkitAudioContext ? new self.webkitAudioContext() :
                self.mozAudioContext ? new self.mozAudioContext() :
                self.oAudioContext ? new self.oAudioContext() :
                self.msAudioContext ? new self.msAudioContext() :
                undefined;
            if (!this.context) throw new Error('Could not create sound context!');
            this.audioNode = this.context.createScriptProcessor(this.BUFFER_SIZE, 0, 2);
            this.audioNode.onaudioprocess = function(audioProcessingEvent) {
                var outputBuffer = audioProcessingEvent.outputBuffer;
                var left = outputBuffer.getChannelData(0);
                var right = outputBuffer.getChannelData(1);
                sound.fillBuffer(left, right, outputBuffer.length, 0);
            };
            this.fillBuffer = callback || function(buffer, count) {};
            this.audioNode.connect(this.context.destination);
            this.context.suspend();
        },

        start: function() {
            this.context.resume();
            this.isRunning = true;
        },
        stop: function() {
            this.context.suspend();
            this.isRunning = false;
        }
    };
    publish(sound, 'sound');
})();