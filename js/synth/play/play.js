/* Play subsystem  */
include('/lib/player/player-ext.js');
include('/lib/synth/synth-adapter-ext.js');
include('/lib/data/stream.js');

(function() {
    function Play() {
        this.sampleRate = 48000;
        this.player = Ps.Player.create();
        this.synthAdapter = null;
    }

    Play.prototype.createSynth = function(voiceCount) {
        var initData = new Stream([voiceCount, 1]);
        var synth = this.synthAdapter.createDevice(psynth.SynthAdapter.Device.SYNTH, initData);
        return synth;
    };

    Play.prototype.loadSong = async function loadSong(url, errors) {
        if (url.endsWith('ssng')) {
            var res = await self.load(url);
            if (!res.error) {
                Stream.isLittleEndian = true;
                var results = await this.player.importScript(res.data);
                for (var i=0; i<results.length; i++) errors.push(new Error(results[i]));
            } else {
                errors.push(res.error);
            }
        } else {
            await this.player.load(url);
        }
        this.synthAdapter = this.player.adapters.find(x => x.adapter.getInfo().id == psynth.SynthAdapter.getInfo().id);        
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

    Play.prototype.start = function start() {
        sound.start();
    };
    Play.prototype.stop = function stop() {
        sound.stop();
    };
    Play.prototype.reset = function reset() {
        this.player.reset();
    };

    Play.initialize = async function initialize(app) {
        app.play = new Play();
        Ps.Player.registerAdapter(Ps.Player);
        Ps.Player.registerAdapter(psynth.SynthAdapter);
    };

    publish(Play, 'Play', SynthApp);
})();