(function() {
    var psynth = {
        theta: 2 * Math.PI
    };

    // 00 01 02 03 04 05 06 07 08 09 10 11 12
    // C  C# D  D# E  F  F# G  G# A  A# H  C'
    // 0 = 0, 1 = C-1, 70 = A4 = 440Hz
    psynth.freqTable = (function() {
        var table = [0];
        for (var i=0; i<128; i++) {
            var oi = Math.floor(i/12);
            var ti = (i % 12) - 9;
            var base = 440*Math.pow(2, oi-5);
            table.push(base*Math.pow(2, ti/12));
        }
        return table;
    })();

    psynth.p2f_ = function p2f_(p) {
        var i = Math.floor(p);
        var f = p - i;
        var f1 = psynth.freqTable[i];
        var f2 = psynth.freqTable[i+1];
        return (1-f)*f1 + f*f2;
    }

    // c = pow(2, 1/12); f = pow(c, pitch)*ref_freq (=C0)
    psynth.p2f = p => ((p == 0) ? 0.0 : (Math.pow(1.05946309436, p) * 7.7169265821269392473555397165444));


    public(psynth, 'psynth');
})();
