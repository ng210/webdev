 (function() {

    function _match(v1, v2) {
        var result = Math.abs(v1.x - v2.x) < Number.EPSILON && Math.abs(v1.y - v2.y) < Number.EPSILON;
        return result;
    }
/******************************************************************************
 Data series are at least 2 dimensional, enumerable, sortable structures. It is
 a list of vectors (x, y[, ...]). The list can be sorted by x to improve search
 performance.
 A value may not exist at the requested index.
 Supported methods
 - data get(x)
 - set(x, value)
 - removeAt(ix)
 - data getRange(range)
 - info getInfo()
 - point getAsPoint(ix, value)
 - point getByIndex(ix)
 
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

    // The default implementation uses a simple array of numbers.
    // The index is used as x and the stored value as y.
    // Since array indexing is continuous, unassigned indices store
    // undefined.
    // Examples:
    //   [1, 3, 6, undefined, 7, 9, 10, ...] or
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
