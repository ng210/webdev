include('/lib/base/html.js');
(function(){
    async function test_load() {
        header('Test load');
        var res = await load('./test-file.json');
        test('Should load test-file from current folder (app\'s path) sync', ctx => {
            ctx.assert(res, '!null');
            if (res.error) message(res.error);
            ctx.assert(res.error, 'null');
        });
        res = await load('/lib/base/test-file.json');
        test('Should load test-file from root folder (document base path) sync', ctx => {
            ctx.assert(res, '!null');
            if (res.error) message(res.error);
            ctx.assert(res.error, 'null');
        });
        res = load('./test-file.json');
        test('Should load test-file at relative path async', async function(ctx) {
            res.then(r => {
                ctx.assert(r, '!null');
                ctx.assert(r.error, 'null');
             });
        });
        res = await load('http://localhost:3000/js/lib/base/test-file.json');
        test('Should load from full URL', ctx => {
            ctx.assert(res, '!null');
            ctx.assert(res.error, 'null');
        });

        res = await load('dummy.txt');
        test('Should give error for relative path', ctx => {
            ctx.assert(res.error, '!null');
            ctx.assert(res.error.message, '!null');
        });
        res = await load('http://localhost:4000/test-file.json');
        test('Should give error for full URL', ctx => {
            ctx.assert(res.error, '!null');
            ctx.assert(res.error.message, '!null');
        });
    }

    function createRandomArray(size) {
        var rnd = [];
        for (var i=0; i<size; i++) {
            rnd.push(i);
        }
        for (var i=0; i<size/2; i++) {
            var j = Math.floor(size*Math.random());
            var k = Math.floor(size*Math.random());
            var v = rnd[j];
            rnd[j] = rnd[k];
            rnd[k] = v;
        }
        return rnd;
    }

    function test_binSearch() {
        header('Test binary search');
        var arr = new Array(100);
        for (var i=0; i<100; i++) {
            arr[i] = i;
        }
        test('Should find numbers', ctx => {
            message('Normal oder');
            var errors = [];
            for (var ix=0; ix<100; ix++) {
                if (arr.binSearch(ix) != ix) errors.push(ix);
            }
            ctx.assert(errors, 'empty');

            errors = [];
            message('Random order');
            var rnd = createRandomArray(100);
            for (var i=0; i<100; i++) {
                var ix = rnd[i];
                if (arr.binSearch(ix) != ix) errors.push(ix);
            }
            ctx.assert(errors, 'empty');
        });

        for (var i=0; i<100; i++) {
            arr[i] = { id:i };
        }
        test('Should find objects', ctx => {
            var errors = [];
            var cmp = (a,b) => a.id - b.id;
            var key = { id: 0 };
            message('Normal oder');
            for (var ix=0; ix<100; ix++) {
                key.id = ix;
                if (arr.binSearch(key, cmp) != ix) errors.push(ix);
            }
            ctx.assert(errors, 'empty');

            errors = [];
            message('Random order');
            var rnd = createRandomArray(100);
            for (var i=0; i<100; i++) {
                var ix = rnd[i];
                key.id = ix;
                if (arr.binSearch(key, cmp) != ix) errors.push(ix);
            }
            ctx.assert(errors, 'empty');
        });
    }

    function test_getSetObjectAt() {
        header('Test get/set object at path');
        var text1 = 'Hello World!';
        var text2 = 'Test';
        var obj1 = {
            obj2: {
                arr1: [
                    { obj3: {
                        text: text1
                    }}
                ],
                print: t => console.log(t)
            }
        };
        obj1.obj2.print.text = text1;

        test('Should return object at path', ctx => {
            ctx.assert(getObjectAt('obj2.arr1.0.obj3.text', obj1), '=', obj1.obj2.arr1[0].obj3.text);
        });
        test('Should return object at path', ctx => {
            ctx.assert(getObjectAt('obj2.print.text', obj1), '=', obj1.obj2.print.text);
        });
        test('Should set object at path', ctx => {
            ctx.assert(setObjectAt('obj2.arr1.0.obj3.text', obj1, text2), '=', text1);
            ctx.assert(obj1.obj2.arr1[0].obj3.text, '=', text2);
        });
    }

    function test_html() {
        header('Test html functions');
        var text = '@me said: "Hello world!"\n@you said: "Go ahead & make my day!"'
        var encoded = Html.encode(text);
        var decoded = Html.decode(encoded);
        test('Should Html encode text', ctx => ctx.assert(encoded, '=', '@me&nbsp;said:&nbsp;&quot;Hello&nbsp;world!&quot;<br/>@you&nbsp;said:&nbsp;&quot;Go&nbsp;ahead&nbsp;&amp;&nbsp;make&nbsp;my&nbsp;day!&quot;'));
        test('Should Html decode text', ctx => ctx.assert(text, '=', decoded));
    }

    function test_clone() {
        message('Test clone');
        function MyObject(x, y) {
            this.x = x;
            this.y = y;
        }
        MyObject.prototype.toString = function toString() {
            return `${this.x}, ${this.y}`;
        };
        var obj1 = {
            myobj: new MyObject(2,3),
            id:'a1'
        };

        var obj2 = {
            myobj1: obj1,
            id:'a2'
        };

        var data = [
            'alma',
            12.43,
            [1,2,3,4],
            true,
            undefined,
            null,
            new String('alma'),
            new Number(12.43),
            new Boolean(true),
            new Date('2021.12.12'),
            {
                'a':'a',
                'n':12
            },
            obj1.myobj,
            obj1,
            obj2
        ];
        var arr = new Array();
        arr.push(1,2,3,4);
        data.push(arr);
        var result = true;
        for (var i=0; i<data.length; i++) {
            var cl = clone(data[i]);
            if (deepCompare(data[i], cl) != null) {
                message(`Could not clone object ${stringify(data[i])}`);
                result = false;
            } else {
                message(`Original.${stringify(data[i])}`);
                message(`Cloned.. ${stringify(cl)}`);
            }
        }
        test('Should clone all kind of objects', ctx => ctx.assert(result, 'true'));
        test('Should clone object correctly (constructor, prototype, no methods)', ctx => {
            var cl = clone(obj1.myobj);
            ctx.assert(obj1.myobj, ':=', cl);
            ctx.assert(cl.constructor, '=', MyObject);
            ctx.assert(cl.__proto__, '=', MyObject.prototype);
            console.log(cl.__proto__);
            ctx.assert(cl.hasOwnProperty('toString'), 'false');
        });
    }

    function test_mergeObjects() {
        message('Test mergeObjects', 1);

        var arr1 = [1, 3, 5];
        var arr2 = [2, 4, 6];

        var person1 = {'name': 'Charlie', 'role':'employee', 'age': 43 };
        var person2 = {'id':12, 'name':'Karcsi', '0':0};
        var person3 = {'id':10, 'name':'Carl', '1':1};

        message('Missing arguments', 1);
        test('Source missing returns destination', ctx => {
            var merged = mergeObjects(null, arr1)
            ctx.assert(merged, '=', arr1);
        });
        test('Source missing clones destination', ctx => {
            var merged = mergeObjects(null, arr1, mergeObjects.NEW)
            ctx.assert(merged, '!=', arr1);
            ctx.assert(merged, ':=', arr1);
        });
        test('Destination missing returns source', ctx => {
            var merged = mergeObjects(arr1, null)
            ctx.assert(merged, '=', arr1);
        });
        test('Destination missing clones source', ctx => {
            var merged = mergeObjects(arr1, null, mergeObjects.NEW)
            ctx.assert(merged, '!=', arr1);
            ctx.assert(merged, ':=', arr1);
        });
        test('Both missing returns null', ctx => {
            var merged = mergeObjects();
            ctx.assert(merged, 'null');
        });

        message('Simple data', 1);
        //#region simple data, extend, !overwite, !new
        message('extend, !overwite, !new', 1);
        test('should merge 2 arrays', ctx => {
            var merged = mergeObjects(arr1, clone(arr2));
            ctx.assert(merged, ':=', [2,4,6,1,3,5]);
        });

        test('should merge 2 objects', ctx => {
            var merged = mergeObjects(person1, clone(person2));
            ctx.assert(merged, ':=', {'id':12, 'name':'Karcsi', '0':0, 'name2':'Charlie', 'role':'employee', 'age': 43 });
        });

        test('should merge array and object', ctx => {
            var merged = mergeObjects(arr1, clone(person2));
            ctx.assert(merged, ':=', {'id':12, 'name':'Karcsi', '0':0, '02':1, '1':3, '2':5 });
        });
        //#endregion

        //#region simple data, !extend, !overwite, !new
        TestConfig.indent--;
        message('!extend, !overwite, !new', 1);
        test('should merge 2 arrays', ctx => {
            var merged = mergeObjects(arr1, clone(arr2), mergeObjects.COMMON);
            ctx.assert(merged, ':=', arr2);
        });

        test('should merge 2 objects', ctx => {
            var merged = mergeObjects(person1, clone(person2), mergeObjects.COMMON);
            ctx.assert(merged, ':=', person2);
        });

        test('should merge array and object', ctx => {
            var merged = mergeObjects(arr1, clone(person2), mergeObjects.COMMON);
            ctx.assert(merged, ':=', person2);
        });
        //#endregion

        //#region simple data, !extend, overwite, !new
        TestConfig.indent--;
        message('!extend, overwite, !new', 1);
        test('should merge 2 arrays', ctx => {
            var merged = mergeObjects(arr1, clone(arr2), mergeObjects.COMMON | mergeObjects.OVERWRITE);
            ctx.assert(merged, ':=', arr1);
        });

        test('should merge 2 objects', ctx => {
            var merged = mergeObjects(person1, clone(person2), mergeObjects.COMMON | mergeObjects.OVERWRITE);
            ctx.assert(merged, ':=', { 'id':12, 'name':'Charlie', '0':0 });
        });

        test('should merge array and object', ctx => {
            var merged = mergeObjects(arr1, clone(person2), mergeObjects.COMMON | mergeObjects.OVERWRITE);
            ctx.assert(merged, ':=', {'id':12, 'name':'Karcsi', '0':1});
        });
        //#endregion

        //#region simple data, !extend, overwite, new
        TestConfig.indent--;
        message('!extend, overwite, new', 1);
        test('should merge 2 arrays', ctx => {
            var merged = mergeObjects(arr1, clone(arr2), mergeObjects.COMMON | mergeObjects.OVERWRITE | mergeObjects.NEW);
            ctx.assert(merged, '!=', arr2);
            ctx.assert(merged, ':=', arr1);
        });

        test('should merge 2 objects', ctx => {
            var merged = mergeObjects(person1, clone(person2), mergeObjects.COMMON | mergeObjects.OVERWRITE | mergeObjects.NEW);
            ctx.assert(merged, '!=', person2);
            ctx.assert(merged, ':=', { 'id':12, 'name':'Charlie', '0':0 });
        });

        test('should merge array and object', ctx => {
            var merged = mergeObjects(arr1, clone(person2), mergeObjects.COMMON | mergeObjects.OVERWRITE | mergeObjects.NEW);
            ctx.assert(merged, '!=', person2);
            ctx.assert(merged, ':=', { 'id':12, 'name':'Karcsi', '0':1 });
        });
        //#endregion

        //#region simple data, !extend, !overwite, new - cloning
        TestConfig.indent--;
        message('!extend, !overwite, new', 1);
        test('should clone array', ctx => {
            var merged = mergeObjects(arr1, clone(arr2), mergeObjects.COMMON | mergeObjects.NEW);
            ctx.assert(merged, '!=', arr2);
            ctx.assert(merged, ':=', arr2);
        });

        test('should clone object', ctx => {
            var merged = mergeObjects(person1, clone(person2), mergeObjects.COMMON | mergeObjects.NEW);
            ctx.assert(merged, '!=', person2);
            ctx.assert(merged, ':=', person2);
        });
        //#endregion

        TestConfig.indent--;
        TestConfig.indent--;
        message('Complex data', 1);
        arr1 = [person1, person2];
        arr2 = [person2, person3];
        var func = function() { return 1; };
        person1.items = ['alma', func, [1,2,3]];
        person2.items = ['barack', func, ['a', 'b']];
        person3.items = ['citrom', null];
        //#region simple data, extend, !overwite, !new
        message('extend, !overwite, !new', 1);
        test('should merge 2 arrays', ctx => {
            var merged = mergeObjects(arr1, clone(arr2));
            ctx.assert(merged, ':=', [person2, person3, person1, person2]);
        });

        test('should merge 2 objects', ctx => {
            var merged = mergeObjects(person1, clone(person2));
            var expected = { 'id':12, 'name':'Karcsi', '0':0, 'items':['barack', func, ['a', 'b']], 'name2':'Charlie', 'items2':['alma', func, [1,2,3]], 'role': 'employee', 'age':43 };
            ctx.assert(merged, ':=', expected);
        });

        test('should merge array and object', ctx => {
            var merged = mergeObjects(arr1, clone(person2));
            ctx.assert(merged, '!=', person2);
            ctx.assert(merged, ':=', { '0':0, '1':person2, 'id':12, 'name':'Karcsi', 'items':person2.items, '02':person1 });
        });
        //#endregion

        return;

        test('should merge 2 objects (simple)', ctx => {
            var merged = mergeObjects({'role':'employee', 'age': 43 }, clone({'id':12, 'name':'Karcsi'}));
            ctx.assert(merged, ':=', {'id':12, 'name':'Karcsi', 'role':'employee', 'age': 43 });
        });

        test('should merge array and object (simple)', ctx => {
            var merged = mergeObjects([1,3,5], clone({'id':12, 'name':'Karcsi'}));
            ctx.assert(merged, ':=', {'id':12, 'name':'Karcsi', '0': 1, '1':3, '2':5 });
        });

        return;

        test('should merge 2 objects', ctx => {
            var merged = mergeObjects(itemList, clone(person));
            var expected = {
                "id": 12,
                "name": "James",
                "items": [
                    { "name": "knife", "value": 10 },
                    { "name": "bottle", "value": 5 }            
                ]
            };
            ctx.assert(merged, ':=', expected);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });

        test('should merge 2 objects keep source only', ctx => {
            var merged = mergeObjects(itemList, person, true);
            var expected = {
                "id": 12,
                "items": [
                    { "name": "knife", "value": 10 },
                    { "name": "bottle", "value": 5 }            
                ]
            };
            ctx.assert(merged, ':=', expected);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });

        test('should merge an object with null', ctx => {
            var merged = mergeObjects(null, person);
            var expected = {
                "id": 12,
                "name": "James"
            };
            ctx.assert(merged, ':=', expected);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });

        test('should merge an object with null subobject', ctx => {
            var merged = mergeObjects({"id": 12, "items": null}, itemList);
            var expected = {
                "id": 113,
                "items": [
                    { "name": "knife", "value": 10 },
                    { "name": "bottle", "value": 5 }            
                ]
            };
            ctx.assert(merged, ':=', expected);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });
     
        test('should clone an object', ctx => {
            var expected = {
                "id": 12,
                "name": "James"
            };
            var merged = mergeObjects(person);
            ctx.assert(merged, ':=', person);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });
    }

    function test_getObjectAt() {
        header('Test get object');
        var testData = {
            'person': {
                "id": 12,
                "name": "James",
            },
            'itemList': {
                "id": 113,
                "items": [
                    { "name": "knife", "value": 10 },
                    { "name": "bottle", "value": 5 }            
                ]
            }
        };
        test('Should get value at global path', ctx => ctx.assert(getObjectAt('Resource.NEW'), '=',  Resource.NEW));
        test('Should get value at relative path', ctx => ctx.assert(getObjectAt('id', testData.person), '=',  testData.person.id));
        test('Should get value from a list at path', ctx => ctx.assert(getObjectAt('itemList.items.0.name', testData), '=',  testData.itemList.items[0].name));
    }

    function test_hash() {
        header('Test hash');
        test('Should return hash for number', ctx => {
            ctx.assert(getHash(0), '=', '{0}');
            ctx.assert(getHash(123), '=', '{123}');
            ctx.assert(getHash(-123), '=', '{-123}');
        });

        test('Should return hash for string', ctx => {
            ctx.assert(getHash('A'), '=', '{A}');
            ctx.assert(getHash('Abc'), '=', '{Abc}');
        });

        test('Should return hash for boolean', ctx => {
            ctx.assert(getHash(true), '=', '{true}');
            ctx.assert(getHash(false), '=', '{false}');
        });

        test('Should return hash for array', ctx => {
            var h = getHash([1,2,3,4]);
            message(h);
            ctx.assert(h, '=', '{0:{1}.1:{2}.2:{3}.3:{4}}');

            var h = getHash(['A','B',3,4]);
            message(h);
            ctx.assert(h, '=', '{0:{A}.1:{B}.2:{3}.3:{4}}');

            var h = getHash([[1,2,3],'B',3,4]);
            message(h);
            ctx.assert(h, '=', '{0:{0:{1}.1:{2}.2:{3}}.1:{B}.2:{3}.3:{4}}');
        });

        test('Should return hash for object', ctx => {
            var h = getHash({'id':1, 'name':'A'});
            message(h);
            ctx.assert(h, '=', '{id:{1}.name:{A}}');

            h = getHash({'id':1, 'name':'A', 'child':{'id':2, 'name':'B'}});
            message(h);
            ctx.assert(h, '=', '{id:{1}.name:{A}.child:{id:{2}.name:{B}}}');
            
            var obj = {'id':1, 'name':'A', 'child':{'id':2, 'name':'B'}};
            obj.child.child = obj;
            var h = getHash(obj);
            message(h);
            ctx.assert(h, '=', '{id:{1}.name:{A}.child:{id:{2}.name:{B}.child:#0}}');
        });
    }

    function test_deepComapre() {
        header('Test deep compare');
        test('Should compare numbers successfully', ctx => {
            var result = deepCompare(1, 1);
            ctx.assert(result, 'null');
            result = deepCompare(1, 2);
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(1, '1')
            message(result);
            ctx.assert(result, '!empty');
        });

        test('Should compare strings successfully', ctx => {
            var result = deepCompare('Abc', 'Abc');
            ctx.assert(result, 'null');
            result = deepCompare('Abc', 'Ab');
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare('Abc', 1)
            message(result);
            ctx.assert(result, '!empty');
        });

        test('Should compare booleans successfully', ctx => {
            var result = deepCompare(true, true);
            ctx.assert(result, 'null');
            result = deepCompare(true, false);
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(true, 1)
            message(result);
            ctx.assert(result, '!empty');
        });

        test('Should compare arrays successfully', ctx => {
            var arr1 = [1,2,3,4], arr2 = [1,2,3,4], arr3 = [1,2,3], arr4 = [1,2,3,5];
            var result = deepCompare(arr1, arr2);
            ctx.assert(result, 'null');
            result = deepCompare(arr1, arr3);
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(arr1, arr4)
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(arr1, '1,2,3,4');
            message(result);
            ctx.assert(result, '!empty');
        });

        test('Should compare simple objects successfully', ctx => {
            function O1(id, name) {
                this.id = id;
                this.name = name;
            }
            function O2(id, name) {
                this.id = id;
                this.name = name;
            }
            var obj1 = new O1(1, 'A'), obj2 = new O1(1, 'A'), obj3 = new O2(1, 'A'), obj4 = new O1(1, 'B'), obj5 = new O1(2, 'A');
            var result = deepCompare(obj1, obj2);
            ctx.assert(result, 'null');
            obj2.say = 'Hello!';
            result = deepCompare(obj1, obj2);
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(obj1, obj3)
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(obj1, obj4)
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(obj1, obj5)
            message(result);
            ctx.assert(result, '!empty');
        });

        test('Should compare complex objects successfully', ctx => {
            function O0(id, name) {
                this.id = id;
                this.name = name;
            }

            function O1(id, name, children) {
                this.o0 = new O0(id, name);
                this.children = children;
            }

            function O2(id, name) {
                this.o0 = new O0(id, name);
                this.children = children;
            }

            var c1 = new O1(1, 'C1', null);
            var c2 = new O1(1, 'C1', null);
            var c3 = new O1(2, 'C3', null);

            var p1 = new O1(4, 'P1', [c1, c2]);
            var p2 = new O1(4, 'P1', [c1, c2]);
            var p3 = new O1(4, 'P1', [c1, c3]);
            var p4 = new O1(5, 'P4', [c1, c2]);

            var g1 = new O1(6, 'G1', [p1, p2]);
            var g2 = new O1(6, 'G1', [p1, p2]);
            var g3 = new O1(6, 'G2', [p1, p2]);
            var g4 = new O1(6, 'G1', [p1, p3]);

            var result = deepCompare(c1, c2);
            ctx.assert(result, 'null');
            result = deepCompare(c1, c3);
            message(result);
            ctx.assert(result, '!empty');

            result = deepCompare(p1, p2)
            ctx.assert(result, 'null');
            result = deepCompare(p1, p3)
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(p1, p4)
            message(result);
            ctx.assert(result, '!empty');

            result = deepCompare(g1, g2)
            ctx.assert(result, 'null');
            result = deepCompare(g1, g3)
            message(result);
            ctx.assert(result, '!empty');
            result = deepCompare(g1, g4)
            message(result);
            ctx.assert(result, '!empty');
        });
    }

    var tests = () => [
        // test_hash,
        // test_deepComapre,
        // test_getObjectAt,
        // test_clone,
        test_mergeObjects,
        // test_getSetObjectAt,
        // test_load,
        // test_binSearch,
        // test_html
    ];

    publish(tests, 'BaseTests');
})();