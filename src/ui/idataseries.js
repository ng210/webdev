 (function() {

    // The enumerable is sorted by its index (i.e. Object or Array)
    // Arrays are always sorted (i < j if a[i] comes before a[j])
    // Default implementation is for arrays of simple values (Number, String, ...) containing 1 series only
    // Example: enumerable =[ [1, 3, 6, 7, 9, 10, ...] ] or { 'values': [0.1, 0.4, 0.8, 0.3, -0.2] }
    // - get returns value at index
    // - set clears or modifies value at index
    function IDataSeries(enumerable) {
        this.data = enumerable || [ [] ];
        this.step = 1;
    }
	IDataSeries.prototype.getRange = function(seriesId, start, end, data) {
        var info = { count:0, min:null, max:null };
        if (this.data && this.data[seriesId] != undefined) {
            for (var x=start; x<end; x+=this.step) {
                var points = this.get(seriesId, x);
                // get returns data points in the form of an Array
                // [x1, y1, x2, y2, ..., xN, yN]
                if (points != null) {
                    if (info.min == null) info.min = x;
                    data.push(...points);
                    info.count++;
                    info.max = x;
                }
            }
        }
        return info;
    };
	IDataSeries.prototype.get = function(seriesId, ix) {
        return this.data[seriesId][ix] != undefined ? [ix, this.data[seriesId][ix]] : null;
    };
	IDataSeries.prototype.set = function(seriesId, ix, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        // modify or clear value at index
        this.data[seriesId][ix] = this.data[seriesId][ix] != value ? value : undefined;
    };
    IDataSeries.prototype.push = function(seriesId, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        this.set(seriesId, this.data[seriesId].length, value);
    };
	IDataSeries.prototype.add = function(index, chnId) { throw new Error('Not implemented!'); };
	IDataSeries.prototype.remove = function(index, chnId) { throw new Error('Not implemented!'); };

    public(IDataSeries, 'IDataSeries');
})();