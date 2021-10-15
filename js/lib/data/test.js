include('./dictionary.js');
include('./stream.js');
include('./dataseries.js');
include('./datalink.js');
include('./graph.js');
include('./b-tree.js');
include('./map.js');

(function() {

    function test_dictionary() {
        header('Test dictionary');
        var dictionary = new Dictionary();
        test('Should add 100 items', ctx => {
            for (var i=0; i<100; i++) {
                dictionary.add('k'+i, 'v'+i);
            }
            ctx.assert(dictionary.length, '=', 100);
        });
        test('Should get 100 items', ctx => {
            var errors = 0;
            for (var i=0; i<100; i++) {
                if (dictionary.get('k'+i) != 'v'+i) errors++;
            }
            ctx.assert(errors, '=', 0);
        });
        test('Should contain keys', ctx => {
            var errors = 0;
            for (var i=0; i<100; i++) {
                if (!dictionary.containsKey('k'+i)) errors++;
            }
            ctx.assert(errors, '=', 0);
        });
        test('Should dictionary keys', ctx => {
            var errors = 0;
            var keys = dictionary.keys(k => '_' + k);
            for (var i=0; i<100; i++) {
                if (keys[i] != '_k'+i) errors++;
            }
            ctx.assert(errors, '=', 0);
        });
        test('Should dictionary values', ctx => {
            var errors = 0;
            var values = dictionary.values(v => '_' + v);
            for (var i=0; i<100; i++) {
                if (values[i] != '_v'+i) errors++;
            }
            ctx.assert(errors, '=', 0);
        });
    }

    function test_Stream() {
        header('Test Stream');

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

        test('Should create a classic hex dump of the stream', context => {
            var s = new Stream(32);
            for (var i=0; i<32; i++) s.writeUint8(i);
            var received = s.hexdump(16);
            var expected = '00 01 02 03  04 05 06 07  08 09 0a 0b  0c 0d 0e 0f\n10 11 12 13  14 15 16 17  18 19 1a 1b  1c 1d 1e 1f';
            context.assert(received, '=', expected);
        });

        test('Should dump the stream as hex string', context => {
            var s = new Stream(128).writeString('Hello World!').writeUint32(0x12345678);
            var str = s.dump();
            context.assert(str, '=', '48656c6c6f20576f726c64210012345678');
        });

        test('Should read stream from dump', context => {
            var si = new Stream(128).writeString('Hello World!').writeUint32(0x12345678);
            var str = si.hexdump();
            var so = Stream.fromDump(str);
            context.assert(si.hexdump(), '=', so.hexdump());
        });
    }

    function test_DataSeries() {
        header('Test DataSeries');

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
        header('Test DataSeries.compare');
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
        header('Test DataLink');
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
        header('Test Graph');
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
            graph.DFS(graph.vertices[0], v => {labels.push(`→${v.data}`)}, v => {labels.push(`←${v.data}`)}, null, null);
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

    function print_tree(tree, start) {
        var sb = [];
        tree.BFS(start,
            v => {
                sb.push(`${(v.edges.length ? 'I' : 'L') + v.id}: (${v.data.map((x,i) => i<v.length ? x.id : '-')})`);
            }
        );
        message(sb.join(' | '));
    }

    function test_BTree() {
        header('Test B-Tree');

        function test_tree(tree, items, ctx) {
            var result = {};
            //var d = Math.ceil(tree.degree/2);
            var maxHeight = tree.maxHeight();   //Math.floor(Math.log2((tree.vertices.length+1)/2)/Math.log2(d));
            message(`Max.height = ${maxHeight.toPrecision(4)}`);
            tree.tryGet(tree.first(), result);
            result.index--;
            for (var i=0; i<items.length; i++) {
                var item = tree.next(result);
                ctx.assert(item, '=', items[i]);
                ctx.assert(result.path.length, '<=', maxHeight);
            }
        }

        //#region CREATE TREE
        //             14, 19
        //           /    |   \
        //       4,9    15,16,  20
        //     /  |  \  17,18
        //   /    |    \  
        // 0,1,  5,6,  10,11,
        // 2,3   7,8   12,13
        var items = [];
        for (var i=0; i<21; i++) {
            items.push({id:i, value:i});
        }
        var tree = new BTree(3, 4, (a, b) => a.id - b.id);
        // create 2 internal nodes
        tree.createVertex().add(items[14]).add(items[19]);
        tree.createVertex(null, tree.root).add(items[4]).add(items[9]);
        // create 5 leaf nodes
        tree.createVertex(null, null, true).addRange(items, null,  0, 4);
        tree.createVertex(null, null, true).addRange(items, null,  5, 4);
        tree.createVertex(null, null, true).addRange(items, null, 10, 4);
        tree.createVertex(null, null, true).addRange(items, null, 15, 4);
        tree.createVertex(null, null, true).addRange(items, null, 20, 1);
        // add 6 edges
        tree.addEdge(tree.root, tree.vertices[1]);
        tree.addEdge(tree.root, tree.vertices[5]);
        tree.addEdge(tree.root, tree.vertices[6]);
        tree.addEdge(tree.vertices[1], tree.vertices[2]);
        tree.addEdge(tree.vertices[1], tree.vertices[3]);
        tree.addEdge(tree.vertices[1], tree.vertices[4]);
        print_tree(tree);
        //#endregion

        //#region BASIC TESTS
        test('Should find the items in ascending order', ctx => {
            var result = {};
            for (var i=0; i<items.length; i++) {
                var isFound = tree.tryGet(items[i], result);
                ctx.assert(isFound, 'true');
                var m = {
                    0: [14, 19],
                    1: [4, 9],
                    2: [0,1,2,3],
                    3: [5,6,7,8],
                    4: [10,11,12,13],
                    5: [15,16,17,18],
                    6: [20]
                };
                var ids = m[result.node.id];
                ctx.assert(ids, '!null');
                ctx.assert(ids.includes(i), 'true');
                ctx.assert(result.index, '=', ids.indexOf(i));
            }
            test_tree(tree, items, ctx);
        });

        test('Should NOT find the items', ctx => {
            var result = {};
            message('Item #20');
            var isFound = tree.tryGet({id:21}, result);
            ctx.assert(isFound, 'false');
            ctx.assert(result.node, '=', tree.vertices[6]);
            ctx.assert(result.index, '=', -2);
            message('Item #10.5');
            isFound = tree.tryGet({id:10.5}, result);
            ctx.assert(isFound, 'false');
            ctx.assert(result.node, '=', tree.vertices[4]);
            ctx.assert(result.index, '=', -2);
        });

        test('Should return the next item', ctx => {
            var result = {};
            message('from leaf to leaf');
            tree.tryGet(items[0], result);
            var item = tree.next(result);
            ctx.assert(item, '=', items[1]);

            message('from leaf to internal');
            tree.tryGet(items[8], result);
            item = tree.next(result);
            ctx.assert(item, '=', items[9]);
            
            message('from leaf to internal with step back');
            tree.tryGet(items[13], result);
            item = tree.next(result);
            ctx.assert(item, '=', items[14]);
            
            message('from internal to leaf');
            tree.tryGet(items[19], result);
            item = tree.next(result);
            ctx.assert(item, '=', items[20]);

            message('from last');
            tree.tryGet(items[20], result);
            item = tree.next(result);
            ctx.assert(item, 'null');
        });

        // remove some items
        tree.vertices[3].data[1] = null; tree.vertices[3].data[2] = null; tree.vertices[3].data[3] = null; tree.vertices[3].length -= 3;
        tree.vertices[4].data[2] = null; tree.vertices[4].data[3] = null; tree.vertices[4].length -= 2;
        print_tree(tree, tree.vertices[1]);
        test('Should rotate left', ctx => {
            var node = tree.vertices[3];
            var parent = node.parent;
            var ei = parent.edges.findIndex(x => x.to == node);
            var right = parent.edges[ei+1].to;
            tree.rotateLeft(node, parent, ei, right);
            var result = {};
            ctx.assert(tree.tryGet(items[5], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[3]);
            ctx.assert(tree.tryGet(items[6], result), 'false');
            ctx.assert(tree.tryGet(items[7], result), 'false');
            ctx.assert(tree.tryGet(items[8], result), 'false');
            ctx.assert(result.node, '=', tree.vertices[3]);
            ctx.assert(tree.tryGet(items[9], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[3]);

            ctx.assert(tree.tryGet(items[10], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[1]);

            ctx.assert(tree.tryGet(items[11], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[4]);
            ctx.assert(tree.tryGet(items[12], result), 'false');
            ctx.assert(tree.tryGet(items[13], result), 'false');
        });
        print_tree(tree, tree.vertices[1]);
        test('Should rotate right', ctx => {
            var node = tree.vertices[4];
            var parent = node.parent;
            var ei = parent.edges.findIndex(x => x.to == node) - 1;
            var left = parent.edges[ei].to;
            tree.rotateRight(node, parent, ei, left);
            var result = {};
            ctx.assert(tree.tryGet(items[5], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[3]);
            ctx.assert(tree.tryGet(items[6], result), 'false');
            ctx.assert(tree.tryGet(items[7], result), 'false');
            ctx.assert(tree.tryGet(items[8], result), 'false');
            ctx.assert(result.node, '=', tree.vertices[3]);

            ctx.assert(tree.tryGet(items[9], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[1]);

            ctx.assert(tree.tryGet(items[10], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[4]);
            ctx.assert(tree.tryGet(items[11], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[4]);
            ctx.assert(tree.tryGet(items[12], result), 'false');
            ctx.assert(tree.tryGet(items[13], result), 'false');
        });
        print_tree(tree, tree.vertices[1]);
        test('Should merge left', ctx => {
            var node = tree.vertices[4];
            var parent = node.parent;
            var ei = parent.edges.findIndex(x => x.to == node) - 1;
            var left = parent.edges[ei].to;
            tree.mergeLeft(left, parent, ei, node);
            var result = {};
            ctx.assert(tree.tryGet(items[5], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[3]);
            ctx.assert(tree.tryGet(items[6], result), 'false');
            ctx.assert(tree.tryGet(items[7], result), 'false');
            ctx.assert(tree.tryGet(items[8], result), 'false');
            ctx.assert(tree.tryGet(items[9], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[3]);

            ctx.assert(tree.tryGet(items[10], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[3]);

            ctx.assert(tree.tryGet(items[11], result), 'true');
            ctx.assert(result.node, '=', tree.vertices[3]);
            ctx.assert(tree.tryGet(items[12], result), 'false');
            ctx.assert(tree.tryGet(items[13], result), 'false');
        });
        print_tree(tree, tree.vertices[1]);
        tree.destroy();
        //#endregion

        var _count = 12;
        items = [];
        for (var i=0; i<_count; i++) {
            items.push({id:i, value:_count-i});
        }

        //#region ADD
        test('Should add items to tree in random order', ctx => {
            var indices = new Array(items.length);
            for (var i=0; i<items.length; i++) indices[i] = i;
            tree = new BTree(3, 4, (a, b) => a.id - b.id);
            var count = indices.length;
            while (count > 0) {
                var rnd = Math.floor(count*Math.random());
                var ix = indices[rnd];
                tree.add(items[ix]);
                count--;
                indices[rnd] = indices[count];
            }
            ms = Dbg.measure( () => {
                for (var i=0; i<items.length; i++) {
                    tree.add(items[indices[i]]);
                }
            });
            message(tree.vertices.length + ' nodes');
            message('Added in ' + ms + 'ms');
            test_tree(tree, items, ctx);
        });
        tree.destroy();

        test('Should add items to tree in normal order', ctx => {
            tree = new BTree(3, 4, (a, b) => a.id - b.id);
            var ms = Dbg.measure( () => {
                for (var i=0; i<items.length; i++) {
                    tree.add(items[i]);
                    var info = [];
                }
            });
            message(tree.vertices.length + ' nodes');
            message('Added in ' + ms + 'ms');
            test_tree(tree, items, ctx);
        });

        test('Should return item at index', ctx => {
            var indices = [0, Math.floor(items.length/2), items.length-1];
            for (var i=0; i<indices.length; i++) {
                var item1 = tree.getAt(indices[i]);
                var item2 = tree.first();
                for (var j=0; j<indices[i]; j++) {
                    item2 = tree.next();
                }
                ctx.assert(item1, '=', item2);
            }
        });
        //#endregion

        //#region ITERATE
        test('Should iterate through a range of items', ctx => {
            var ms = 0;
            ms += Dbg.measure( () => {
                var from = Math.floor(tree.count/2 * Math.random());
                var length = tree.count/2;
                var to = from + length;
                var total = 0;
                var error = 0;
                var last = {id:-1, value: -1};

                tree.range(items[from], items[to], x => {
                    if (x.id < last.id) error++;
                    total += x.id;
                    last = x;
                    return error > 0;
                }, null);
                ctx.assert(error, '=', 0);
                ctx.assert(total, '=', 0.5*(length+1)*(from + to));
            }, 10);
            message(`Range took ${(ms/100).toPrecision(4)} ms`);
        });
        test('Should iterate through items', ctx => {
            var ms = 0;
            ms += Dbg.measure( () => {
                var from = Math.floor(tree.count/2 * Math.random());
                var length = tree.count/2;
                var to = from + length;
                var total = 0;
                var error = 0;
                var last = {id:-1, value: -1};

                var result = {};
                tree.tryGet(items[from], result);
                var total = result.node.data[result.index].id;
                for (var i=from+1; i<=to; i++) {
                    var item = tree.next(result);
                    if (item.id < last.id) error++;
                    total += item.id;
                    last = item;
                    if (error > 0) break;
                }
                ctx.assert(error, '=', 0);
                ctx.assert(total, '=', 0.5*(length+1)*(from + to));
            }, 10);
            message(`Iteration took ${(ms/100).toPrecision(4)} ms`);
        });
        //#endregion

        //#region REMOVE
        print_tree(tree);
        test('Should remove an item in a leaf node (simple)', ctx => {
            // simple: no merge, no item transfer is needed
            var result = {};
            var item = tree.vertices[4].data[1];
            var removed = tree.remove(item);
            ctx.assert(item, '=', removed);
            ctx.assert(tree.tryGet(removed, result), 'false');
        });
        print_tree(tree);
        test('Should remove an item in a leaf node (merge)', ctx => {
            // transfer: left items are moved to neighbours
            var result = {};
            var item = tree.vertices[4].data[1];
            var removed = tree.remove(item);
            ctx.assert(item, '=', removed);
            ctx.assert(tree.tryGet(removed, result), 'false');
        });
        print_tree(tree);
        test('Should remove an item from internal node', ctx => {
            var result = {};
            var item = tree.vertices[1].data[1];
            var removed = tree.remove(item);
            ctx.assert(item, '=', removed);
            ctx.assert(tree.tryGet(removed, result), 'false');
        });
        print_tree(tree);
        //#endregion

        tree.destroy();

        //#region MULTIPLE INDICES
        test('Should have 2 tree to index 2 attributes', ctx => {
            tree = new BTree(3, 4, (a, b) => a.id - b.id);
            var tree2 = new BTree(3, 4, (a, b) => a.value - b.value);
            var indices = new Array(items.length);
            for (var i=0; i<items.length; i++) indices[i] = i;
            var count = indices.length;
            while (count > 0) {
                var rnd = Math.floor(count*Math.random());
                var ix = indices[rnd];
                tree.add(items[ix]);
                tree2.add(items[ix]);
                count--;
                indices[rnd] = indices[count];
            }

            var node = tree.first();
            var last = {id: -1, value: -1 };
            while (node) {
                ctx.assert(tree.compare.method(last, node), '<', 0);
                last = node;
                node = tree.next();
            }

            node = tree2.first();
            last = {id: -1, value: -1 };
            while (node) {
                ctx.assert(tree2.compare.method(last, node), '<', 0);
                last = node;
                node = tree2.next();
            }

            tree.destroy();
            tree2.destroy();
        });
        //#endregion
    }

    function test_Map() {
        header('Test Map');

        //#region Add
        var map = new Map();
        for (var i=0; i<1000; i++) {
            map.add(`k${i}`, `v${i}`);
        }
        test('Should have length of 1000', ctx => ctx.assert(map.length, '=', 1000));
        var counter = 0;
        for (var i=0; i<map.length; i++) {
            if (map[`k${i}`] == `v${i}`) counter++;
        }
        test('Should have 1000 correct items', ctx => ctx.assert(counter, '=', 1000));
        //#endregion

        //#region Get
        counter = 0;
        for (var i=0; i<10; i++) {
            var ix = Math.floor(map.length * Math.random());
            var item = map.getAt(ix);
            if (item == `v${ix}`) counter++;
        }
        test('Should get 10 random items correctly', ctx => ctx.assert(counter, '=', 10));
        //#endregion

        //#region Remove
        var deleted = [];
        for (var i=0; i<10; i++) {
            var ix = Math.floor(map.length * Math.random());
            deleted.push(ix);
            var item = map.removeAt(ix);
        }
        test('Should have 990 items', ctx => ctx.assert(map.length, '=', 990));
        for (var i=0; i<10; i++) {
            var ix = Math.floor(map.length * Math.random());
            var item = map.removeAt(ix);
        }
        counter = 0;
        for (var i=0; i<10; i++) {
            if (map.getAt(deleted[i]) != `v${i}`) counter++;
        }
        test('Should not find the deleted items', ctx => ctx.assert(counter, '=', 10));
        //#endregion
    }

    var tests = () => [
        test_dictionary,
        test_Stream,
        test_DataSeries,
        test_DataSeriesCompare,
        test_DataLink,
        test_Graph,
        test_BTree,
        test_Map
    ];

    publish(tests, 'Data tests');
})();