include('/ui/idataseries.js');

(function() {

    var dataSeries = {};

    dataSeries.V2DataPoint = function(x, y) {
        this.x = x;
        this.y = y;
        this.constructor = dataSeries.V2DataPoint;
    };

    dataSeries.V3DataPoint = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.constructor = dataSeries.V3DataPoint;
    };

    dataSeries.V4DataPoint = function(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.constructor = dataSeries.V4DataPoint;
    };

    // DataSeries storing vectors
    dataSeries.VectorDataSeries = function() {
        IDataSeries.call(this);
        this.constructor = dataSeries.VectorDataSeries;
    }
    dataSeries.VectorDataSeries.prototype= new IDataSeries;

    dataSeries.VectorDataSeries.prototype.getAsPoint = function(ix) { return this.data[ix]; };

    // DataSeries for 2-component vectors
    dataSeries.V2DataSeries = function() {
        dataSeries.VectorDataSeries.call(this);
        this.constructor = dataSeries.V2DataSeries;
    };
    dataSeries.V2DataSeries.prototype = new dataSeries.VectorDataSeries;

    dataSeries.V2DataSeries.prototype.set = function(x, y) {
        var dataPoint = new dataSeries.V2DataPoint(x, y);
        this.data.push(dataPoint);
        return dataPoint;
    };

    // DataSeries for 3-component vectors
    dataSeries.V3DataSeries = function() {
        dataSeries.VectorDataSeries.call(this);
        this.constructor = dataSeries.dataSeries.VectorDataSeries;
    };
    dataSeries.V3DataSeries.prototype = new dataSeries.VectorDataSeries;

    dataSeries.V3DataSeries.prototype.set = function(x, y, z) {
        var dataPoint = new dataSeries.V3DataPoint(x, y, z);
        this.data.push(dataPoint);
        return dataPoint;
    };

    // DataSeries for 4-component vectors
    dataSeries.V4DataSeries = function() {
        dataSeries.VectorDataSeries.call(this);
        this.constructor = dataSeries.V4DataSeries;
    };
    dataSeries.V4DataSeries.prototype = new dataSeries.VectorDataSeries;

    dataSeries.V4DataSeries.prototype.set = function(x, y, z, w) {
        var dataPoint = new dataSeries.V4DataPoint(x, y, z, w);
        this.data.push(dataPoint);
        return dataPoint;
    };

    public(dataSeries, 'DataSeries');
})();