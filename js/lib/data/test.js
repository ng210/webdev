include('stream.js');
include('dataseries.js');
include('datalink.js');
include('graph.js');

(function() {

    function test_Stream() {
        message('Test Stream', 1);

        test('Should create an empty Stream with capacity of 10', context => {
            var s = new Stream(10);
            context.assert(s.size, '=', 10);
            context.assert(s.length, '=', 0);
        });

        test('Should create a Stream by cloning an ArrayBuffer', context => {
            var buffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).buffer;
            var s = new Stream(buffer);
            context.assert(s.size, '=', 10);
            context.assert(s.length, '=', 10);
            for (var i=1; i<=10; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 10);
            context.assert(s.buffer, '!=', buffer);
        });

        test('Should create a Stream from ArrayBuffer with offset and length', context => {
            var buffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).buffer;
            var s = new Stream(buffer, 2, 4);
            context.assert(s.size, '=', 10);
            context.assert(s.length, '=', 4);
            for (var i=3; i<=6; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 4);
            context.assert(s.buffer, '=', buffer);
        });

        test('Should create a Stream from an array', context => {
            var array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            var s = new Stream(array);
            context.assert(s.size, '=', 10);
            context.assert(s.length, '=', 10);
            for (var i=1; i<=10; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 10);
        });

        test('Should create a Stream from an array with offset and length', context => {
            var array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            var s = new Stream(array, 2, 4);
            context.assert(s.size, '=', 4);
            context.assert(s.length, '=', 4);
            for (var i=3; i<=6; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 4);
        });

        test('Should create a Stream by cloning a TypedArray', context => {
            var typedArray = new Uint16Array(10);
            var view = new DataView(typedArray.buffer);
            for (var i=0; i<10; i++) view.setUint16(2*i, 1+i);

            var s = new Stream(typedArray);
            context.assert(s.size, '=', 20);
            context.assert(s.length, '=', 20);
            for (var i=1; i<=10; i++) {
                context.assert(s.readUint16(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 20);
            context.assert(s.buffer, '!=', typedArray.buffer);
        });

        test('Should create a Stream from a TypedArray with offset and length', context => {
            var typedArray = new Uint16Array(10);
            var view = new DataView(typedArray.buffer);
            for (var i=0; i<10; i++) view.setUint16(2*i, 1+i);

            var s = new Stream(typedArray, 2, 4);
            context.assert(s.size, '=', 20);
            context.assert(s.length, '=', 8);
            for (var i=3; i<=6; i++) {
                context.assert(s.readUint16(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 8);
            context.assert(s.buffer, '=', typedArray.buffer);
        });


        test('Should create a Stream from array', context => {
            var s = new Stream([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            context.assert(s.size, '=', 10);
            context.assert(s.length, '=', 10);
            for (var i=1; i<=10; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 10);
        });
        test('Should create a Stream from array with offset and length', context => {
            var s = new Stream([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2, 4);
            context.assert(s.size, '=', 4);
            context.assert(s.length, '=', 4);
            for (var i=3; i<=6; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 4);
        });

        test('Should create a Stream by cloning a Stream', context => {
            var s = new Stream(new Stream([1,2,3,4,5,6,7,8,9,10]));
            context.assert(s.size, '=', 10);
            context.assert(s.length, '=', 10);
            for (var i=1; i<=10; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 10);
        });
        test('Should create a Stream from Stream with offset and length', context => {
            var stream = new Stream([1,2,3,4,5,6,7,8,9,10]);
            var s = new Stream(stream, 2, 4);
            context.assert(s.size, '=', 10);
            context.assert(s.length, '=', 4);
            for (var i=3; i<=6; i++) {
                context.assert(s.readUint8(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 4);
        });

        test('Should create a Stream from DataView', context => {
            var typedArray = new Uint16Array(10).fill(-1);
            var view = new DataView(typedArray.buffer, 2*2, 2*4);
            for (var i=0; i<4; i++) view.setUint16(2*i, 1+i);
            var s = new Stream(view);
            context.assert(s.size, '=', 20);
            context.assert(s.length, '=', 8);
            for (var i=1; i<=4; i++) {
                context.assert(s.readUint16(), '=', i);
            }
            context.assert(s.writePosition, '=', 0);
            context.assert(s.readPosition, '=', 8);
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

    function test_DataLink() {
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
            dl1.add('name');
            dl1.addHandler('name', transform, null, [1,2,3]);
            dl1.name = 'charlie';
            context.assert(obj1.name, '=', 'Joe => Charlie (1,2,3)');
        });
        test("Should add link to the field 'name' with transform and handler", context => {
            obj1.name = 'Joe';
            var dl1 = new DataLink(obj1);
            dl1.add( 'name');
            dl1.addHandler('name', transform, null, [1,2,3]);
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

    function createTestGraph() {
            //      v0
            //     /  \
            //   v1    v2
            //   /   / | \
            //  v3-v4 v5  v6
            var graph = new Graph();
            var v0 = graph.addVertex('v0');
            var v1 = graph.addVertex(v0, 'v1', 'e01');
            var v2 = graph.addVertex(v0, 'v2', 'e02');
            var v3 = graph.addVertex(v1, 'v3', 'e13');
            var v4 = graph.addVertex(v2, 'v4', 'e24');
            graph.addEdge(v3, v4, 'e34');
            graph.addVertex(v2, 'v5', 'e25');
            graph.addVertex(v2, 'v6', 'e26');
            return graph;
    }

    function test_Graph() {
        message('Test Graph');
        test('Should create a graph with 6 vertices and 7 edges', context => {
            var graph = createTestGraph();
            context.assert(graph.vertices.length, '=', 7);
            context.assert(graph.edges.length, '=', 7);
            var v2 = graph.vertices.find(v => v.data == 'v2');
            var v3 = graph.vertices.find(v => v.data == 'v3');
            context.assert(v2.edges.length, '=', 3);
            context.assert(v3.edges.length, '=', 1);
        });
        test('Should create a full graph of 10 nodes', context => {
            var n = 10;
            var graph = Graph.createComplete(n, false, v => v.name = v.data, null);
            for (var i=0; i<n; i++) {
                var v = graph.vertices[i];
                context.assert(v.name, '=', 'v'+i);
                context.assert(v.edges.length, '=', n-1);
            }    
        });
        test('Should create a full 8-level binary tree', context => {
            var graph = Graph.createCompleteTree(2, 8, false);
            context.assert(graph.vertices.length, '=', 255);
            context.assert(graph.edges.length, '=', 2*254);
            context.assert(graph.vertices[0].data, '=', 'v000');
        });
        test('Should DFS traverse a complete graph', context => {
            var graph = Graph.createComplete(5);
            var labels = [];
            graph.DFS(graph.vertices[0], v => {labels.push(`→${v.data}`)}, v => {labels.push(`←${v.data}`)}, null);
            context.assert(labels.join(''), '=', '→v0→v1←v1→v2←v2→v3←v3→v4←v4←v0');
        });
        test('Should BFS traverse a complete graph', context => {
            var graph = Graph.createComplete(5);
            var labels = [];
            graph.BFS(graph.vertices[0], v => {labels.push(`→${v.data}`)}, v => {labels.push(`←${v.data}`)}, null, null);
            context.assert(labels.join(''), '=', '→v0←v0→v1→v2→v3→v4←v1←v2←v3←v4');
        });
        test('Should find a path in a graph', context => {
            var graph = new Graph();
            var v = [];
            v.push(graph.createVertex()); v.push(graph.createVertex());
            v.push(graph.createVertex()); v.push(graph.createVertex());
            v.push(graph.createVertex()); v.push(graph.createVertex());
            graph.addEdge(v[0], v[1]); graph.addEdge(v[0], v[3]);
            graph.addEdge(v[1], v[0]); graph.addEdge(v[1], v[2]); graph.addEdge(v[1], v[4]);
            graph.addEdge(v[2], v[1]); graph.addEdge(v[2], v[5]);
            graph.addEdge(v[3], v[0]); graph.addEdge(v[3], v[4]);
            graph.addEdge(v[4], v[1]); graph.addEdge(v[4], v[3]);
            graph.addEdge(v[5], v[2]);

            var path = graph.findPath(v[5], v[4]);
            context.assert(path, '!=', null);
            var labels = [path[0].from.id];
            for (var i=0; i<path.length; i++) {
                labels.push(path[i].to.id);
            }
            context.assert(labels.join(), '=', '5,2,1,4');   //'→v0←v0→v1→v2→v3→v4←v1←v2←v3←v4');
        });
    }

    var tests = () => [
        test_Stream,
        test_DataSeries,
        test_DataSeriesCompare,
        test_DataLink,
        test_Graph
    ];
    
    publish(tests, 'Data tests');
})();