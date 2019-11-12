include('/ui/idataseries.js');
(function() {

    // Uses a simple array
    function SimpleSeries() {
        var series = [ [], [] ];
        // data is created in sorting order
        for (var i=0; i<20; i++) {
            series[0].push(i%2 ? i : undefined);
            series[1].push(1 - (i%2) ? 20-i : undefined);
        }
        IDataSeries.call(this, series);
        this.constructor = SimpleSeries;
    }
    SimpleSeries.prototype = new IDataSeries;


    function TestData(x, y) {
        this.x = x;
        this.y = y;
    }

    function ComplexSeries() {
        var series = {
            'ints': [],
            'floats': []
        };
        // data is created in sorting order
        for (var i=0; i<20; i++) {
            series.ints.push(new TestData(i, i));
            series.ints.push(new TestData(i, i + 2));
            series.floats.push(new TestData(0.1*i, 0.5*i));
            series.floats.push(new TestData(0.2*i, 0.5*i + 2));
        }
        IDataSeries.call(this, series);
        this.constructor = ComplexSeries;
    }
    ComplexSeries.prototype = new IDataSeries;

    ComplexSeries.prototype.findIndex = function(seriesId, callback) {
        var indices = [];
        var series = this.data[seriesId];
        if (series) {
            for (var i in series) {
                if (callback(i)) {
                    indices.push(i);
                }
            }
        }
        return indices;
    };

	ComplexSeries.prototype.get = function(seriesId, ix) {
        // multiple values at the same ix possible!
        var data = [];
        var indices = this.findIndex(seriesId, i => i == ix);
        for (var i=0; i<indices.length; i++) {
            data.push(ix, this.data[seriesId][indices[i]]);
        }
        return data;
    };

	ComplexSeries.prototype.set = function(seriesId, ix, value) {
        var indices = this.findIndex(seriesId, i => i == ix);
        if (indices.length > 0) {
            // remove and insert
            if (this.data[seriesId][indices[0]] == value) {
                value = undefined;
            }
            this.data[seriesId].splice(indices[0], 1, value);
        } else {
            // new
            if (this.data[seriesId] == undefined) {
                this.data[seriesId] = [];
            }
            this.data[seriesId].splice(ix, 0, value);
        }
    };

    ComplexSeries.prototype.remove = function(seriesId, ix, value) {

    };

    public({ 'SimpleSeries': SimpleSeries, 'ComplexSeries': ComplexSeries }, 'TestDataSeries');
})();
