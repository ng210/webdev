include('/data/dataseries.js');

(function() {

    function compare(a1, a2) {
        var a = a1, b = a2;
        if (a1.length < a2.length) { a = a2; b = a1; }
        for (var i=0; i<a.length; i++) {
            if (a[i] != b[i]) return i+1;
        }
        return 0;
    }

    function test(lbl, action, errors) {
        Dbg.pr(lbl + '..');
        var err = action();
        if (!err) err = 'Ok';
        else errors.push(err);
        Dbg.prln(err);
        return err;
    }

    function test_ds(ds) {
        var errors = [];
        
        // iterate
        test('Iterate', () => {
            var result = 0;
            var expected = 0 + 25 + 10 + 35 +20 +45 + 30 + 55 + 40 + 65;
            ds.iterate( 0, 20, (value, it, series) => {
                if (value && value[1] != undefined) {
                    result += value[1];
                }
            }, errors);
            return (result != expected) ? `Iterate: Expected ${expected} but received ${result}!` : null;
        }, errors);

        // getInfo
        test('GetInfo..', () => {
            var info = ds.getInfo();
            if (info.min[0] != 0 || info.max[0] != 18 || info.min[1] != 0 || info.max[1] != 65)
                return `GetInfo: min (${info.min}) max (${info.max}) not correct!`;
        }, errors);

        // get - found
        test('Get(found)..', () => {
            result = ds.get(12);
            var ri = result.findIndex(x => x[0] != 12);
            if (ri != -1)
                return `Get: element with (${result[ri]} != 12) found!`;
        }, errors);

        // get - not found
        test('Get(found)..', () => {
            result = ds.get(13);
            if (result.length > 0)
                return `Get: element with (13) should not be found!`;
        }, errors);

console.log(JSON.stringify(ds.data));

        // getRange - check both
        test('GetRange(both)..', () => {
            expected = [[2,25],[4,10],[8,20],[12,30]];
            result = ds.getRange([2, 4], [15,30]);
            for (var i=0; i<expected.length; i++) {
                if (!result[i] || compare(expected[i], result[i]) != 0) {
                    return `GetRange: result contains invalid entry at ${i} (${result[i]})`;
                }
            }
        }, errors);

        // getRange - check x
        test('GetRange(x only)..', () => {
            expected = [[2,25],[4,10],[6,35],[8,20],[10,45],[12,30],[14,55]];
            result = ds.getRange([2,], [15,]);
                for (var i=0; i<expected.length; i++) {
                if (!result[i] || compare(expected[i], result[i]) != 0) {
                    return `GetRange: result contains invalid entry at ${i} (${result[i]})`;
                }
            }
        }, errors);

        // getRange - check y
        test('GetRange(y only)..', () => {
            expected = [[4,10],[8,20]];
            result = ds.getRange([,4], [,20]);
                for (var i=0; i<expected.length; i++) {
                if (!result[i] || compare(expected[i], result[i]) != 0) {
                    return `GetRange: result contains invalid entry at ${i} (${result[i]})`;
                }
            }
        }, errors);

        // set - update
        test('Set(update)..', () => {
            ds.isStrict = true;
            ds.set([2, 5]);
            ds.isStrict = false;
            if (ds.get([2, ]).length == 0 && ds.get([2, 5]).length != 0) {
                return `Set: update of [2, 25] to [2,5] failed!`;
            }
        }, errors);

        // set - insert
        test('Set(insert)..', () => {
            ds.set([3, 2]);
            result = ds.get([3, 2]);
            if (result.length != 1) {
                return `Set: update of [3, 2] failed!`;
            }
        }, errors);

        // removeRange
        test('RemoveRange..', () => {
            ds.removeRange([2, 4], [15,30]);
            var expected =  [[0,0],[3,2],[6,35],[10,45],[14,55],[16,40],[18,65]];
            for (var i=0; i<expected.length; i++) {
                if (!ds.data[i] || compare(expected[i], ds.data[i]) != 0) {
                    return `RemoveRange: remaining elements contains invalid entry at ${i} (${ds.data[i]})`;
                }
            }
        }, errors);

        // // setRange
        // test('SetRange(not strict)..', () => {
        //     ds.set([3, 6]);
        //     result = ds.get([3, 6]);
        //     if (result.length != 0) {
        //         errors.push(`Set: update of [3, 6] failed!`);
        //     }
        // });

        // test('SetRange(strict)..', () => {
        //     ds.set([3, 6]);
        //     result = ds.get([3, 6]);
        //     if (result.length != 0) {
        //         errors.push(`Set: update of [3, 6] failed!`);
        //     }
        // });


        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';   
    }
    function test_DataSeries() {
        Dbg.prln('Test DataSeries');
        var arr = [];
        for (var i=0; i<10; i++) {
            arr[i] = [2*i,  Math.floor(5*i + (i%2)*20)];
        }
        var ds = new DataSeries(arr);
        return test_ds(ds);
    }

    function test_DataSeriesCompare() {
        var errors = [];
        var ds = new DataSeries();
        // test DataSeries.compare
        Dbg.prln('DataSeries.Compare');
        test('Compare(a.x < b.x, a.y < b.y)..', () => { if (!(ds.compare([0, 0], [1, 1]) < 0) ) return 'failed'; }, errors);
        test('Compare(a.x < b.x, a.y = b.y)..', () => { if (!(ds.compare([0, 0], [1, 0]) < 0) ) return 'failed'; }, errors);
        test('Compare(a.x < b.x, a.y > b.y)..', () => { if (!(ds.compare([0, 1], [1, 0]) < 0) ) return 'failed'; }, errors);

        test('Compare(a.x = b.x, a.y < b.y)..', () => { if (!(ds.compare([1, 0], [1, 1]) < 0) ) return 'failed'; }, errors);
        test('Compare(a.x = b.x, a.y = b.y)..', () => { if (!(ds.compare([1, 0], [1, 0]) == 0) ) return 'failed'; }, errors);
        test('Compare(a.x = b.x, a.y > b.y)..', () => { if (!(ds.compare([1, 1], [1, 0]) > 0) ) return 'failed'; }, errors);

        test('Compare(a.x > b.x, a.y < b.y)..', () => { if (!(ds.compare([1, 0], [0, 1]) > 0) ) return 'failed'; }, errors);
        test('Compare(a.x > b.x, a.y = b.y)..', () => { if (!(ds.compare([1, 0], [0, 0]) > 0) ) return 'failed'; }, errors);
        test('Compare(a.x > b.x, a.y > b.y)..', () => { if (!(ds.compare([1, 1], [0, 0]) > 0) ) return 'failed'; }, errors);

        test('Compare(a.x < b.x)..', () => { if (!(ds.compare([0, ], [1, ]) < 0) ) return 'failed'; }, errors);
        test('Compare(a.x = b.x)..', () => { if (!(ds.compare([1, ], [1, ]) == 0) ) return 'failed'; }, errors);
        test('Compare(a.x > b.x)..', () => { if (!(ds.compare([1, ], [0, ]) > 0) ) return 'failed'; }, errors);

        test('Compare(a.y < b.y)..', () => { if (!(ds.compare([undefined, 0], [1, 1]) < 0) ) return 'failed'; }, errors);
        test('Compare(a.y = b.y)..', () => { if (!(ds.compare([undefined, 0], [1, 0]) == 0) ) return 'failed'; }, errors);
        test('Compare(a.y > b.y)..', () => { if (!(ds.compare([undefined, 1], [1, 0]) > 0) ) return 'failed'; }, errors);

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';   
    }

    var tests = async function() {
        test_DataSeriesCompare();
        test_DataSeries();
        //Dbg.prln(test_V2DataSeries());
        return 0;
    };
    
    public(tests, 'Data tests');
})();