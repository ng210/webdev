/* Play subsystem  */
include('/lib/player/player-lib.js');
include('/lib/player/player-ext.js');
include('/lib/ge/sound.js');
include('/lib/synth/synth.js');
include('/lib/synth/synth-adapter.js');

(function() {
    function Play() {
        this.player = null;

        this.sampleRate = 48000;
    }

    Play.prototype.createSynth = function(voiceCount) {
        return new psynth.Synth(this.sampleRate, voiceCount);
    };

    Play.prototype.load = async function load(url, errors) {
        if (url.endsWith('ssng')) {
            var res = await self.load(url);
            if (!res.error) {
                var results = await this.player.importScript(res.data);
                for (var i=0; i<results.length; i++) errors.push(new Error(results[i]));
            } else {
                errors.push(res.error);
            }
        } else {
            await this.player.load(url);
        }
        
    };

    Play.prototype.setBpm = function setBpm(bpm) {
        this.player.setRefreshRate(bpm/3.75);
    };


    Play.prototype.getAdapters = function getAdapters() {
        return this.player.adapters;
    };

    Play.prototype.getDatablocks = function getDatablocks() {
        return this.player.datablocks;
    };

    Play.prototype.getSequences = function getSequences() {
        return this.player.sequences;
    };

    Play.initialize = async function initialize(app) {
        app.play = new Play();
        Ps.Player.registerAdapter(Ps.Player);
        Ps.Player.registerAdapter(psynth.SynthAdapter);
        this.player = Ps.Player.create();
    };

    publish(Play, 'Play', SynthApp);
})();