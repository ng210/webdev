/* Play subsystem  */
include('/lib/player/player-lib.js');
include('/lib/player/player-ext.js');

function Play() {
    this.player = null;
}

Play.prototype.initialize = async function initialize(settings) {
    Ps.Player.registerAdapter(Ps.Player);
    Ps.Player.registerAdapter(psynth.SynthAdapter);
    this.player = Ps.Player.create();
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
    for (var i=0; i<this.player.adapters.length; i++) {
        this.player.adapters[i].adapter.updateRefreshRate(bpm/3.75);
    }
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
