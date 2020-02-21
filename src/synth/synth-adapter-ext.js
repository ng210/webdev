include('/data/dataseries.js');
include('/data/stream.js');
include('/synth/synth-adapter.js');

// Extensions to the synth-adapter

    //getCommandSize: function(command, args) { },

psynth.SynthAdapter.makeCommand = function(command) {
    var stream = new Stream(128);
    stream.writeUint8(command);
    switch (command) {
        case psynth.SynthAdapter.SETNOTE:
            if (arguments[1] instanceof Player.Sequence) {
                stream.writeStream(arguments[1].stream, arguments[2], 2);
            } else {
                stream.writeUint8(arguments[1]);
                stream.writeUint8(arguments[2]);
            }
            break;
        case psynth.SynthAdapter.SETCTRL8:
            if (arguments[1] instanceof Player.Sequence) {
                stream.writeStream(arguments[1].stream, arguments[2], 2);
            } else {
                stream.writeUint8(arguments[1]);
                stream.writeUint8(arguments[2]);
            }
            break;
        case psynth.SynthAdapter.SETCTRL16:
            if (arguments[1] instanceof Player.Sequence) {
                stream.writeStream(arguments[1].stream, arguments[2], 3);
            } else {
                stream.writeUint8(arguments[1]);
                stream.writeUint16(arguments[2]);
            }
            break;
        case psynth.SynthAdapter.SETCTRLF:
            if (arguments[1] instanceof Player.Sequence) {
                stream.writeStream(arguments[1].stream, arguments[2], 5);
            } else {
                stream.writeUint8(arguments[1]);
                stream.writeFloat32(arguments[2]);
            }
            break;
    }
    return new Stream(stream);
};

psynth.SynthAdapter.toDataSeries = function(sequence) {
    var series = {};
    var stream = sequence.stream;
    var cursor = sequence.headerSizeInBytes;
    var delta = 0;
    var noteMap = {};
    while (true) {
        delta += stream.readUint16(cursor); cursor += 2;
        var cmd = 0;
        while (true) {
            // read command code, 1 byte
            cmd = stream.readUint8(cursor++);
            if (cmd == Player.EOF) break;
            if (cmd == Player.EOS) {
                series[cmd] = ds = new DataSeries();
                ds.set([delta, 0]);
                break;
            }
            var seriesId = (cmd == psynth.SynthAdapter.SETNOTE) ? cmd : stream.readUint8(cursor++);
            var ds = series[seriesId];
            if (!ds) {
                ds = series[seriesId] = new DataSeries();
                // if (cmd == psynth.SynthAdapter.SETNOTE && !series[psynth.SynthAdapter.SETVELOCITY]) {
                //     series[psynth.SynthAdapter.SETVELOCITY] = new DataSeries();
                // }
            }

            switch (cmd) {
                case psynth.SynthAdapter.SETNOTE:
                    var pitch = stream.readUint8(cursor++);
                    var velocity = stream.readUint8(cursor++);
                    if (velocity != 0) {
                        // note on
                        noteMap[pitch] = ds.set([delta, pitch, velocity, delta]);
                        //series[psynth.SynthAdapter.SETVELOCITY].set([delta, velocity]);
                    } else {
                        // note off
                        var dataPoint = noteMap[pitch];
                        dataPoint[3] = delta - dataPoint[3];
                    }
                    break;
                case psynth.SynthAdapter.SETCTRL8:
                    ds.set(delta, stream.readUint8(cursor++));
                    break;
                default:
                    throw new Error(`Unsupported command #${cmd}`);
            }
        }
        if (cmd == Player.EOS) {
            break;
        }
    }
    return series;
};

psynth.SynthAdapter.fromDataSeries = function(series, channelId) {
    var sequence = null;
    var keys = Object.keys(series);
    var f0 = 0, f1 = 0;
    var noteMap = {};
    var isEnd = false;
    var lastWrite = -1;
    var info = [];
    do {
        for (var k=0; k<keys.length; k++) {
            var key = parseInt(keys[k]);
            var ds = series[key];
            if (ds.data.length == 0) continue;
            if (info[k] == undefined) {
                info[k] = ds.getInfo();
            }
            if (key == Player.EOS) {
                isEnd = (f0 == info[k].max[0]);
                continue;
            }
            if (key == psynth.SynthAdapter.SETVELOCITY) continue;
            if (channelId != undefined && channelId != k) continue;
            if (info[k].max[0] >= f0) {
                var dataPoints = ds.get(f0);
                for (var i=0; i<dataPoints.length; i++) {
                    if (sequence == null) {
                        sequence = new Player.Sequence(psynth.SynthAdapter);
                        sequence.writeHeader();
                    }
                    // write delta
                    sequence.writeDelta(f0 - f1);
                    // make and write command
                    var dataPoint = Array.from(dataPoints[i]);
                    dataPoint[0] = key == psynth.SynthAdapter.SETNOTE ? key : psynth.SynthAdapter.SETCTRL8;
                    var cmd = sequence.adapter.makeCommand.apply(null, dataPoint);
                    sequence.stream.writeStream(cmd);
                    noteMap[dataPoint[1]] = f0 + dataPoint[3];
                }
            }
        }
        sequence = sequence || new Player.Sequence(psynth.SynthAdapter);
        for (var n in noteMap) {
            if (noteMap[n] == f0) {
                if (lastWrite == sequence.cursor) {
                    sequence.writeDelta(f0 - f1);
                }
                sequence.writeCommand(psynth.SynthAdapter.SETNOTE);
                sequence.stream.writeUint8(parseInt(n));
                sequence.stream.writeUint8(0);
                noteMap[n] = undefined;
            }
        }
        if (isEnd) {
            if (lastWrite == sequence.cursor) {
                sequence.writeDelta(f0 - f1);
            }
            sequence.writeCommand(Player.EOS);
            break;
        }
        if (lastWrite != sequence.cursor) {
            sequence.writeEOF();
            lastWrite = sequence.cursor;
            f1 = f0;
        }
        f0++;
    } while (true);
    return sequence;
};
