
include('/ge/player/player-lib.js');
include('/synth/synth-adapter.js');
include('/synth/synth-adapter-ext.js');
include('/utils/syntax.js');
include('/synth/grammar.js');

(function(){

    function createSequence() {
        var seq = new Player.Sequence(psynth.SynthAdapter);
        seq.writeHeader();
        // #00: frame(0, on(17, 127))
        seq.writeDelta(0); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #02: frame(2, off(17))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #04: frame(2, on(29, 127))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(127); seq.writeEOF();
        // #06: frame(2, off(29))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(0); seq.writeEOF();
        // #08: frame(2, on(17, 127))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #09: frame(1, off(17))
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #10: frame(1, on(17, 127))
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #11: frame(1, off(17))
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #12: frame(1, on(29, 127))
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(127); seq.writeEOF();
        // #14: frame(2, off(29))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(0); seq.writeEOF();
        // #16: frame(2, end)
        seq.writeDelta(2); seq.writeEOS();
        return seq;
    }

    function compare(a1, a2) {
        var a = a1, b = a2;
        if (a1.length < a2.length) { a = a2; b = a1; }
        for (var i=0; i<a.length; i++) {
            if (a[i] != b[i]) return i+1;
        }
        return 0;
    }

    function test(lbl, action, errors) {
        Dbg.pr(lbl + '..');
        var err = action();
        if (!err) Dbg.prln('Ok');
        else errors.push(err);
        return err;
    }

    function test_synthAdapterToDataSeries() {
        var errors = [];
        var series = psynth.SynthAdapter.toDataSeries(createSequence());
        var channelCount = Object.keys(series);

        test('Channel count', () => {
            if (channelCount.length != 2)  return `Channel count: Expected 2 but received ${channelCount.length}!`;
        }, errors);

        var notes = series[psynth.SynthAdapter.SETNOTE];
        var velocity = series[psynth.SynthAdapter.SETVELOCITY];

        test('Note channel', () => !notes ? 'SetNote channel missing!' : (notes.data.length != 5) ? `expected to have 5 notes  but received ${notes.data.length}!` : false, errors);
        test('Velocity', () => !velocity ? 'SetVelocity channel missing!' : (velocity.data.length != 5) ? `expected to have 5 velocity commands  but received ${velocity.data.length}!` : false, errors);

        test('Note commands', () => {
            var testData = {
                0: [0, 17, 127, 2],
                4: [4, 29, 127, 2],
                7: [7, 17, 127, 1]
            };

            for (var fi in testData) {
                var data = notes.get(fi)[0];
                if (!Array.isArray(data)) return `Command at ${fi} did not return an array!`;
                if (compare(data, testData[fi]) != 0) return `Command at ${fi} expected to be [${testData[fi]}] but was [${data}]!`;
            }
        }, errors);

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';   
    }

    function test_synthAdapterFromDataSeries() {
        var errors = [];
        var sequence = createSequence();
        var expected = new Uint8Array(sequence.stream.buffer);
        var series = psynth.SynthAdapter.toDataSeries(sequence);
        var received =  new Uint8Array(psynth.SynthAdapter.fromDataSeries(series).stream.buffer);

        test('convert all channels', () => {
            var result = compare(expected, received);
            if (result != 0) {
                var start = result-2 >= 0 ? result-2 : 0;
                var a1 = expected.slice(start, start+4);
                var a2 = received.slice(start, start+4);
                debugger;
                return `Mismatch at ${result-1}!\n expected: ${a1}\n received: ${a2}`;
            } else {
                return false;
            }
        }, errors);

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';   
    }

    var tests = async function() {
        //Dbg.prln(test_synthAdapterToDataSeries());
        Dbg.prln(test_synthAdapterFromDataSeries());
        return 0;
    };
    public(tests, 'Synth-DataSeries tests');
})();
