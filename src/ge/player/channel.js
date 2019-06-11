include('/ge/player/sequence.js');

(function(){
    var frame = function() {
        this.delta = 0;
        this.commands = [];
        this.constructor = Player.Frame;
    };
    Player.Frame = frame;

    var channel = function(id, player) {
        this.id = id;
        this.player = player;
        this.sequence = null;
        this.frames = null;
        this.target = null;
        this.adapter = null;
        this.isActive = false;
        this.currentTick = 0;
        this.loopCount = 0;
        this.cursor = 0;

        this.constructor = Player.Channel;
    };
    channel.prototype.assign = function(target, sequence) {
        this.sequence = sequence;
        this.cursor = sequence.headerSizeInBytes;
        this.target = target;
        this.adapter = this.player.adapters[sequence.adapterType];
        if (this.adapter === undefined) {
            throw new Error(`Unsupported adapter type ${sequence.adapterType}`);
        }
    };
    channel.prototype.reset = function() {
        this.cursor = this.sequence.headerSizeInBytes;
        if (this.loopCount > 0) {
            this.currentTick = 0;
            this.loopCount--;
        } else {
            this.isActive = false;
        }
    }
    channel.prototype.run = function(ticks) {
        var isRestarted = false;
        do {
            isRestarted = false;
            var delta = 0;
            while ((delta = this.sequence.getUint16(this.cursor)) <= this.currentTick) {
                this.currentTick -= delta; this.cursor += 2;
                while (true) {
                    // read command code, 1 byte
                    var cmd = this.sequence.getUint8(this.cursor++);
                    if (cmd > 1) {
                        this.cursor = this.adapter.processCommand(this.target, cmd-2, this.sequence, this.cursor);
                    } else {
                        if (cmd === 1) {
                            // end of sequence
                            this.reset();
                            isRestarted = this.isActive;
                        }
                        // cmd == 0: end of frame
                        break;
                    }
                }
                if (cmd === 1) {
                    break;
                }
            }            
            this.currentTick += ticks;
        } while (isRestarted);
        return this.isActive;
    };

    channel.prototype.toFrames = function() {
        this.frames = [];
        var cursor = this.sequence.headerSizeInBytes;
        while (true) {
            var frame = new Player.Frame();
            frame.delta = this.sequence.getUint16(cursor); cursor += 2;
            var cmd = 0;
            while (true) {
                // read command code, 1 byte
                cmd = this.sequence.getUint8(cursor);
                if (cmd > 1) {
                    var oldCursor = cursor;
                    cursor += this.adapter.getCommandSize(cmd-2, this.sequence, cursor+1);
                    frame.commands.push(new DataView(this.sequence.stream.buffer.slice(oldCursor, cursor)));
                } else {
                    if (frame.commands.length == 0) {
                        frame.commands.push(new DataView(this.sequence.stream.buffer.slice(cursor, cursor+1)));
                    }
                    cursor++;
                    break;
                }
            }
            this.frames.push(frame);
            if (cmd === 1) {
                break;
            }
        }
    };
    channel.prototype.toStream = function() {
        var stream = new DataView(new ArrayBuffer(65536));
        var hasEOS = false;
        var cursor = 0;
        stream.setUint8(cursor++, this.headerSizeInBytes);
        stream.setUint8(cursor++, this.adapterType);
        for (var fi=0; fi<this.frames.length; fi++) {
            var frame = this.frames[fi];
            var hasEOF = false;
            stream.setUint16(cursor, frame.delta); cursor += 2;
            for (var ci=0; ci<frame.commands.length; ci++) {
                for (var bi=0; bi<frame.commands[ci].byteLength; bi++) {
                    stream.setUint8(cursor++, frame.commands[ci].getUint8(bi));
                }
                var cmd = frame.commands[ci].getUint8(0);
                if (cmd == 0) {
                    hasEOF = true;
                    break;
                }
                if (cmd == 1) {
                    hasEOS = true;
                    break;
                }
            }
            if (!hasEOF && !hasEOS) {
                stream.setUint8(cursor++, 0);
            }
        }
        if (!hasEOS) {
            stream.setUint8(cursor++, 1);
        }
        this.sequence.stream = new DataView(stream.buffer.slice(0, cursor));
    };

    Player.Channel = channel;
})();