/* Play subsystem
 *
 *
 * 
 * 
 */
include('/lib/player/player-lib.js');

function Play() {
    this.player = null;
}

Play.prototype.initialize = async function initialize(settings) {
    Ps.Player.registerAdapter(Ps.Player);
    Ps.Player.registerAdapter(psynth.SynthAdapter);
    this.player = Ps.Player.create();
};

Play.prototype.load = async function load(url, errors) {
    await this.player.load(url);
};

Play.prototype.getDevices = function getDevices() {
    var adapter = this.player.adapters.find(x => x.adapter instanceof psynth.SynthAdapter).adapter;
    return adapter.devices;
};

Play.prototype.getSequenceCount = function getSequenceCount() {
    return this.player.sequences.length;
};
