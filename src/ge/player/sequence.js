include('/ge/player/player.js');

(function() {
    // byte streams
    // - commands: code, byte count, arguments
    // - frames: delta, command-1, command-2, ..., command-n, 0
    // - sequence: header byte count, header, frame-1, frame-2, ..., frame-n, EOS frame

    var Sequence = function() {
        this.adapterType = null;
        this.stream = null;
        this.headerSizeInBytes = 0;
        this.constructor = Player.Sequence;
    };
    Sequence.fromStream = function(stream, offset) {
        var sequence = new Player.Sequence();
        sequence.stream = new DataView(stream, offset);
        // read guid of adapter type
        sequence.headerSizeInBytes = sequence.stream.getUint8(0);
        sequence.adapterType = sequence.stream.getUint8(1);
        return sequence;
    };

    Sequence.prototype.getUint8 = function(offs) { return this.stream.getUint8(offs); };
    Sequence.prototype.getUint16 = function(offs) { return this.stream.getUint16(offs); };
    Sequence.prototype.getUint32 = function(offs) { return this.stream.getUint32(offs); };
    Sequence.prototype.getFloat32 = function(offs) { return this.stream.getFloat32(offs); };

    Player.Sequence = Sequence;
})();