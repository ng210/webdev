include('/ge/player/iadapter.js');
(function () {
    function Player() {
        this.sequences = [];
        this.userDataBlocks = [];
        this.channels = [];
        this.devices = [];
        this.refreshRate = 25.0;

    };
    extend(Ps.IAdapter, Player);

    Player.prototype.addAdapter = function (adapter) {
        Player.adapters[adapter.getInfo().id] = adapter;
    };

    Player.EOF = 0;
    Player.EOS = 1;
    Player.ASSIGN = 2;
    Player.TEMPO = 3;

    // IAdapter implementation
    Player.prototype.getInfo = function () {
        throw new Error('Not implemented!');
    };

    Player.prototype.prepareContext = function (data) {
        console.log('Player.prepareContext');
        //throw new Error('Not implemented!');
    };

    Player.prototype.createDevice = function (deviceId, initData) {
        throw new Error('Not implemented!');
    };

    Player.prototype.processCommand = function (device, command, sequence, cursor) {
        throw new Error('Not implemented!');
    };

    // updateRefreshRate: function(device, command) { throw new Error('Not implemented!'); },

    // static members
    Player.adapters = {};

    //Ps.Player = Player;

    public(Player, 'Player', Ps);
})();