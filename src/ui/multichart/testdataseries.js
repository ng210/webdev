include('/ui/idataseries.js');
(function() {

    function TestDataSeries(data) {
        IDataSeries.call(this, data);

        this.constructor = TestDataSeries;
    }
    TestDataSeries.prototype = new IDataSeries;

	TestDataSeries.prototype.get = function(seriesId, ix) {
        // multiple values at the same ix possible!
        var data = [];
        var series = this.data[seriesId];
        for (var i=0; i<series.length; i++) {
            if (series[i].x == ix) {
                data.push(ix, series[i].y);
            }
        }
        return data;
    };

	TestDataSeries.prototype.set = function(seriesId, ix, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        var values = this.get(seriesId, ix);
        for (var i=0; i<values.length; i+=2) {
            if (values[i].y == value) {
                // remove it
                this.remove(seriesId, ix, value);
                return;
            }
        }
        this.data[seriesId].push([ix, value]);
    };

    TestDataSeries.prototype.remove = function(seriesId, ix, value) {

    };

    public(TestDataSeries, 'TestDataSeries');
})();
