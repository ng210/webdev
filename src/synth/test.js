
include('/ge/player/player-lib.js');
include('/synth/synth-adapter.js');
include('/synth/synth-adapter-ext.js');
include('/utils/syntax.js');
include('/synth/grammar.js');

(function(){

    function createSequence() {
        var seq = new Player.Sequence(psynth.SynthAdapter);
        seq.writeHeader();
        // #0
        seq.writeDelta(0); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #2
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #4
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(127); seq.writeEOF();
        // #6
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(0); seq.writeEOF();
        // #7
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #8
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #9
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #10
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #12
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(127); seq.writeEOF();
        // #14
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(0); seq.writeEOF();
        // #16
        seq.writeDelta(0); seq.writeEOS();
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

    function setup() {
        var ds = psynth.SynthAdapter.toDataSeries(createSequence());
        return ds;
    }

    function test_synthAdapterToDataSeries() {
        var errors = [];
        var map = setup();
        var channelCount = Object.keys(map);
        if (channelCount.length != 1) {
            errors.push(`Channel count: Expected 1 but received ${channelCount.length}!`);
        }

        var ds = map[psynth.SynthAdapter.SETNOTE];
        Dbg.prln(' - Each');
        var indices = ds.query(q => { q.continue = true; return q.this.getAsPoint(q.ix).y != undefined; });
        var expected = [0, 1, 2, 3, 4];
        if (compare(indices, expected)) {
            errors.push(`Each: Expected ${expected} but received ${indices}!`);
        }

        Dbg.prln(' - FindFirst');
        indices = ds.query(q => !(q.continue = q.this.getAsPoint(q.ix).y != 29));
        expected = [1];
        if (compare(indices, expected)) {
            errors.push(`FindFirst: Expected ${expected} but received ${indices}!`);
        }

        Dbg.prln(' - FindAll');
        indices = ds.query(q => { q.continue = true; return q.this.getAsPoint(q.ix).y == 29; });
        expected = [1, 4];
        if (compare(indices, expected)) {
            errors.push(`FindAll: Expected ${expected} but received ${indices}!`);
        }

        Dbg.prln(' - InRange');
        indices = ds.getRange({ start:4, end:10 });
        expected = [4, 29, 7, 17, 9, 17];
        if (compare(indices, expected)) {
            errors.push(`InRange: Expected ${expected} but received ${indices}!`);
        }

        Dbg.prln(' - getInfo');
        var info = ds.getInfo();
        Dbg.prln(JSON.stringify(info));
        if (info.min.x != 0 || info.min.y != 17 || info.max.x != 12 || info.max.y != 29) {
            errors.push(`getInfo: Expected {min:{x:0, y:17}, max:{x:12, y:29}} but received ${JSON.stringify(info)}!`);
        }

        // Dbg.prln(' - contains');
        // if (!ds.contains(8, 20)) {
        //     errors.push(`contains: Expected to return true!`);
        // }

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';   
    }

    var tests = async function() {
        Dbg.prln(test_synthAdapterToDataSeries());
        return 0;
    };
    public(tests, 'Synth-DataSeries tests');
})();
