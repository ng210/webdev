(function() {
    var player = function() {
        this.sequences = [];
        this.userDataBlocks = [];
        this.targets = [];
        this.channels = [];
        this.refreshRate = 25.0;
        this.constructor = Player.Player;
    };
    player.adapters = {};
    player.prototype.addAdapter = function(adapter) {
        player.adapters[adapter.getInfo().id] = adapter;
    };

    player.prototype.xxx = function() {

    };

    public(player, 'Player');

})();