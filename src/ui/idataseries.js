 (function() {
    // Data series are 2 dimensional, enumerable structures.
    // The first dimension/index selects the series, the second
    // selects a value within the selected series.
    // A value may not exist at the requested index.
    // The series may not share a common range.
    // The 3 main methods are 'get' and 'set' and 'getRange'.
    //
    // Array get(seriesId, x)
    // Returns every value stored at the selected x within
    // the requested series or null.
    // - the selected series is iterated to locate entries with
    //   the given x
    // - the values of the matching entries are added to the
    //   result along with x to form [x,y] pairs (data point)
    //
    // Value set(seriesId, x, y)
    // This method sets, modifies or removes an entry at the
    // requested x within the selected series and Returns the
    // old value.
    // - the selected series is iterated to locate entries with
    //   the given x and y value
    // - if an entry was
    //   - found, it will be removed
    //   - not found it will be set or modified
    // - set and modify are distinguished only by looking at the
    //   internal data structure: an existing value at x is
    //   modified otherwise a new value is set (y != value at x)
    // - The series may allow or deny the storage of multiple
    //   values at the same x. If multiple values are allowed,
    //   the 'get' method can return more than one data points
    //   and 'getRange' can return multiple entries with the
    //   same x.
    //
    // Info getRange(seriesId, start, end, data)
    // Adds data points with x values between start and end
    // to the 'data' variable as a flat Array, and returns
    // information about the range.
    // - The information includes
    //   - count: count of data points within the range
    //   - minX: the smallest x of found points
    //   - maxX: the biggest x of found points
    //   - minY: the smallest y of found points
    //   - maxY: the biggest y of found points
    // - The points in 'data' are sorted by x.
    // interpolation, step
    //   
    //
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
