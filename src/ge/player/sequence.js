include('/ge/player/player.js');

(function() {
    // byte streams
    // - commands: code, byte count, arguments
    // - frames: delta, command-1, command-2, ..., command-n, 0
    // - sequence: header byte count, header, frame-1, frame-2, ..., frame-n, EOS frame

    var Sequence = function(arg) {
        if (Number.isNaN(arg)) {
            this.stream = arg;
            this.headerSizeInBytes = arg.getUint8(0);
            this.adapterType = arg.getUint8(1);
        } else {
            this.stream = new ArrayBuffer(256);
            this.headerSizeInBytes = 2;
            this.adapterType = arg;
        }
        this.view = new DataView(this.stream);
        this.cursor = 0;

        this.constructor = Player.Sequence;
    };

    Sequence.prototype.writeHeader = function() {
        this.cursor = 0;
        this.writeUint8(this.headerSizeInBytes);
        this.writeUint8(this.adapterType);
    };

    Sequence.prototype.writeDelta = function(delta) {
        this.writeUint16(delta);
    };

    Sequence.prototype.writeCommand = function(cmd) {
        this.writeUint8(cmd + 2);
    };

    Sequence.prototype.writeEOF = function() {
        this.writeUint8(0);
    };

    Sequence.prototype.writeEOS = function() {
        this.writeUint8(1);
    };

    Sequence.prototype.writeString = function(str) {
        for (var i=0; i<str.length; i++) {
            this.writeUint8(str.charCodeAt(i))
        }
        this.writeUint8(0);
    };

    Sequence.prototype.writeUint8 = function(value) {
        this.view.setUint8(this.cursor++, value);
    };

    Sequence.prototype.writeUint16 = function(value) {
        this.view.setUint16(this.cursor, value);
        this.cursor += 2;
    };

    Sequence.prototype.writeUint32 = function(value) {
        this.view.setUint32(this.cursor, value);
        this.cursor += 4;
    };

    Sequence.prototype.writeFloat32 = function(value) {
        this.view.setFloat32(this.cursor, value);
        this.cursor += 4;
    };
        

    Sequence.prototype.getUint8 = function(offs) { return this.view.getUint8(offs); };

    Sequence.prototype.getUint16 = function(offs) { return this.view.getUint16(offs); };

    Sequence.prototype.getUint32 = function(offs) { return this.view.getUint32(offs); };

    Sequence.prototype.getFloat32 = function(offs) { return this.view.getFloat32(offs); };
    
    Player.Sequence = Sequence;
})();