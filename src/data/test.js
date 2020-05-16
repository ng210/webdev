include('/data/stream.js');
include('/data/dataseries.js');

(function() {

    function test_Stream() {

        test('Should create an empty Stream with capacity of 10', context => {
            var s = new Stream(10);
            context.assert(s.size, '=', 10);
        });
        test('Should create a Stream from array', context => {
            var s = new Stream(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
            context.assert(s.size, '=', 10);
            for (var i=1; i<=10; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 10);
        });
        test('Should create a Stream from ArrayBuffer', context => {
            var s = new Stream(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).buffer);
            context.assert(s.size, '=', 10);
            for (var i=1; i<=10; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 10);
        });
        test('Should read proper values from Stream', context => {
            var s = new Stream(new Uint32Array([0x00434241, 0x04030201, 0x08070605, 0x0000C03F]));
            context.assert(s.size, '=', 16);
            context.assert(s.readPosition, '=', 0);
            context.assert(s.readString(), '=', 'ABC');
            context.assert(s.readUint8(), '=', 1);
            context.assert(s.readUint8(), '=', 2);
            context.assert(s.readUint16(), '=', 0x0304);
            context.assert(s.readUint32(), '=', 0x05060708);
            context.assert(s.readFloat32(), '=', 1.5);
        });
    }

    function test_DataSeries() {
        var arr = [];
        for (var i=0; i<10; i++) {
            arr[i] = [2*i,  Math.floor(5*i + (i%2)*20)];
        }
        var ds = new DataSeries(arr);

        test('Should iterate through all items', function (context) {
            ds.iterate( (value, it, series) => {
                context.assert(value[0], '=', arr[it.ix][0]);
                context.assert(value[1], '=', arr[it.ix][1]);
            });
        });

        test('Should return correct info', context => {
            var info = ds.getInfo();
            var expected = {
                "min": [0, 0],
                "max": [18, 65]
            };
            context.assert(info, ':=', expected);
        });

        test('Should find element', context => {
            var result = ds.get(12);
            context.assert(result, '!empty');
        });

        test('Should not find element', context => {
            var result = ds.get(13);
            context.assert(result, 'empty');
        });

        test('Should return range of [x,y]', context => {
            var expected = [[2,25], [4,10], [8,20], [12,30]];
            var result = ds.getRange([2, 4], [15,30]);
            context.assert(result, ':=', expected);
        });

        test('Should return range of x', context => {
            var expected = [[2,25],[4,10],[6,35],[8,20],[10,45],[12,30],[14,55]];
            var result = ds.getRange([2,], [15,]);
            context.assert(result, ':=', expected);
        });

        test('Should return range of y', context => {
            var expected = [[4,10],[8,20]];
            var result = ds.getRange([,4], [,20]);
            context.assert(result, ':=', expected);
        });

//         // set - update
//         test('Set(update)..', () => {
//             ds.isStrict = true;
//             ds.set([2, 5]);
//             ds.isStrict = false;
//             if (ds.get([2, ]).length == 0 && ds.get([2, 5]).length != 0) {
//                 return `Set: update of [2, 25] to [2,5] failed!`;
//             }
//         }, errors);

//         // set - insert
//         test('Set(insert)..', () => {
//             ds.set([3, 2]);
//             result = ds.get([3, 2]);
//             if (result.length != 1) {
//                 return `Set: update of [3, 2] failed!`;
//             }
//         }, errors);

//         // removeRange
//         test('RemoveRange..', () => {
//             ds.removeRange([2, 4], [15,30]);
//             var expected =  [[0,0],[3,2],[6,35],[10,45],[14,55],[16,40],[18,65]];
//             for (var i=0; i<expected.length; i++) {
//                 if (!ds.data[i] || compare(expected[i], ds.data[i]) != 0) {
//                     return `RemoveRange: remaining elements contains invalid entry at ${i} (${ds.data[i]})`;
//                 }
//             }
//         }, errors);

//         // // setRange
//         // test('SetRange(not strict)..', () => {
//         //     ds.set([3, 6]);
//         //     result = ds.get([3, 6]);
//         //     if (result.length != 0) {
//         //         errors.push(`Set: update of [3, 6] failed!`);
//         //     }
//         // });

//         // test('SetRange(strict)..', () => {
//         //     ds.set([3, 6]);
//         //     result = ds.get([3, 6]);
//         //     if (result.length != 0) {
//         //         errors.push(`Set: update of [3, 6] failed!`);
//         //     }
//         // });
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
        return [
            test_Stream(),

            test_DataSeries()
        ];
    };
    
    public(tests, 'Data tests');
})();