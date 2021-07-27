include('/lib/player/player-lib.js');

(function() {
    function Sequencer(app) {
        this.app = app;
        // this.datablocks = null;
        // this.adapters = null;
        // this.sequences = null;
        this.player = null;
    }

    Sequencer.create = async function squencer_create(app) {
        return new Sequencer(app);
    };

    Sequencer.prototype.update = function sequencer_update(delta) {

    };

    publish(Sequencer, 'Sequencer');
})();