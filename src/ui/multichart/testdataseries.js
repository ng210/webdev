include('/ui/idataseries.js');
(function() {

    // // Uses a simple array
    // function SimpleSeries() {
    //     for (var i=0; i<20; i++) {
    //         this.data.push(i%2 ? i : undefined);
    //     }
    //     IDataSeries.call(this, series);
    //     this.constructor = SimpleSeries;
    // }
    // SimpleSeries.prototype = new IDataSeries;

    function TestData(x, y) {
        this.x = x;
        this.y = y;
    }

    function TestNote(frame, note, length) {
        this.frame = frame;
        this.note = note;
        this.length = length;
    }

    function ComplexSeries() {
        IDataSeries.call(this);
        this.constructor = ComplexSeries;
    }
    ComplexSeries.prototype = new IDataSeries;

	ComplexSeries.prototype.set = function(x, y) {
        var ix = 0;
        while (ix < this.data.length && (x >= this.data[ix].x)) ix++;
        this.data.splice(ix, 0, new TestData(x, y));
        return null;
    };

    ComplexSeries.prototype.getAsPoint = function(ix) { return this.data[ix] };

    public({'TestData': TestData, 'TestNote': TestNote, 'ComplexSeries': ComplexSeries }, 'TestDataSeries');
})();
