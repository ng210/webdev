include('./sequence.js');

(function(){
    function Frame() {
        this.delta = 0;
        this.commands = [];
    };
    Frame.prototype.setDelta = function setDelta(value) {
        this.delta = value;
        return this;
    };
    Frame.prototype.addCommand = function addCommand(command) {
        this.commands.push(command);
        return this;
    };
    publish(Frame, 'Frame', Ps)

    function Channel(id) {
        this.id = id;
        this.sequence = null;
        this.frames = null;
        this.device = null;
        this.adapter = null;
        this.reset();
    };

    Channel.prototype.assign = function(deviceId, sequence) {
        this.sequence = sequence;
        this.cursor = 1;
        this.adapter = sequence.adapter;
        if (!this.adapter) {
            throw new Error(`Missing adapter!`);
        }
        this.device = this.adapter.getDevice(deviceId);
        //this.currentTick = 0;
        this.isActive = true;
        this.run(0);
    };

    Channel.prototype.restart = function restart() {
        this.cursor = 1;
        if (--this.loopCount > 0) {
            this.currentTick = 0;
            this.isActive = true;
        } else {
            this.isActive = false;
        }
    };

    Channel.prototype.reset = function reset() {
        this.isActive = false;
        this.currentTick = 0;
        this.loopCount = 1;
        this.cursor = 1;
        if (this.device != null) {
            this.device.reset();
        }
    };
    Channel.prototype.getState = function getState() {
        return {
            'isActive': false,
            'currentTick': 0,
            'loopCount': 1,
            'cursor': 1
        };
    };
    Channel.prototype.setState = function setState(state) {
        this.isActive = state.isActive;
        this.currentTick = state.currentTick;
        this.loopCount = state.loopCount;
        this.cursor = state.cursor;
    };

    Channel.prototype.run = function run(ticks) {
        var isRestarted = false;
        while (this.isActive) {
            isRestarted = false;
            var delta = 0;
            while ((delta = this.sequence.getUint16(this.cursor)) <= this.currentTick) {
                this.currentTick -= delta; this.cursor += 2;
                var cmd = -1;
                while (true) {
                    // read command code, 1 byte
                    cmd = this.sequence.getUint8(this.cursor++);
                    if (cmd > 1) {
                        this.cursor = this.adapter.processCommand(this, cmd);   //this.device, cmd, this.sequence, this.cursor);
                    } else {
                        if (cmd === Ps.PlayerAdapter.Commands.EOS) {
                            // end of sequence
                            this.restart();
                            isRestarted = this.isActive;
                        }
                        // cmd == 0: end of frame
                        break;
                    }
                }
                if (cmd === Ps.PlayerAdapter.Commands.EOS) {
                    // end of sequence
                    //this.currentTick = 0;
                    break;
                }
            }
            if (isRestarted) {
                // end of sequence
                continue;
            }
            this.currentTick += ticks;
            break;
        }
        return this.isActive;
    };

    Channel.prototype.toFrames = function() {
        this.frames = this.sequence.toFrames();
        return this.frames;
    };

    Channel.prototype.toSequence = function() {
        this.sequence = new Ps.Sequence(this.adapter);
        this.sequence.fromFrames(this.frames);
        return this.sequence;
    };

    publish(Channel, 'Channel', Ps)
})();