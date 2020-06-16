include('stream.js');
include('dataseries.js');
include('datalink.js');

(function() {

    function test_Stream() {
        message('Test Stream');
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
        message('Test DataSeries');

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

        test('Should update an element', context => {
            ds.isStrict = true;
            ds.set([2, 5]);
            ds.isStrict = false;
            var expected = [ [2, 5] ];
            context.assert(ds.get([2, ]), ':=', expected);
        });

        test('Should insert an element', context => {
            ds.set([3, 2]);
            context.assert(ds.get([3, 2]), '!empty');
        });

        test('Should remove a range', context => {
            ds.removeRange([2, 4], [15,30]);
            var expected =  [ [0,0], [3,2], [6,35], [10,45], [14,55], [16,40], [18,65] ];
            context.assert(ds.data, ':=', expected);
        });
    }

    function test_DataSeriesCompare() {
        message('Test DataSeries.compare');
        var ds = new DataSeries();

        test('Compare([0, 0], [1, 1])', context => context.assert(ds.compare([0, 0], [1, 1]), '<', 0) );
        test('Compare([0, 0], [1, 0])', context => context.assert(ds.compare([0, 0], [1, 0]), '<', 0) );
        test('Compare([0, 1], [1, 0])', context => context.assert(ds.compare([0, 1], [1, 0]), '<', 0) );

        test('Compare([1, 0], [1, 1])', context => context.assert(ds.compare([1, 0], [1, 1]), '<', 0) );
        test('Compare([1, 0], [1, 0])', context => context.assert(ds.compare([1, 0], [1, 0]), '=', 0) );
        test('Compare([1, 1], [1, 0])', context => context.assert(ds.compare([1, 1], [1, 0]), '>', 0) );

        test('Compare([1, 0], [0, 1])', context => context.assert(ds.compare([1, 0], [0, 1]), '>', 0) );
        test('Compare([1, 0], [0, 0])', context => context.assert(ds.compare([1, 0], [0, 0]), '>', 0) );
        test('Compare([1, 1], [0, 0])', context => context.assert(ds.compare([1, 1], [0, 0]), '>', 0) );

        test('Compare([0, ], [1, ])', context => context.assert(ds.compare([0, ], [1, ]), '<', 0) );
        test('Compare([1, ], [1, ])', context => context.assert(ds.compare([1, ], [1, ]), '=', 0) );
        test('Compare([1, ], [0, ])', context => context.assert(ds.compare([1, ], [0, ]), '>', 0) );

        test('Compare([, 0], [1, 1])', context => context.assert(ds.compare([0, ], [1, ]), '<', 0) );
        test('Compare([, 0], [1, 0])', context => context.assert(ds.compare([1, ], [1, ]), '=', 0) );
        test('Compare([, 1], [1, 0])', context => context.assert(ds.compare([1, ], [0, ]), '>', 0) );
    }

    function test_datalink() {
        message('Test DataLink');
        var obj1 = {
            name: 'Joe',
            id: 1,
            age: 32
        };
        var obj2 = {
            name: 'Jane',
            id: 2,
            age: 30
        };
        var obj3 = {
            name: 'Ryu',
            id: 3,
            age: 26,
            addName: function addName(name, args) {
                return `${this.name}-${name}-${args}`;
            }
        };
        var transform = (value, oldValue, args) => `${oldValue} => ${value.charAt(0).toUpperCase() + value.substr(1)} (${args})`;

        test("Should add link to the field 'name' without transform", context => {
            obj1.name = 'Joe';
            var dl1 = new DataLink(obj1);
            dl1.add('name');
            dl1.name = 'Charlie';
            context.assert(obj1.name, '=', 'Charlie');
        });

        test("Should add link to the field 'name' with transform", context => {
            obj1.name = 'Joe';
            var dl1 = new DataLink(obj1);
            dl1.add('name', transform, null, [1,2,3]);
            dl1.name = 'charlie';
            context.assert(obj1.name, '=', 'Joe => Charlie (1,2,3)');
        });
        test("Should add link to the field 'name' with transform and handler", context => {
            obj1.name = 'Joe';
            var dl1 = new DataLink(obj1);
            dl1.add( 'name', transform, null, [1,2,3]);
            dl1.addHandler('name', function(value, oldValue, args) { name = this.addName(value, args); }, obj3, [1,2,3]);
            var name = null;
            dl1.name = 'charlie';
            context.assert(obj1.name, '=', 'Joe => Charlie (1,2,3)');
            context.assert(name, '=', 'Ryu-charlie-1,2,3');
        });

        test("Should link 2 objects", context => {
            obj1.name = 'Joe';
            var dl1 = new DataLink(obj1);
            var dl2 = dl1.link('name', obj2, 'name');
            dl1.name = 'Charlie';
            context.assert(obj1.name, '=', 'Charlie');
            context.assert(obj2.name, '=', 'Charlie');
            dl2.name = 'Joe';
            context.assert(obj1.name, '=', 'Joe');
            context.assert(obj2.name, '=', 'Joe');
        });
    }

    var tests = () => [
        test_Stream,
        test_DataSeries,
        test_DataSeriesCompare,
        test_datalink
    ];
    
    public(tests, 'Data tests');
})();