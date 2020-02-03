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
            if (cmd == Player.EOF || cmd == Player.EOS) { //EOF or EOS
                break;
            }
            var seriesId = (cmd == psynth.SynthAdapter.SETNOTE) ? cmd : stream.readUint8(cursor++);
            var ds = series[seriesId];
            if (!ds) {
                ds = series[seriesId] = new DataSeries();
                if (cmd == psynth.SynthAdapter.SETNOTE && !series[psynth.SynthAdapter.SETVELOCITY]) {
                    series[psynth.SynthAdapter.SETVELOCITY] = new DataSeries();
                }
            }

            switch (cmd) {
                case psynth.SynthAdapter.SETNOTE:
                    var pitch = stream.readUint8(cursor++);
                    var velocity = stream.readUint8(cursor++);
                    if (velocity != 0) {
                        // note on
                        noteMap[pitch] = ds.set([delta, pitch, velocity, delta]);
                        series[psynth.SynthAdapter.SETVELOCITY].set([delta, velocity]);
                    } else {
                        // note off
                        var dataPoint = noteMap[pitch];
                        dataPoint[3] = delta - dataPoint[3];
                    }
                    break;
                case psynth.SynthAdapter.SETCTRL8:
                    series.set(delta, stream.readUint8(cursor++));
                    break;
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
    var ds = series[channelId];
    if (ds) {
        sequence = new Sequence();
        for (var i=0; i<ds.data.length; i++) {
            
        }
    }
    return sequence;
};
