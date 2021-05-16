include('./player.js');
include('/lib/data/stream.js');

(function() {
    // byte streams
    // - commands: code, byte count, arguments
    // - frames: delta, command-1, command-2, ..., command-n, 0
    // - sequence: adapter id, frame-1, frame-2, ..., frame-n, EOS frame

    function Sequence(adapter, buffer, offset, length) {
        this.stream = !buffer ? new Stream(256) : new Stream(new DataView(buffer, offset, length));
        this.adapter = adapter;
    };
    Sequence.prototype.writeHeader = function() {
        this.stream.writePosition = 0;
        this.stream.writeUint8(this.adapter.getInfo().id);
    };
    Sequence.prototype.writeDelta = function(delta) { this.stream.writeUint16(delta); };
    Sequence.prototype.writeCommand = function(cmd) { this.stream.writeUint8(cmd); };
    Sequence.prototype.writeEOF = function() { this.stream.writeUint8(Ps.Player.EOF); };
    Sequence.prototype.writeEOS = function() { this.stream.writeUint8(Ps.Player.EOS); };
    Sequence.prototype.writeString = function(str) { this.stream.writeString(str); };
    Sequence.prototype.writeUint8 = function(value) { this.stream.writeUint8(value); };
    Sequence.prototype.writeUint16 = function(value) { this.stream.writeUint16(value); };
    Sequence.prototype.writeUint32 = function(value) { this.stream.writeUint32(value); };
    Sequence.prototype.writeFloat32 = function(value) { this.stream.writeFloat32(value); };
    Sequence.prototype.getUint8 = function(offs) { return this.stream.readUint8(offs); };
    Sequence.prototype.getUint16 = function(offs) { return this.stream.readUint16(offs); };
    Sequence.prototype.getUint32 = function(offs) { return this.stream.readUint32(offs); };
    Sequence.prototype.getFloat32 = function(offs) { return this.stream.readFloat32(offs); };

    Sequence.prototype.toFrames = function() {
        var frames = [];
        var cursor = 0;
        while (true) {
            var frame = new Ps.Frame();
            frame.delta = this.getUint16(cursor); cursor += 2;
            var cmd = 0;
            while (true) {
                // read command code byte
                cmd = this.getUint8(cursor++);
                if (cmd > Ps.Player.EOS) {
                    var command = this.adapter.makeCommand(cmd, this, cursor);
                    frame.commands.push(command);
                    cursor += command.length - 1;
                } else if (cmd == Ps.Player.EOF) {
                    if (frame.commands.length == 0) {
                        cmd = new Stream(1);
                        cmd.writeUint8(0);
                        frame.commands.push(cmd);
                    }
                    break;
                } else if (cmd == 1) {
                    break;
                }
            }
            frames.push(frame);
            if (cmd === Ps.Player.EOS) {
                break;
            }
        }
        return frames;
    };

    Sequence.fromFrames = function fromFrames(frames, adapter) {
        var sequence = new Sequence(adapter);
        var hasEOS = false;
        for (var fi=0; fi<frames.length; fi++) {
            var frame = frames[fi];
            var hasEOF = false;
            sequence.writeDelta(frame.delta);
            for (var ci=0; ci<frame.commands.length; ci++) {
                var command = frame.commands[ci];
                sequence.stream.writeStream(command);
                var cmd = command.readUint8(0);                
                if (cmd == 0) {
                    hasEOF = true;
                    break;
                }
                if (cmd == 1) {
                    hasEOS = true;
                    break;
                }
            }
            //if (hasEOS) break;
            if (!hasEOF) {
                sequence.writeUint8(0);
            }
        }
        sequence.stream.writePosition--;
        if (!hasEOS) {
            sequence.writeUint8(1);
        }

        return sequence;
    };

    publish(Sequence, 'Sequence', Ps);
})();
