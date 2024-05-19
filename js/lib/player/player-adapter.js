include('./iadapter.js');
include('./player.js');
(function() {
    function PlayerAdapter(player) {
        PlayerAdapter.base.constructor.call(this, player);
        this.channels = [];
    }
    extend(Ps.IAdapter, PlayerAdapter);

    PlayerAdapter.prototype.getInfo = function() { return Ps.PlayerAdapter.info; };
    PlayerAdapter.prototype.createDeviceImpl = function createDeviceImpl(deviceType, initData) {
        var device = null;
        switch (deviceType) {
            case Ps.PlayerAdapter.Device.PLAYER:
                device = new Ps.Player();
                break;
            case Ps.PlayerAdapter.Device.CHANNEL:
                device = new Ps.Channel('Chn'+this.devices.length);
                this.channels.push(device);
                break;
        }
        return device;
    };
    PlayerAdapter.prototype.prepareContext = function(data) {
        PlayerAdapter.base.prepareContext.call(this, data);
        this.player.setRefreshRate(data.readFloat32());
    };
    PlayerAdapter.prototype.processCommand = function processCommand(channel, command) {   //device, command, sequence, cursor) {
        var device = channel.device;
        var sequence = channel.sequence;
        var cursor = channel.cursor;
        switch (command) {
            case PlayerAdapter.Commands.Assign: // chnId, seqId, devId, loop-count
                var channelId = sequence.getUint8(cursor++);
                var sequenceId = sequence.getUint8(cursor++);
                var deviceId = sequence.getUint8(cursor++);
                this.channels[channelId].loopCount = sequence.getUint8(cursor++);
                var sequence = this.player.sequences[sequenceId];
                this.channels[channelId].assign(deviceId, sequence);
                break;
            case PlayerAdapter.Commands.Tempo: // fps
                var fps = sequence.stream.readFloat32(cursor);
                cursor += 4;
                this.player.setRefreshRate(fps);
                break;
        }
        return cursor;
    };
    PlayerAdapter.prototype.reset = function reset() {
        for (var i=1; i<this.devices.length; i++) {
            this.devices[i].reset();
        }
    };
    PlayerAdapter.prototype.run = function run(ticks) {
        for (var i=1; i<this.devices.length; i++) {
            this.devices[i].run(ticks);
        }
    };
    PlayerAdapter.prototype.setRefreshRate = function(fps) {
        return;
    };

    PlayerAdapter.info = { name: 'PlayerAdapter', id: 0 };

    PlayerAdapter.Commands = {
        'EOF': 0,
        'EOS': 1,
        'Assign': 2,
        'Tempo': 3
    };

    PlayerAdapter.Device = {
        PLAYER: 0,
        CHANNEL: 1
    };

    publish(PlayerAdapter, 'PlayerAdapter', Ps);
})();
