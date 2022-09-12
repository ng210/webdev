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
            var bytes = arg instanceof Stream ? 1 : arg.buffer.byteLength/arg.length;
            if (offset == undefined) {
                this.buffer = arg.buffer.slice();
                this.length = arg instanceof Stream ? bytes*arg.length : arg.byteLength;
             } else {
                this.buffer = arg.buffer;
                offset *= bytes;
                if (length == undefined) {
                    this.length = arg.buffer.byteLength - offset;
                } else {
                    length *= bytes;
                    this.length = length;
                }                
             }
        } else {
            throw new Error('Invalid argument!');
        }
        this.readPosition = 0;
        this.writePosition = 0;
        if (!this.view) this.view = new DataView(this.buffer, offset, length);
        this.constructor = Stream;
        this.isLittleEndian = Stream.isLittleEndian;
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

    Stream.prototype.writeArray = function writeArray(array, offset, length) {
        offset = offset || 0;
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

    Stream.prototype.writeBytes = function writeBytes(value, byteCount) {
        ensureSize(this, byteCount);
        for (var i=0; i<byteCount; i++) {
            this.view.setUint8(this.writePosition++, value);
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
        this.view.setUint16(this.writePosition, value, this.isLittleEndian);
        this.writePosition += 2;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.writeUint32 = function writeUint32(value) {
        ensureSize(this, 16);
        this.view.setUint32(this.writePosition, value, this.isLittleEndian);
        this.writePosition += 4;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.writeFloat32 = function writeFloat32(value) {
        ensureSize(this, 16);
        this.view.setFloat32(this.writePosition, value, this.isLittleEndian);
        this.writePosition += 4;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
        return this;
    };

    Stream.prototype.readString = function readString(pos, length) {
        if (length == undefined) length = 0;
        this.readPosition = pos != undefined ? pos : this.readPosition;
        var str = [];
        var value = 0;
        if (length == 0) {
            while ((value = this.view.getUint8(this.readPosition++)) != 0) str.push(String.fromCharCode(value));
        } else {
            while (length-- > 0 && (value = this.view.getUint8(this.readPosition++)) != 0) str.push(String.fromCharCode(value));
            this.readPosition += length;
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
        return this.view.getUint16(r, this.isLittleEndian);
    };

    Stream.prototype.readUint32 = function readUint32(pos) {
        this.readPosition = pos != undefined ? pos : this.readPosition;
        var r = this.readPosition;
        this.readPosition += 4;
        return this.view.getUint32(r, this.isLittleEndian);
    };

    Stream.prototype.readFloat32 = function readFloat32(pos) {
        this.readPosition = pos != undefined ? pos : this.readPosition;
        var r = this.readPosition;
        this.readPosition += 4;
        return this.view.getFloat32(r, this.isLittleEndian);
    };

    Stream.prototype.dump = function dump(offset, length, width, separator, linebreaks) {
        width = width || this.length;
        separator = separator || '';
        offset = offset || 0;
        length = length || this.length;
        this.readPosition = length || this.length;
        var dump = [];
        var ri = 0, j = 0, k = 0;
        var row = new Array(256);
        length += offset;
        if (length > this.length) length = this.length;
        for (var i=offset; i<length; i++) {
            var b = this.readUint8(i);
            b = b.toString(16);
            if (b.length < 2) b = '0' + b;
            row[ri++] = b;
            j++;
            if (j == width && j < length) {
                dump.push(row.slice(0, ri).join(separator));
                j = 0;
                k = 0;
                ri = 0;
                row = new Array(256);
            } else {
                if (separator && ++k == 4) {
                    row[ri++] = '';
                    k = 0;
                }
            }
        }
        if (ri != 0) {
            dump.push(row.slice(0, ri).join(separator));
        }
        return dump.join(linebreaks ? '\n' : separator+separator);
    };

    Stream.prototype.hexdump = function hexdump(width, offset, length) {
        return this.dump(offset, length, width, ' ', true);
    };

    Stream.prototype.toFile = function toFile(fileName, type, offset, length) {
        var view = new Uint8Array(this.buffer, offset || 0, length || this.length);
        var data = new Blob([view], {'type': type});
        save(data, fileName);
    };
    
    Stream.fromFile = async function fromFile(path, options) {
        /* options
         - contentType
         - responseType
         - charSet */
        var loadOptions = mergeObjects({
            'url': path,
            'contentType': 'application/octet-stream',
            'responseType': 'arraybuffer',
            'charSet': 'binary'
        }, options);
        var file = await load(loadOptions);
        if (file.error instanceof Error) throw file.error;
        return new Stream(file.data);
    };

    Stream.fromDump = function dump(str) {
        var s = new Stream(128);
        var hex = '';
        var j = 0;
        for (var i=0; i<str.length;) {
            var ch = str.charAt(i++);
            if (ch >= '0' && ch <= '9' || ch >= 'A' && ch <= 'F' || ch >= 'a' && ch <= 'f') {
                hex = hex + ch;
                j++;
            } else j = 2;
            if (j == 2) {
                if (hex != '') {
                    s.writeUint8(parseInt(hex, 16));
                    hex = '';
                }
                j = 0;
            }
        }

        return new Stream(s);
    };

    Stream.isLittleEndian = false;

    publish(Stream, 'Stream');
})();
