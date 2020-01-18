 (function() {

    function _match(v1, v2) {
        var result = Math.abs(v1.x - v2.x) < Number.EPSILON && Math.abs(v1.y - v2.y) < Number.EPSILON;
        return result;
    }
/******************************************************************************
 Data series are 2 dimensional, enumerable structures. The first dimension is
 the series, the second dimension indexes a value within the selected series.
 - A value may not exist at the requested index.
 - The series may not share a common range.
 The 3 main methods are 'get', 'set' and 'getRange'.
 
 Array get(seriesId, x)
 Returns every value stored at the selected x within the requested series as
 an array or null.
 - The selected series is iterated to locate entries with the given x.
 - The values of the matching entries are added to the result along with the x
   to form [x,y] pairs (data points). These pairs are written as 2 numbers.
 - The method returns null if a series identified by 'seriesId' or a value at x
   cannot be found.
 
 Value set(seriesId, x, y)
 This method sets, modifies or removes an entry at the requested x within the
 selected series and eventually returns the old value.
 - The selected series is searched for entries with the given x and y value.
 - If an entry was
     - found, it will be removed or
     - not found it will be set or modified
 - Set and modify are distinguished only by looking at the internal structure:
   - value at x does not match y, the value is modified to y,
   - value at x does not exist, a new value is added and set to y.
 - A series may allow or deny the storage of multiple values at the same x.
   - With multiple values allowed, the 'get' method can return more than one
     data point and 'getRange' can return multiple values with the same x.
 
 Values getRange(seriesId, Info)
 Returns an array of data points, selected by parameters in the Info structure.
 Each data point is written as 2 values (x and y) and the function also returns
 information about the range.
 - The information includes 3 input parameters
     - step: size of step along the x axis,
     - start: start of the range of x values,
     - end: end of the range of x values,
   and 3 output parameters
     - count: count of data points within the range,
     - min: a data point with the smallest x and y within the range,
     - max: a data point with the biggest x and y within the range,
 - The points in 'Values' are sorted by x ascending.
 - The iteration tries to get a value from the selected series for each x.
 - If a value could be retrieved it is stored in the output array as a data
   point with x and y.
 - The count of minimum and maximum of x and y are stored in the info.
******************************************************************************/
    function IDataSeries(enumerable) {
        this.data = enumerable || [];
    }

    IDataSeries.prototype.query = function(callback) {
        var q = {
            this: this,
            ix: 0,
            value: null,
            continue: false
        };
        var indices = [];
        for (q.ix=0; q.ix<this.data.length; q.ix++) {
            q.value = this.data[q.ix];
            if (q.value == undefined) continue;
            if (callback.call(this, q)) {
                indices.push(q.ix);
            }
            if (!q.continue) break;
        }
        return indices;
    };

    IDataSeries.prototype.getInfo = function() {
        var info = {
            min: { x: Infinity, y: Infinity },
            max: { x: -Infinity, y: -Infinity }
        };
        this.query(data => {
            var point = this.getAsPoint(data.ix);
            if (point.y != undefined) {
                if (point.x < info.min.x) info.min.x = point.x;
                if (point.x > info.max.x) info.max.x = point.x;
                if (point.y < info.min.y) info.min.y = point.y;
                if (point.y > info.max.y) info.max.y = point.y;
            }
            data.continue = true;
            return false;
        });
        return info;
    };

    IDataSeries.prototype.getRange = function(range) {
        var indices = this.query(data => {
            var point = this.getAsPoint(data.ix);
            data.continue = point.x <= range.end;
            return data.continue && point.x >= range.start;
        });
        var data= [];
        range.min = { x: Infinity, y: Infinity };
        range.max = { x: -Infinity, y: -Infinity };
        range.count = 0;
        for (var i=0; i<indices.length; i++) {
            var ix = indices[i];
            var point = this.getAsPoint(ix);
            data.push(point.x, point.y);
            range.count++;
            if (range.min.x > point.x) range.min.x = point.x;
            if (range.max.x < point.x) range.max.x = point.x;
            if (range.min.y > point.y) range.min.y = point.y;
            if (range.max.y < point.y) range.max.y = point.y;
        }

        return data;
    };

    IDataSeries.prototype.getByIndex = function(ix) {
        return (this.data[ix] != undefined) ? this.getAsPoint(ix) : null;
    };

    IDataSeries.prototype.get = function(x) {
        var data = [];
        for (var i=0; i<this.data.length; i++) {
            var point = this.getAsPoint(i);
            if (Math.abs(point.x - x) <= Number.EPSILON) {
                data.push(point.x, point.y);
            }
        }
        return data.length ? data : null;
    };

    IDataSeries.prototype.removeAt = function(ix) {
        var start = ix;
        while (--start > 0 && this.data[start] == undefined);
        start++;
        while (++ix < this.data.length && this.data[ix] == undefined);
        this.data.splice(start, ix - start);
    };

    // The default implementation assumes a series as a simple array.
    // Examples:
    //   [1, 3, 6, 7, 9, 10, ...] or
    //   [0.1, 0.4, 0.8, 0.3, -0.2]
    IDataSeries.prototype.getAsPoint = function(ix) {
        return { x: ix, y: this.data[ix] };
    };

    IDataSeries.prototype.set = function(x, y) {
        this.data[x] = y;
    };

    IDataSeries.prototype.contains = function(x, y) {
        return this.query(data => !(data.continue = !_match(this.getAsPoint(data.ix), {x:x, y:y}))).length > 0;
    };

    public(IDataSeries, 'IDataSeries');
})();
