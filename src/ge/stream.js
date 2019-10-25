(function() {
    function ensureSize(stream, additionalBytes) {
        var newSize = stream.cursor + additionalBytes;
        if (stream.size < newSize) {
            var buffer = new Uint8Array(newSize);
            for (var i=0; i<stream.buffer.byteLength; i++) {
                buffer[i] = stream.view.getUint8(i);
            }
            stream.buffer = buffer.buffer;
            stream.view = new DataView(stream.buffer);
        }
    }

    function Stream(arg) {
        if (typeof arg === 'number') {
            this.buffer = new ArrayBuffer(arg);
            this.cursor = 0;
        } else if (arg instanceof Stream) {
            this.buffer = new Uint8Array(arg.buffer).slice(0, arg.cursor).buffer;
            this.cursor = arg.cursor;
        } else {
            throw new Error('Invalid argument!');
        // if (arg.buffer != null && arg.buffer instanceof ArrayBuffer) {
        //     this.buffer = new ArrayBuffer(arg.byteLength);
        //     var dst = new Uint8Array(this.buffer);
        //     dst.set(arg);
        // } else if (Array.isArray(arg))  {
        //     this.buffer = new ArrayBuffer(arg.length);
        //     var dst = new Uint8Array(this.buffer);
        //     dst.set(arg);
        //     // var src = new Uint8Array(arg);
        //     // var dst = new Uint8Array(this.buffer);
        //     // for (var i=0; i<arg.length; i++) {
        //     //     dst[i] = src[i];
        //     // }
        }
        //this.length = 0;
        this.view = new DataView(this.buffer);

        Object.defineProperties(this, {
            'size': {
                'enumerable': true,
                get() { return this.buffer.byteLength; }
            },
        });
        this.constructor = Stream;
    }

    Stream.prototype.writeString = function(str) {
        ensureSize(this, str.length+1);
        for (var i=0; i<str.length; i++) {
            this.view.setUint8(this.cursor++, str.charCodeAt(i));
        }
        this.view.setUint8(this.cursor++, 0);
    };

    Stream.prototype.writeStream = function(stream, offset, length) {
        var byteCount = length || stream.cursor - offset;
        ensureSize(this, byteCount);
        for (var i=offset; i<stream.cursor; i++) {
            this.view.setUint8(this.cursor++, stream.readUint8(i));
        }
    };

    Stream.prototype.writeUint8 = function(value) {
        ensureSize(this, 4);
        this.view.setUint8(this.cursor++, value);
    };

    Stream.prototype.writeUint16 = function(value) {
        ensureSize(this, 8);
        this.view.setUint16(this.cursor, value);
        this.cursor += 2;
    };

    Stream.prototype.writeUint32 = function(value) {
        ensureSize(this, 16);
        this.view.setUint32(this.cursor, value);
        this.cursor += 4;
    };

    Stream.prototype.writeFloat32 = function(value) {
        ensureSize(this, 16);
        this.view.setFloat32(this.cursor, value);
        this.cursor += 4;
    };

    Stream.prototype.readString = function(pos) {
        var str = [];
        var value = 0;
        while ((value = this.view.getUint8(pos++)) != 0) {
            str.push(String.fromCharCode(value));
        }
        return str.join('');
    };

    Stream.prototype.readUint8 = function(pos) {
        return this.view.getUint8(pos);
    };

    Stream.prototype.readUint16 = function(pos) {
        return this.view.getUint16(pos);
    };

    Stream.prototype.readUint32 = function(pos) {
        return this.view.getUint32(pos);
    };

    Stream.prototype.readFloat32 = function(pos) {
        return this.view.getFloat32(pos);
    };

    public(Stream, 'Stream');
})();