(function() {
    var player = function() {
        this.sequences = [];
        this.userDataBlocks = [];
        this.targets = [];
        this.channels = [];
        this.refreshRate = 25.0;
        
    };
    player.adapters = {};
    player.prototype.addAdapter = function(adapter) {
        player.adapters[adapter.getInfo().id] = adapter;
    };

    player.prototype.xxx = function() {

    };

    player.EOF = 0;
    player.EOS = 1;

    public(player, 'Player');

})();