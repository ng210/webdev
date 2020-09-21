(function() {
    function ensureSize(stream, additionalBytes) {
        var newSize = stream.writePosition + additionalBytes;
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
        var offset = arguments[1];
        var length = arguments[2];

        if (typeof arg === 'number') {
            this.buffer = new Uint8Array(arg).buffer;
            this.length = 0;

        } else if (arg instanceof ArrayBuffer) {
            if (offset == undefined) {
                this.buffer = arg.slice();
                this.length = arg.byteLength;
             } else {
                 this.buffer = new Uint8Array(arg).buffer;
                 this.length = length == undefined ? arg.byteLength - offset : length;
             }

        } else if (Array.isArray(arg)) {
            if (!length) length = arg.length;
            if (offset == undefined) offset = 0;
            this.buffer = new Uint8Array(arg.slice(offset, offset+length)).buffer;
            this.length = this.buffer.byteLength;
            offset = 0;

        } else if (arg instanceof DataView) {
            this.buffer = arg.buffer;
            this.view = arg;
            this.length = arg.byteLength;

        } else if (arg.buffer && arg.buffer instanceof ArrayBuffer) {
            if (offset == undefined) {
                this.buffer = arg.buffer.slice();
                this.length = arg.length != undefined ? arg.length : arg.buffer.byteLength;
             } else {
                var bytes = arg.buffer.byteLength/arg.length;
                this.buffer = arg.buffer;
                offset *= bytes;
                if (length == undefined) {
                    this.length = arg.buffer.byteLength - offset;
                } else {
                    length *= bytes;
                    this.length = length;
                }                
             }

        // } else if (arg instanceof Stream) {
        //     if (offset == undefined) {
        //     }
        //     this.buffer = new Uint8Array(arg.buffer);

        // } else if (arg instanceof DataView) {
        //     this.buffer = arg.buffer;
        //     this.view = arg;
        //     this.length = this.size;
        // } else if (arg.buffer && arg.buffer instanceof ArrayBuffer) {
        //     this.buffer = new Uint8Array(arg.buffer, offset, length).buffer;
        //     this.length = this.size;
        } else {
            throw new Error('Invalid argument!');
        }
        this.readPosition = 0;
        this.writePosition = 0;
        if (!this.view) this.view = new DataView(this.buffer, offset, length);
        this.constructor = Stream;
    }
    Stream.prototype = {
        get size() { return this.buffer.byteLength; },
    };
    Stream.prototype.writeString = function writeString(str) {
        ensureSize(this, str.length+1);
        for (var i=0; i<str.length; i++) {
            this.view.setUint8(this.writePosition++, str.charCodeAt(i));
        }
        this.view.setUint8(this.writePosition++, 0);
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.writeStream = function writeStream(stream, offset, length) {
        offset = offset || 0;
        var byteCount = length || stream.length - offset;
        ensureSize(this, byteCount);
        for (var i=offset; i<offset+byteCount; i++) {
            this.view.setUint8(this.writePosition++, stream.readUint8(i));
        }
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.writeBytes = function writeBytes(array, offset, length) {
        var byteCount = length || array.length - offset;
        ensureSize(this, byteCount);
        for (var i=offset; i<offset+byteCount; i++) {
            this.view.setUint8(this.writePosition++, array[i]);
        }
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.writeUint8 = function writeUint8(value) {
        ensureSize(this, 4);
        this.view.setUint8(this.writePosition++, value);
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.writeUint16 = function writeUint16(value) {
        ensureSize(this, 8);
        this.view.setUint16(this.writePosition, value);
        this.writePosition += 2;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.writeUint32 = function writeUint32(value) {
        ensureSize(this, 16);
        this.view.setUint32(this.writePosition, value);
        this.writePosition += 4;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.writeFloat32 = function writeFloat32(value) {
        ensureSize(this, 16);
        this.view.setFloat32(this.writePosition, value);
        this.writePosition += 4;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.readString = function readString(pos) {
        this.readPosition = pos != undefined ? pos : this.readPosition;
        var str = [];
        var value = 0;
        while ((value = this.view.getUint8(this.readPosition++)) != 0) {
            str.push(String.fromCharCode(value));
        }
        return str.join('');
    };

    Stream.prototype.readUint8 = function readUint8(pos) {
        this.readPosition = pos != undefined ? pos : this.readPosition;
        return this.view.getUint8(this.readPosition++);
    };

    Stream.prototype.readUint16 = function readUint16(pos) {
        this.readPosition = pos != undefined ? pos : this.readPosition;
        var r = this.readPosition;
        this.readPosition += 2;
        return this.view.getUint16(r);
    };

    Stream.prototype.readUint32 = function readUint32(pos) {
        this.readPosition = pos != undefined ? pos : this.readPosition;
        var r = this.readPosition;
        this.readPosition += 4;
        return this.view.getUint32(r);
    };

    Stream.prototype.readFloat32 = function readFloat32(pos) {
        this.readPosition = pos != undefined ? pos : this.readPosition;
        var r = this.readPosition;
        this.readPosition += 4;
        return this.view.getFloat32(r);
    };

    Stream.prototype.dump = function dump(width) {
        width = width || 16;
        var dump = [];
        var j = 0, k = 0;
        width += Math.floor(width/4);
        var row = new Array(256);
        for (var i=0; i<this.length; i++) {
            var b = this.readUint8(i);
            b = b.toString(16);
            if (b.length < 2) b = '0' + b;
            row[j++] = b;
            if (k++ == 3) {
                row[j++] = ' ';
                k = 0;
            }
            if (j == width) {
                dump.push(row.join(' '));
                j = 0;
                k = 0;
                row = new Array(256);
            }
        }
        if (j != 0) {
            dump.push(row.join(' '));
        }
        return dump.join('\n');
    };

    Stream.prototype.toFile = function toFile(fileName, type, offset, length) {
        var view = new Uint8Array(this.buffer, offset || 0, length || this.length);
        var data = new Blob([view], {'type': type});
        var url = window.URL.createObjectURL(data);
        var link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.setAttribute('download', fileName);
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        delete link;
    };
    
    Stream.fromFile = async function fromFile(path, type) {
        type = type || 'application/octet-stream';
        var file = await load({ 'url':path, 'contentType': type, 'charSet': 'bin'});
        return new Stream(file.data);
    };

    public(Stream, 'Stream');
})();
