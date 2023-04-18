include('./data-table.js');
include('./dictionary.js');
include('./stream.js');
include('./dataseries.js');
include('./datalink.js');
include('./graph.js');
include('./b-tree.js');
include('./map.js');

(function() {
    async function test_datatable() {
        header('Test DataTable');
        var schema = await DataTable.useSchema();
        var table = new DataTable('Person');
        var stringType = schema.types.get('string');
        table.addColumn('id', stringType, null, true);
        table.addColumn(new DataColumn('name', stringType, 'No data'));
        table.addColumn('age', schema.types.get('uint8'));
        test('Should create a table with 3 columns', ctx => {
            ctx.assert(table.columns.size, '=', 3);
            ctx.assert(table.columns.get('id'), '!null');
            ctx.assert(table.columns.get('id').type.name, '=', 'string');
            ctx.assert(table.columns.get('name').type, '=', stringType);
            ctx.assert(table.columns.get('age').type.name, '=', 'uint8');
        });

        table.addIndex('name', 'name', true);
        test('Should add an explicitly unique index', ctx => {
            ctx.assert(table.indices.has('name'), 'true');
            var index = table.indices.get('name');
            ctx.assert(index.column, '=', table.columns.get('name'));
            ctx.assert(index.isUnique, 'true');
        });

        test('Should build DataTable schema successfully', ctx => {
            ctx.assert(schema, '!null');
            ctx.assert(schema.types.has('DataColumn'), 'true');
            ctx.assert(schema.types.has('DataIndex'), 'true');
            ctx.assert(schema.types.has('DataTable'), 'true');
            ctx.assert(schema.types.has('ColumnList'), 'true');
            ctx.assert(schema.types.has('IndexList'), 'true');
            ctx.assert(schema.types.has('refDataColumn'), 'true');
        });

        var definition = {
            "name": "Person",
            "columns": [
                { "name":"id", "type":"string", "key":true },
                { "name":"name", "type":"string", "default":"No data" },
                { "name":"age", "type":"uint8" }
            ],
            "indices": [
                { "name":"name", "column":"name", "unique":true }
            ]
        };
        var PersonType = schema.buildType({
            "name": "person", "attributes": {
                "id": { "type":"string", "key":true },
                "name": { "type":"string", "default":"No data" },
                "age": { "type":"uint8" }
            }
        });
        var results = schema.validate(definition, 'DataTable');
        for (var i=0; i<results.length; i++) {
            message(results[i]);
        }
        test('Should validate schema definition successfully',ctx => ctx.assert(results, 'empty'));

        var table2 = new DataTable(definition);
        test('Should create the same table from definition', ctx => ctx.assert(table2, ':=', table));

        test('Should add data and update indices successfully', ctx => {
            for (var i=0; i<100; i++) {
                var person = PersonType.createPrimitiveValue();
                person.id = 'p'+('000'+i).slice(-3);
                person.age = person.age % 100;
                //message(JSON.stringify(person));
                table.add(person);
            }
    
            ctx.assert(table.data.length, '=', 100);
            ctx.assert(table.count, '=', 100);
        });
        test('Should return indexed columns in sorted order', ctx => {
            table.indices.iterate( (colName, index) => {
                var errors = 0;
                var i = 0;
                var item = null;
                var lastItem = index.getAt(i++);
                while ((item = index.getAt(i++)) != null) {
                    if (index.type.compare(lastItem[colName], item[colName]) > 0) errors++;
                    lastItem = item;
                }
                ctx.assert(errors, '=', 0);
            });            
        });
        test('Should get index of item', ctx => {
            var errors = 0;
            for (var i=0; i<table.count; i++) {
                var item = table.data[i];
                var ix = table.indexOf(item);
                if (i != ix) errors++;
            }
            message('Errors: ' + errors);
            ctx.assert(errors, '=', 0);
        });

        test('Should remove data and update indices successfully', ctx => {
print_tree(table.indices.getAt(0).data);
            for (var i=0; i<table.data.length; i += 2) {
                var item = table.data[i];
message('remove:' + item.id)
                table.remove(item);
print_tree(table.indices.getAt(0).data);
            }
        });
    }

    function test_dictionary() {
        header('Test dictionary');
        var dictionary = new Dictionary();
        test('Should add 100 items', ctx => {
            for (var i=0; i<100; i++) {
                dictionary.add('k'+i, 'v'+i);
            }
            ctx.assert(dictionary.size, '=', 100);
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
        var obj1 = { id: 1, name: 'Joe', age: 32 };
        var obj2 = { id: 2, name: 'Jane', age: 30 };
        var obj3 = { id: 3, name: 'Ryu', age: 26, addName: function addName(name) { return `${this.name}-${name}(${this.id})`; } };
        var dl1 = DataLink.create(obj1);
        var dl2 = DataLink.create(obj2);
        var dl3 = DataLink.create(obj3);
        var transform = value => `${value.charAt(0).toUpperCase() + value.substr(1)}`;

        message('Write, linked write', 1);
        dl1.addField('name');
        test('Should return value of linked object\'s property', ctx => ctx.assert(obj1.name, '=', dl1.name));
        dl1.name = 'John';
        test('Should change value of linked object\'s property', ctx => ctx.assert(obj1.name, '=', 'John'));

        dl2.addField('name', null, transform);
        dl2.name = 'janet';
        test('Should write transformed (global) value into linked object\'s property', ctx => ctx.assert(obj2.name, '=', 'Janet'));

        dl3.addField('name', obj3, obj3.addName);
        dl3.addField('id');
        dl3.name = 'Kyu';
        test('Should write transformed (local) value into linked object\'s property', ctx => ctx.assert(obj3.name, '=', 'Ryu-Kyu(3)'));

        dl1.addHandler('name', obj2, 'name', (context, fieldName, value) => context[fieldName] = value.toLowerCase());
        dl1.name = 'JAMES';
        test('Should change value of linked object\'s property directly', ctx => ctx.assert(obj1.name, '=', 'JAMES'));
        test('Should write transformed value of 2nd linked object\'s property directly', ctx => ctx.assert(obj2.name, '=', 'james'));

        obj3.name = 'RYU';
        dl2.addHandler('name', dl3, 'name', (context, fieldName, value) => context[fieldName] = value.toLowerCase());
        dl2.name = 'jACOB';
        test('Should change value of linked object\'s property via DataLink', ctx => ctx.assert(obj2.name, '=', 'JACOB'));
        test('Should write transformed value of 2nd linked object\'s property via DataLink', ctx => ctx.assert(obj3.name, '=', 'RYU-jacob(3)'));

        TestConfig.indent--;
        message('Cascading cyclic write');

        obj1.name = 'Joe';
        obj2.name = 'John';
        obj3.name = 'Jane';
        dl1 = DataLink.create(obj1);
        dl2 = DataLink.create(obj2);
        dl3 = DataLink.create(obj3);
        dl1.addField('name');
        dl1.addHandler('name', dl2);
        dl2.addField('name');
        dl1.addHandler('name', dl3);
        dl3.addField('name');
        dl1.addHandler('name', dl1);

        dl1.name = 'James';
        test('Should change value of 2nd linked object\'s property', ctx => ctx.assert(obj2.name, '=', 'James'));
        test('Should change value of 3rd linked object\'s property', ctx => ctx.assert(obj3.name, '=', 'James'));
        test('Should change value of directly linked object\'s property', ctx => ctx.assert(obj1.name, '=', 'James'));

        message('Create link', 1);
        obj1.name = 'Joe';
        obj2.name = 'John';
        dl1 = DataLink.create(obj1);
        dl2 = DataLink.create(obj2);
        dl1.addField('name');
        dl2.addField('name');
        dl1.addLink('name', dl2, 'name', transform);
        dl1.name = 'james';
        test('Should change value of object\'s property', ctx => ctx.assert(obj1.name, '=', 'james'));
        test('Should change value of linked object\'s property', ctx => ctx.assert(obj2.name, '=', 'James'));
        TestConfig.indent--;

        message('Create sync', 1);
        obj1.name = 'Joe';
        obj2.name = 'John';
        dl1 = DataLink.create(obj1);
        dl2 = DataLink.create(obj2);
        dl1.addField('name');
        dl2.addField('name');
        dl1.addSync('name', dl2, 'name', v => v.toUpperCase(), v => v.toLowerCase());
        dl1.name = 'james';
        test('Should change value of object\'s property', ctx => ctx.assert(obj1.name, '=', 'james'));
        test('Should change value of linked object\'s property', ctx => ctx.assert(obj2.name, '=', 'JAMES'));

        TestConfig.indent--;


        // DataLink(obj1);
        // DataLink.addHandler(obj1, 'name', { 'target':obj2, 'args':transform });
        // DataLink.addHandler(obj1, 'name', { 'target':obj3, 'args':obj3.addName });
        // obj1.name = 'jack';
        // message(obj1.name);
        // test('Should change obj1.name', ctx => ctx.assert(obj1.name, '=', 'jack'));
        // message(obj2.name);
        // test('Should change obj2.name with global transform', ctx => ctx.assert(obj2.name, '=', 'Jack'));
        // message(obj3.name);
        // test('Should change obj3.name with local transform', ctx => ctx.assert(obj3.name, '=', 'Ryu-jack(3)'));

        // DataLink.link(obj2, 'name', obj3, 'name', obj3.addName);
        // obj3.name = 'Ryu';
        // obj2.name = 'San';
        // message(`${obj2.name} and ${obj3.name}`);
        // test('Should link obj2.name to obj3.name', ctx => {
        //     ctx.assert(obj2.name, '=', 'San');
        //     ctx.assert(obj3.name, '=', 'Ryu-San(3)');
        // });
        // DataLink.removeHandler(obj1, x => x.field == 'name');
        // DataLink.removeHandler(obj2, x => x.field == 'name');
        // DataLink.sync(obj1, 'name', obj2, 'name');
        // DataLink.link(obj2, 'name', obj3, 'name');
        // test('Should sync the names of obj1 and obj2', ctx => {
        //     obj1.name = 'Jill';
        //     message(`${obj1.name} and ${obj2.name}`);
        //     ctx.assert(obj1.name, '=', 'Jill');
        //     ctx.assert(obj2.name, '=', 'Jill');
        //     obj2.name = 'Joseph';
        //     message(`${obj1.name} and ${obj2.name}`);
        //     ctx.assert(obj1.name, '=', 'Joseph');
        //     ctx.assert(obj2.name, '=', 'Joseph');
        // });
        // test('Should propagte the change to obj3.name', ctx => {
        //     obj3.name = 'Jack';
        //     obj1.name = 'Jill';
        //     message(obj3.name);
        //     ctx.assert(obj3.name, '=', 'Jill');
        // });

        // test("Should add link to the field 'name' without transform", context => {
        //     obj1.name = 'Joe';
        //     var dl1 = new DataLink(obj1);
        //     dl1.addField('name');
        //     dl1.name = 'Charlie';
        //     context.assert(obj1.name, '=', 'Charlie');
        // });
        // test("Should add link to the field 'name' with global transform", context => {
        //     obj1.name = 'Joe';
        //     var dl1 = new DataLink(obj1);
        //     dl1.addField('name', {
        //         'fn':DataLink.defaultHandlers.set,
        //         'args': transform
        //     });
        //     dl1.name = 'charlie';
        //     context.assert(obj1.name, '=', 'Charlie');
        // });
        // test("Should add link to the field 'name' with local transform", context => {
        //     obj3.name = 'Ryu';
        //     var dl1 = new DataLink(obj3);
        //     dl1.addField('name', {
        //         'target':obj3,
        //         'fn':DataLink.defaultHandlers.set,
        //         'args': obj3.addName
        //     });
        //     dl1.name = 'charlie';
        //     context.assert(obj3.name, '=', 'Ryu-charlie(3)');
        // });
        // test("Should add link to the field 'name' with global and local transforms", context => {
        //     obj3.name = 'Ryu';
        //     var dl1 = new DataLink(obj3);
        //     dl1.addField('name', null);
        //     dl1.addHandler('name', {
        //         'fn': function(k, v, a) {
        //                 this.name = this.addName(transform(v));
        //             }
        //     });
        //     dl1.name = 'charlie';
        //     context.assert(obj3.name, '=', 'Ryu-Charlie(3)');
        // });
        // test("Should add link to the field 'name' with link to another field", context => {
        //     obj1.name = 'Joe';
        //     obj2.name = 'Jane';
        //     var dl1 = new DataLink(obj1);
        //     dl1.addField('name');
        //     dl1.addLink('name', obj2, 'name', transform);
        //     dl1.name = 'charlie';
        //     context.assert(obj1.name, '=', 'charlie');
        //     context.assert(obj2.name, '=', 'Charlie');
        // });
        // test("Should link 2 objects", context => {
        //     obj1.name = 'Joe';
        //     obj2.name = 'Jane';
        //     var dl1 = new DataLink(obj1), dl2 = new DataLink(obj2);
        //     DataLink.addLink2(dl1, 'name', dl2, 'name');

        //     dl1.name = 'Charlie';
        //     context.assert(obj1.name, '=', 'Charlie');
        //     context.assert(obj2.name, '=', 'Charlie');
        //     dl2.name = 'Joe';
        //     context.assert(obj1.name, '=', 'Joe');
        //     context.assert(obj2.name, '=', 'Joe');
        // });
        // test("Should link 2 objects with transforms", context => {
        //     obj1.name = 'Joe';
        //     obj3.name = 'Ryu';
        //     var dl1 = new DataLink(obj1), dl2 = new DataLink(obj3);
        //     DataLink.addLink2(dl1, 'name', dl2, 'name', transform, obj3.addName);
        //     message(`dl1.name=${dl1.name}, dl2.name=${dl2.name}`);
        //     dl1.name = 'Charlie';
        //     context.assert(obj1.name, '=', 'Charlie');
        //     context.assert(obj3.name, '=', 'Ryu-Charlie(3)');
        //     obj3.name = 'Ryu';
        //     dl2.name = 'joe';
        //     context.assert(obj1.name, '=', 'Joe');
        //     context.assert(obj3.name, '=', 'Ryu-joe(3)');
        // });

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
        start = start || tree.root;
        tree.BFS(start,
            v => {
                sb.push(`${(v.edges.length ? 'I' : 'L') + v.id}: (${v.data.map((x,i) => i<v.length ? x.id : '-')})`);
            }
        );
        message(sb.join(' | '));
    }

    function test_BTree() {
        header('Test B-Tree');

        var items = [];
        function create_tree() {
            //                            I0:┌─14─┬─19─┐
            //              ┌────────────────┘    │    └────────────┐
            //       I1:┌─4─┼─9─┐                 │           I2:┌──24──┐
            //     ┌────┘   │   └─────┐       L6:15,16         ┌─┘      └─┐
            // L3:0,1,   L4:5,6,   L5:10,11      17,18      L7:20,21   L8:25,26
            //    2,3       7,8       12,13                    22,23      27,28
            //
            items = [];
            for (var i=0; i<29; i++) {
                items.push({id:i, value:i});
            }

            var tree = new BTree(3, 4, (a, b) => a.id - b.id);
            // create 3 internal nodes
            tree.createVertex().add(items[14]).add(items[19]);
            tree.createVertex(null, tree.root).add(items[4]).add(items[9]);
            tree.createVertex(null, tree.root).add(items[24]);
            // create 6 leaf nodes
            tree.createVertex(null, null, true).addRange(items, null,  0, 4);
            tree.createVertex(null, null, true).addRange(items, null,  5, 4);
            tree.createVertex(null, null, true).addRange(items, null, 10, 4);
            tree.createVertex(null, null, true).addRange(items, null, 15, 4);
            tree.createVertex(null, null, true).addRange(items, null, 20, 4);
            tree.createVertex(null, null, true).addRange(items, null, 25, 4);
            // add 6 edges
            tree.addEdge(tree.root, tree.vertices[1]);
            tree.addEdge(tree.root, tree.vertices[6]);
            tree.addEdge(tree.root, tree.vertices[2]);
            tree.addEdge(tree.vertices[1], tree.vertices[3]);
            tree.addEdge(tree.vertices[1], tree.vertices[4]);
            tree.addEdge(tree.vertices[1], tree.vertices[5]);
            tree.addEdge(tree.vertices[2], tree.vertices[7]);
            tree.addEdge(tree.vertices[2], tree.vertices[8]);

            return tree;
        }

        function test_tree(tree, items, ctx) {
            var result = {};
            var maxHeight = tree.maxHeight();
            message(`Max.height = ${maxHeight.toPrecision(4)}`);
            tree.tryGet(tree.first(), result);
            result.index--;
            for (var i=0; i<items.length; i++) {
                var item = tree.next(result);
                ctx.assert(item, '=', items[i]);
                ctx.assert(result.path.length, '<=', maxHeight);
            }
        }        
        
        //#region UNIT TESTS
        test('Should rotate left (L3 < I1 < L4)', ctx => {
            // prepare
            var tree = create_tree();
            var left = tree.vertices[3];
            left.data[3] = null; left.length--;
            parent = left.parent;
            var ei = parent.edges.findIndex(e => e.to == left);
            var node = parent.edges[ei+1].to;
            print_tree(tree);
            // action
            tree.rotateLeft(left, parent, ei, node);
            print_tree(tree);
            // assert
            var result = {};
            ctx.assert(left.data.map(i => i ? i.id : -1), ':=', [0,1,2,4]);
            ctx.assert(tree.vertices[1].data.map(i => i ? i.id : -1), ':=', [5,9]);
            ctx.assert(tree.vertices[4].data.map(i => i ? i.id : -1), ':=', [6,7,8,-1]);
            ctx.assert(tree.tryGet(items[5], result), 'true');
            ctx.assert(result.node, '=', parent);
            ctx.assert(tree.tryGet(items[4], result), 'true');
            ctx.assert(result.node, '=', left);

            tree.destroy();
        });
        test('Should rotate right (L3 > I1 > L4)', ctx => {
            // prepare
            var tree = create_tree();
            var right = tree.vertices[4];
            right.data[3] = null; right.length--;
            parent = right.parent;
            var ei = parent.edges.findIndex(e => e.to == right) - 1;
            var node = parent.edges[ei].to;
            print_tree(tree);
            // action
            tree.rotateRight(node, parent, ei, right);
            print_tree(tree);
            // assert
            var result = {};
            ctx.assert(right.data.map(i => i ? i.id : -1), ':=', [4,5,6,7]);
            ctx.assert(tree.vertices[1].data.map(i => i ? i.id : -1), ':=', [3,9]);
            ctx.assert(tree.vertices[3].data.map(i => i ? i.id : -1), ':=', [0,1,2,-1]);
            ctx.assert(tree.tryGet(items[3], result), 'true');
            ctx.assert(result.node, '=', parent);
            ctx.assert(tree.tryGet(items[4], result), 'true');
            ctx.assert(result.node, '=', right);

            tree.destroy();
        });
        test('Should merge left (L3 < I1 < L4)', ctx => {
            // prepare
            var tree = create_tree();
            var left = tree.vertices[3];
            parent = left.parent;
            var ei = parent.edges.findIndex(e => e.to == left);
            var node = parent.edges[ei+1].to;
            left.data[2] = null; left.data[3] = null; left.length -= 2;
            node.data[1] = null; node.data[2] = null; node.data[3] = null; node.length -= 3;
            print_tree(tree);
            // action
            tree.mergeLeft(left, parent, ei, node);
            print_tree(tree);
            // assert
            var result = {};
            ctx.assert(left.data.map(i => i ? i.id : -1), ':=', [0,1,4,5]);
            ctx.assert(tree.vertices[1].data.map(i => i ? i.id : -1), ':=', [9, -1]);
            ctx.assert(tree.vertices.find(v => v == node), 'null');
            ctx.assert(tree.tryGet(items[5], result), 'true');
            ctx.assert(result.node, '=', left);
            ctx.assert(tree.tryGet(items[4], result), 'true');
            ctx.assert(result.node, '=', left);

            tree.destroy();
        });
        test('Should merge right (L3 > I1 > L4)', ctx => {
            // prepare
            var tree = create_tree();
            var right = tree.vertices[4];
            parent = right.parent;
            var ei = parent.edges.findIndex(e => e.to == right) - 1;
            var node = parent.edges[ei].to;
            right.data[2] = null; right.data[3] = null; right.length -= 2;
            node.data[1] = null; node.data[2] = null; node.data[3] = null; node.length -= 3;
            print_tree(tree);
            // action
            tree.mergeRight(node, parent, ei, right);
            print_tree(tree);
            // assert
            var result = {};
            //ctx.assert(right.data.map(i => i ? i.id : -1), ':=', [4,5,6,7]);
            ctx.assert(tree.vertices[1].data.map(i => i ? i.id : -1), ':=', [9, -1]);
            ctx.assert(right.data.map(i => i ? i.id : -1), ':=', [0,4,5,6]);
            ctx.assert(tree.tryGet(items[5], result), 'true');
            ctx.assert(result.node, '=', right);
            ctx.assert(tree.tryGet(items[4], result), 'true');
            ctx.assert(result.node, '=', right);

            tree.destroy();
        });
        //#endregion

        //#region BASIC TESTS
        tree = create_tree();
        message("Basic tests", 1);
        print_tree(tree);
        test('Should find the items in ascending order', ctx => {
            
            var m = {
                0: [14, 19],
                1: [4, 9],
                2: [24],
                3: [0,1,2,3],
                4: [5,6,7,8],
                5: [10,11,12,13],
                6: [15,16,17,18],
                7: [20, 21, 22, 23],
                8: [25, 26, 27, 28]
            };
            var result = {};
            for (var i=0; i<items.length; i++) {
                var isFound = tree.tryGet(items[i], result);
                ctx.assert(isFound, 'true');
                var ids = m[result.node.id];
                ctx.assert(ids, '!null');
                ctx.assert(ids.includes(i), 'true');
                ctx.assert(result.index, '=', ids.indexOf(i));
            }
            test_tree(tree, items, ctx);
        });

        test('Should NOT find the items', ctx => {
            var result = {};
            message('Item #30');
            var isFound = tree.tryGet({id:30}, result);
            ctx.assert(isFound, 'false');
            ctx.assert(result.node, '=', tree.vertices[8]);
            ctx.assert(result.index, '=', -5);
            message('Item #10.5');
            isFound = tree.tryGet({id:10.5}, result);
            ctx.assert(isFound, 'false');
            ctx.assert(result.node, '=', tree.vertices[5]);
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
            tree.tryGet(items[items.length-1], result);
            item = tree.next(result);
            ctx.assert(item, 'null');
        });
        tree.destroy();
        //#endregion

        //#region ADD
        test('Should add items to tree in random order', ctx => {
            tree = new BTree(3, 4, (a, b) => a.id - b.id);
            var indices = new Array(items.length);
            for (var i=0; i<items.length; i++) indices[i] = i;
            var count = indices.length;
            while (count > 0) {
                var rnd = Math.floor(count*Math.random());
                var ix = indices[rnd];
                count--;
                indices[rnd] = indices[count];
                indices[count] = ix;
            }
            measure('', () => {
                for (var i=0; i<items.length; i++) {
                    tree.add(items[indices[i]]);
                }
            }, 1);
            message(tree.vertices.length + ' nodes');
            test_tree(tree, items, ctx);
            tree.destroy();
        });

        // test('Should add items to tree in normal order', ctx => {
        //     tree = new BTree(3, 4, (a, b) => a.id - b.id);
        //     var ms = Dbg.measure( () => {
        //         for (var i=0; i<items.length; i++) {
        //             tree.add(items[i]);
        //             var info = [];
        //         }
        //     });
        //     message(tree.vertices.length + ' nodes');
        //     message('Added in ' + ms + 'ms');
        //     test_tree(tree, items, ctx);
        // });

        // test('Should return item at index', ctx => {
        //     message('forward');
        //     var item1 = tree.getAt(2);
        //     for (var i=0; i<tree.count; i++) {
        //         var item1 = tree.getAt(i);
        //         message(JSON.stringify(item1))
        //         item1 = tree.next();
        //         var item1 = tree.getAt(i);
        //         var item2 = tree.first();
        //         for (var j=0; j<i; j++) {
        //             item2 = tree.next();
        //         }
        //         ctx.assert(item1, '=', item2);
        //     }
        //     message('randomly');
        //     var indices = [0, Math.floor(items.length/2), items.length-1];
        //     for (var i=0; i<indices.length; i++) {
        //         var item1 = tree.getAt(indices[i]);
        //         var item2 = tree.first();
        //         for (var j=0; j<indices[i]; j++) {
        //             item2 = tree.next();
        //         }
        //         ctx.assert(item1, '=', item2);
        //     }
        // });
        // //#endregion

        // //#region ITERATE
        // test('Should iterate through a range of items', ctx => {
        //     var ms = 0;
        //     ms += Dbg.measure( () => {
        //         var from = Math.floor(tree.count/2 * Math.random());
        //         var length = tree.count/2;
        //         var to = from + length;
        //         var total = 0;
        //         var error = 0;
        //         var last = {id:-1, value: -1};

        //         tree.range(items[from], items[to], x => {
        //             if (x.id < last.id) error++;
        //             total += x.id;
        //             last = x;
        //             return error > 0;
        //         }, null);
        //         ctx.assert(error, '=', 0);
        //         ctx.assert(total, '=', 0.5*(length+1)*(from + to));
        //     }, 10);
        //     message(`Range took ${(ms/100).toPrecision(4)} ms`);
        // });
        // test('Should iterate through items', ctx => {
        //     var ms = 0;
        //     ms += Dbg.measure( () => {
        //         var from = Math.floor(tree.count/2 * Math.random());
        //         var length = tree.count/2;
        //         var to = from + length;
        //         var total = 0;
        //         var error = 0;
        //         var last = {id:-1, value: -1};

        //         var result = {};
        //         tree.tryGet(items[from], result);
        //         var total = result.node.data[result.index].id;
        //         for (var i=from+1; i<=to; i++) {
        //             var item = tree.next(result);
        //             if (item.id < last.id) error++;
        //             total += item.id;
        //             last = item;
        //             if (error > 0) break;
        //         }
        //         ctx.assert(error, '=', 0);
        //         ctx.assert(total, '=', 0.5*(length+1)*(from + to));
        //     }, 10);
        //     message(`Iteration took ${(ms/100).toPrecision(4)} ms`);
        // });
        // //#endregion

        // //#region REMOVE
        // print_tree(tree);
        // test('Should remove an item in a leaf node (simple)', ctx => {
        //     // simple: no merge, no item transfer is needed
        //     var result = {};
        //     var item = tree.vertices[4].data[1];
        //     var removed = tree.remove(item);
        //     ctx.assert(item, '=', removed);
        //     ctx.assert(tree.tryGet(removed, result), 'false');
        // });
        // print_tree(tree);
        // test('Should remove an item in a leaf node (merge)', ctx => {
        //     // transfer: remaining items are moved to neighbours
        //     var result = {};
        //     var item = tree.vertices[4].data[1];
        //     //Dbg.breakOn(tree.vertices[4], 'length', false, true);
        //     var removed = tree.remove(item);
        //     ctx.assert(item, '=', removed);
        //     ctx.assert(tree.tryGet(removed, result), 'false');
        // });
        // print_tree(tree);
        // test('Should remove an item from internal node', ctx => {
        //     var result = {};
        //     var item = tree.vertices[1].data[1];
        //     var removed = tree.remove(item);
        //     ctx.assert(item, '=', removed);
        //     ctx.assert(tree.tryGet(removed, result), 'false');
        // });
        // print_tree(tree);
        // //#endregion

        // tree.destroy();

        //#_region MULTIPLE INDICES
        // test('Should have 2 tree to index 2 attributes', ctx => {
        //     tree = new BTree(3, 4, (a, b) => a.id - b.id);
        //     var tree2 = new BTree(3, 4, (a, b) => a.value - b.value);
        //     var indices = new Array(items.length);
        //     for (var i=0; i<items.length; i++) indices[i] = i;
        //     var count = indices.length;
        //     while (count > 0) {
        //         var rnd = Math.floor(count*Math.random());
        //         var ix = indices[rnd];
        //         tree.add(items[ix]);
        //         tree2.add(items[ix]);
        //         count--;
        //         indices[rnd] = indices[count];
        //     }

        //     var node = tree.first();
        //     var last = {id: -1, value: -1 };
        //     while (node) {
        //         ctx.assert(tree.compare.method(last, node), '<', 0);
        //         last = node;
        //         node = tree.next();
        //     }

        //     node = tree2.first();
        //     last = {id: -1, value: -1 };
        //     while (node) {
        //         ctx.assert(tree2.compare.method(last, node), '<', 0);
        //         last = node;
        //         node = tree2.next();
        //     }

        //     tree.destroy();
        //     tree2.destroy();
        // });
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
        test_Map,
        test_datatable
    ];

    publish(tests, 'Data tests');
})();