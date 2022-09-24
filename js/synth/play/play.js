/* Play subsystem  */
include('/lib/player/player-adapter-ext.js');
include('/lib/synth/synth-adapter-ext.js');
include('/lib/data/stream.js');

(function() {
    function Play() {
        this.sampleRate = 48000;
        this.bpm = 0;
        this.player = Ps.Player.create();
        DataLink.sync(this.player, 'refreshRate', this, 'bpm',
            v => 3.75*v,
            function(v) { v /= 3.75; this.setRefreshRate(v); return v; }
        );
        this.adapters = {};
        this.state = {};
    }

    Play.prototype.createSynth = function(voiceCount) {
        var initData = new Stream([voiceCount, 1]);
        var synth = this.synthAdapter.createDevice(psynth.SynthAdapter.Device.SYNTH, initData);
        return synth;
    };

    Play.prototype.loadSong = async function loadSong(url, errors) {
        this.player.reset();
        if (url.endsWith('ssng')) {
            var res = await self.load(url);
            if (!res.error) {
                Stream.isLittleEndian = true;
                var results = await this.player.adapter.importScript(res.data);
                for (var i=0; i<results.length; i++) errors.push(new Error(results[i]));
            } else {
                throw res.error;
            }
        } else {
            await this.player.load(url);
        }
        // create adapter map and build state
        this.state = {
            'adapters': []
        };
        for (var i=0; i<this.player.adapters.length; i++) {
            var adapter = this.player.adapters[i].adapter;
            this.adapters[adapter.getInfo().name] = adapter;
            //this.state.adapters[i] = adapter.getState();
        }
        this.synthAdapter = this.player.adapters.find(x => x.adapter.getInfo().id == psynth.SynthAdapter.getInfo().id);
        //iterate(this.synthAdapter.adapter.devices, (ix, sy) => sy.setProgram(0));
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
    Play.prototype.getState = function getState() {
        this.state = {};
        this.state.player = this.player.getState();
    };

    Play.prototype.saveState = function saveState() {
        for (var i=0; i<this.player.adapters.length; i++) {
            var adapter = this.player.adapters[i].adapter;
            this.state.adapters[adapter.getInfo().name] = adapter.getState();
        }
    };

    Play.initialize = async function initialize(app) {
        app.play = new Play();
        Ps.Player.registerAdapter(Ps.PlayerAdapter);
        Ps.Player.registerAdapter(psynth.SynthAdapter);
    };

    publish(Play, 'Play', SynthApp);
})();