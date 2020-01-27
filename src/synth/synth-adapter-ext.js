include('/data/dataseries.js');
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
    var map = {};
    var frames = sequence.toFrames();
    var delta = 0;
    var noteMap = {};
    for (var fi=0; fi<frames.length; fi++) {
        var frame = frames[fi];
        delta += frame.delta;
        for (var ci=0; ci<frame.commands.length; ci++) {
            var command = frame.commands[ci];
            var cursor = 0;
            var cmdId = command.readUint8(cursor++);
            var seriesId = (cmdId == psynth.SynthAdapter.SETNOTE) ? cmdId : command.readUint8(cursor++);
            var series = map[seriesId];
            if (!series) {
                switch (cmdId) {
                    case psynth.SynthAdapter.SETNOTE:
                        map[seriesId] = series = new DataSeries();
                        break;
                    case psynth.SynthAdapter.SETCTRL8:
                        map[seriesId] = series = new DataSeries();
                        break;
                }
            }
            switch (cmdId) {
                case psynth.SynthAdapter.SETNOTE:
                    var pitch = command.readUint8(cursor++);
                    var velocity = command.readUint8(cursor++);
                    if (velocity != 0) {
                        noteMap[pitch] = series.set([delta, pitch, velocity, delta]);
                    } else {
                        var dataPoint = noteMap[pitch];
                        dataPoint[3] = delta - dataPoint[3];
                    }
                    break;
                case psynth.SynthAdapter.SETCTRL8:
                    series.set(delta, command.readUint8(cursor++));
                    break;
            }
        }
    }

    return map;
};

