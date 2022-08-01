include('./schema.js');

var testData = {};

function createTypes() {
    var types = {};
    types.type = new TypeType('type');
    types.bool = new BoolType('bool');
    types.int = new IntType('int');
    types.uint8 = new IntType('uint8', types.int, { 'min': 0, 'max': 255 });
    types.float = new FloatType('float');
    types.normalized = new FloatType('normalized', types.float, { 'min': 0, 'max': 1 });
    types.string = new StringType('string');
    types.string4 = new StringType('string4', types.string, { 'length': 4 });
    testData.enumValues = ['red', 'green', 'blue'];
    types.enum = new EnumType('enum', null, { 'values': testData.enumValues });
    testData.list = [1,2,3,4,5];
    types.list = new ListType('list', null, { 'elemType':types.int, 'length': 5 });
    testData.map = new Map().set(0, 'red').set(1, 'green').set(2, 'blue');
    types.map = new MapType('map', null, { 'keyType':types.int, 'valueType':types.string });
    types.person = new ObjectType('person', null, {
        'attributes': {
            'name':{
                'type':types.string, 'isRequired':false
            },
            'id': {
                'type':types.uint8
            }
        }
    });
    testData.person1 = types.person.createValue({
        'name': 'Karcsi',
        'id': 1
    });
    testData.persons = [
        testData.person1,
        types.person.createValue({
            'name': 'Sanyi',
            'id': 2
        }),
        types.person.createValue({
            'name': 'Anna',
            'id': 3
        })        
    ];
    types.persons = new EnumType('persons', null, { 'values': testData.persons });
    return types;
}

function test_types() {
    header('Test types');
    var types = createTypes();
    test('Should create valid types', ctx => {
        ctx.assert(types.type.name, '=', 'type');
        ctx.assert(types.bool.name, '=', 'bool');
        ctx.assert(types.int.name, '=', 'int');
        ctx.assert(types.uint8.name, '=', 'uint8'); ctx.assert(types.uint8.min, '=', 0); ctx.assert(types.uint8.max, '=', 255);
        ctx.assert(types.float.name, '=', 'float');
        ctx.assert(types.normalized.name, '=', 'normalized'); ctx.assert(types.normalized.min, '=', 0); ctx.assert(types.normalized.max, '=', 1);
        ctx.assert(types.string.name, '=', 'string');
        ctx.assert(types.string4.name, '=', 'string4'); ctx.assert(types.string4.length, '=', 4);
        ctx.assert(types.enum.name, '=', 'enum'); ctx.assert(types.enum.values, '=', testData.enumValues);
        ctx.assert(types.persons.name, '=', 'persons'); ctx.assert(types.persons.values, '=', testData.persons);
        ctx.assert(types.map.name, '=', 'map'); ctx.assert(types.map.keyType, '=', types.int); ctx.assert(types.map.valueType, '=', types.string);
        ctx.assert(types.list.name, '=', 'list'); ctx.assert(types.list.elemType, '=', types.int);
        ctx.assert(types.person.name, '=', 'person'); ctx.assert(types.person.attributes.size, '=', 2);
    });

    test('Should parse values successfully', ctx => {
        ctx.assert(types.bool.parse('true'), '=', true);
        ctx.assert(types.bool.parse('false'), '=', false);
        ctx.assert(types.bool.parse('1'), '=', true);
        ctx.assert(types.bool.parse('0'), '=', false);
        ctx.assert(types.bool.parse(''), '=', false);
        ctx.assert(types.int.parse('1234'), '=', 1234);
        ctx.assert(types.uint8.parse('12'), '=', 12);
        ctx.assert(types.float.parse('12.34'), '=', 12.34);
        ctx.assert(types.normalized.parse('0.4'), '=', 0.4);
        ctx.assert(types.string.parse('"Abcdefghijklmnopqrstuvxyz"'), '=', 'Abcdefghijklmnopqrstuvxyz');
        ctx.assert(types.string4.parse('"Abcd"'), '=', 'Abcd');
        ctx.assert(types.enum.parse('"red"'), '=', 'red');
        ctx.assert(types.persons.parse(JSON.stringify(testData.persons[0])), ':=', testData.persons[0]);
        ctx.assert(types.list.parse('[1,2,3,4,5]'), ':=', testData.list);
        ctx.assert(types.map.parse('{"0":"red","1":"green","2":"blue"}'), ':=', testData.map);
        var person2 = { 'id':2 };
        ctx.assert(types.person.parse(JSON.stringify(testData.person1)), ':=', testData.person1);
        ctx.assert(types.person.parse(JSON.stringify(person2)), ':=', person2);
    });

    test('Should parse values with error', ctx => {
        ctx.throws( () => types.int.parse('a1234'));
        ctx.throws( () => types.uint8.parse('1234'));
        ctx.throws( () => types.float.parse('NaN'));
        ctx.throws( () => types.normalized.parse('NaN'));
        ctx.throws( () => types.string.parse({}));
        ctx.throws( () => types.string4.parse('Abcdef'));

        ctx.throws( () => types.enum.parse('black'));
        ctx.throws( () => types.map.parse('baka'));
        ctx.throws( () => types.map.parse('a:red', ':'));
        ctx.throws( () => types.list.parse('1,green,23', ','));
        ctx.throws( () => types.list.parse('1,2,3,4,5,6,7'));
        var person2 = { 'name':'Sanyi' };
        var person3 = { 'id':'bla' };
        ctx.throws( () => types.person.parse(JSON.stringify(person2)));
        ctx.throws( () => types.person.parse(JSON.stringify(person3)));
    });

    test('Should validate successfully', ctx => {
        var results = [];
        types.bool.validate(true, results);
        types.int.validate(12, results);
        types.uint8.validate(128, results);
        types.float.validate(12.34, results);
        types.normalized.validate(0.4, results);
        types.string.validate('hello world!', results);
        types.string4.validate('baka', results);
        types.enum.validate('red', results);
        types.map.validate(testData.map, results);
        types.list.validate([2], results);
        types.person.validate(testData.person1, results);
        ctx.assert(results, 'empty');
    });

    test('Should validate with errors', ctx => {
        var results = [];
        // int
        types.int.validate(12.3, results);
        types.int.validate('a', results);
        ctx.assert(results[0].messages.length, '=', 1);
        ctx.assert(results[1].messages.length, '=', 1);
        results.forEach( v => message(v));
        // uint8
        results = [];
        types.uint8.validate(1234, results);
        types.uint8.validate(-1, results);
        ctx.assert(results[0].messages.length, '=', 1);
        ctx.assert(results[1].messages.length, '=', 1);
        results.forEach( v => message(v));
        // float
        results = [];
        types.float.validate('12.34', results);
        types.float.validate(NaN, results);
        types.normalized.validate(-0.4, results);
        types.normalized.validate(1.4, results);
        ctx.assert(results[0].messages.length, '=', 1);
        ctx.assert(results[1].messages.length, '=', 1);
        ctx.assert(results[2].messages.length, '=', 1);
        ctx.assert(results[3].messages.length, '=', 1);
        results.forEach( v => message(v));
        // string
        results = [];
        types.string.validate(null, results);
        types.string4.validate('hello world!', results);
        ctx.assert(results[0].messages.length, '=', 1);
        ctx.assert(results[1].messages.length, '=', 1);
        results.forEach( v => message(v));

        // enum
        results = [];
        types.enum.validate('gray', results);
        types.enum.validate(1, results);
        ctx.assert(results[0].messages.length, '=', 1);
        ctx.assert(results[1].messages.length, '=', 1);
        results.forEach( v => message(v));
        // map
        results = [];
        var map2 = new Map().set('2', 'two');
        var map3 = new Map().set(2, 123);
        types.map.validate({ 'a0':1 }, results);
        types.map.validate(map2, results);
        types.map.validate(map3, results);
        ctx.assert(results[0].messages.length, '=', 1);
        ctx.assert(results[1].messages.length, '=', 1);
        ctx.assert(results[2].messages.length, '=', 1);
        results.forEach( v => message(v));
        // list
        results = [];
        types.list.validate(testData.map, results);
        types.list.validate(testData.enumValues, results);
        types.list.validate([1, 'baka', 2], results);
        types.list.validate([1,2,3,4,5,6], results);
        ctx.assert(results[0].messages.length, '=', 1);
        ctx.assert(results[1].messages.length, '=', 1);
        ctx.assert(results[2].messages.length, '=', 1);
        //ctx.assert(results[3].messages.length, '=', 1);
        results.forEach( v => message(v));
        // object
        results = [];
        types.person.validate({'id':'a1', "name":"Sanyi"}, results);
        types.person.validate({'id':320, 'name':"Sanyi"}, results);
        types.person.validate({'name':12}, results);
        types.person.validate({'id':1, 'name':12}, results);
        types.person.validate({'id':1, 'name':12, 'age':42}, results);
        ctx.assert(results[0].messages.length, '=', 1);
        ctx.assert(results[1].messages.length, '=', 1);
        ctx.assert(results[2].messages.length, '=', 1);
        ctx.assert(results[3].messages.length, '=', 1);
        ctx.assert(results[4].messages.length, '=', 1);
        results.forEach( v => message(v));
    });

    test('Should create valid values', ctx => {
        ctx.assert(types.bool.createDefaultValue(), '=', false);
    });
}

function test_complex_type() {
    header('Test complex type');
    //#region prepare types
    // Entity(id, name, state)
    // Weapon(type, color, material) : Entity
    // Skill(name, level)
    // Person(class, race, energy, skills, weapons) : Entity
    // Group(name, members)
    var weaponTypes = ['sword', 'knife', 'stick', 'club'];
    var materials = ['wooden', 'iron', 'stone'];
    var colors = ['black', 'gray', 'white', 'yellow', 'brown'];
    var skillNames = ['strength', 'wisdom', 'will'];
    var races = ['human', 'dwarf', 'orc', 'goblin', 'elf'];
    var classes = ['warrior', 'mage', 'strider'];
    var types = {
        'int':          new IntType('int'),
        'uint8':        new IntType('int', null, { 'min':0, 'max':255 }),
        'string':       new StringType('string'),
        'string8':      new StringType('string', null, { 'length': 8 }),
        'colors':       new EnumType('colors', null, { 'values': colors }),
        'weaponTypes':  new EnumType('weaponTypes', null, { 'values': weaponTypes }),
        'materials':    new EnumType('materials', null, { 'values': materials }),
        'skills':       new EnumType('skills', null, { 'values': skillNames }),
        'normalized':   new FloatType('normalized', null, { 'min':0, 'max': 1 }),
        'races':        new EnumType('races', null, { 'values': races }),
        'classes':      new EnumType('classes', null, { 'values': classes })
    };
    types.entity = new ObjectType('entity', null, {
        'attributes': {
            'id': { 'type':types.uint8, 'isRequired':true },
            'name': { 'type':types.string8, 'isRequired':true },
            'state': { 'type':types.normalized, 'isRequired':true }
        }
    });
    types.weapon = new ObjectType('weapon', types.entity, {
        'attributes': {
            'type': { 'type':types.weaponTypes, 'isRequired':true },
            'color': { 'type':types.colors, 'isRequired':true },
            'material': { 'type':types.materials, 'isRequired':true }
        }
    });
    types.skill = new ObjectType('skill', null, {
        'attributes': {
            'name': { 'type':types.skills, 'isRequired':true },
            'level': { 'type':types.uint8, 'isRequired':true }
        }
    });
    types.person = new ObjectType('person', types.entity, {
        'attributes': {
            'class': { 'type':types.classes, 'isRequired':true },
            'race': { 'type':types.races, 'isRequired':true },
            'energy': { 'type':types.normalized, 'isRequired':true },
            'skills': { 'type':new ListType('skills', null, { 'elemType': types.skill }), 'isRequired':true },
            'weapons': { 'type':new ListType('weapons', null, { 'elemType': types.weapon }), 'isRequired':true },
            'description': { 'type':types.string, 'isRequired':false }
        }
    });
    types.personMap = new MapType('personMap', null, { 'keyType':types.string8, 'valueType':types.person });
    types.group = new ObjectType('group', null, {
        'attributes': {
            'name': { 'type':types.string8, 'isRequired':true },
            'members': { 'type':types.personMap, 'isRequired':true }
        }
    });
    //#endregion

    test('Should construct types successfully', ctx => {
        ctx.assert(types.group.attributes.get('members').type.valueType, ':=', types.person);
        ctx.assert(types.person.hasAttribute('id'), 'true');
        ctx.assert(types.person.attributes.get('description').isRequired, 'false');
        ctx.assert(types.person.attributes.get('skills').type.elemType, ':=', types.skill);
    });

    test('Should create values successfully', ctx => {
        var text;
        ctx.notThrows( () => text = stringify(types.group.createValue(), 2));
        message(text);
    })
}

function test_type_enum() {
    header('Test Type enum');
    var types = createTypes();
    var type = new EnumType('type', null, { 'values': Object.values(types)});
    test("Should create 'type' type", ctx => ctx.assert(type.name, '=', 'type'));
    test('Should contain every type', ctx => ctx.assert(type.values, ':=', Object.values(types)));
    var t = type.createValue();
    test('Should create a random type', ctx => ctx.assert(t, ':=', types[t.name]));
    test('Should parse and validate types successfully', ctx => {
        var results = [];
        for (var i in types) {
            message(i);
            t = types[i];
            type.validate(t, results, [i]);
            ctx.notThrows( () => { type.parse(JSON.stringify(t)); });
        }
        ctx.assert(results, 'empty');
    });    
}

function message_errors(errors) {
    for (var i=0; i<errors.length; i++) {
        message(errors[i].toString());
    }
}

function test_compare() {
    header('Test compare');
    var types = {
        'int': new IntType('int'),
        'float': new FloatType('float'),
        'string': new StringType('string')
    }

    var data = [
        {
            'type': new BoolType('bool'),
            'tests': [
                [false, false,  0],
                [true,   true,  0],
                [true,  false,  1],
                [false,  true, -1]
            ],
        },
        {   'type': types.int,
            'tests': [
                [0, 0,  0],
                [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0],
                [1, 0,  1],
                [0, 1, -1]
            ]
        },
        {   'type': new IntType('uint8', types.int, { 'min': 0, 'max': 255 }),
            'tests': [
                [0,     0,  0],
                [255, 255,  0],
                [255,   0,  1],
                [0,   255, -1]
            ]
        },
        {   'type': types.float,
            'tests': [
                [0, 0,  0],
                [Number.MAX_VALUE, Number.MAX_VALUE, 0],
                [Number.MAX_VALUE, 0,  1],
                [0, Number.MAX_VALUE, -1]
            ]
        },
        {   'type': new FloatType('normalized', types.float, { 'min': 0, 'max': 1 }),
            'tests': [
                [0.0, 0.0,  0],
                [1.0, 1.0,  0],
                [1.0, 0.0,  1],
                [0.0, 1.0, -1]
            ]
        },
        {   'type': types.string,
            'tests': [
                ['ABCDEFG', 'ABCDEFG',  0],
                ['',               '',  0],
                ['ABDCDEH', 'ABCDEFG',  1],
                ['ABCDEFG',      'AB',  1],
                ['ABCDEFG', 'ABDCDEH', -1],
                ['AB',      'ABCDEFG', -1]
            ]
        },
        {   'type': new StringType('string4', types.string, { 'length': 4 }),
            'tests': [
                ['abcd', 'abcd',  0],
                ['bcde', 'abcd',  1],
                ['abcd',  'abc',  1],
                ['abcd', 'bcde', -1],
                ['abc',  'abcd',  -1]
            ]
        }
    ];

    for (var i=0; i<data.length; i++) {
        var type = data[i].type;
        for (var j=0; j<data[i].tests.length; j++) {
            var tj = data[i].tests[j];
            test(`Should compare '${type.name}' correctly (${tj[2]})`, ctx => ctx.assert(type.compare(tj[0], tj[1]), '=', tj[2]));
        }
    }
}

function validate_type(type, value) {
    var results = [];
    type.validate(value, results);
    message_errors(results);
    return results;
}

function test_schema() {
    header('Test schema');
    var schema = new Schema();
    var type = null;
    schema.addDefaultTypes();

    test('Should test Type type', ctx => {
        type = schema.types.get('type');
        ctx.assert(type.parse('"bool"'), ':=', schema.types.get('bool'));
    });

    //#region String10
    schema.buildType({ name:'String10', type:"string", length:10 });
    test('Should have String10 type', ctx => {
        type = schema.types.get('String10');
        ctx.assert(type, '!null');
        ctx.assert(type.name, '=', 'String10');
        ctx.assert(type.baseType.name, '=', 'string');
        ctx.assert(type.length, '=', 10);
        ctx.assert(type.elemType, 'null');
    });
    var text = "0123456789";

    test(`Should accept "${text}"`, ctx => ctx.assert(validate_type(type, text), 'empty'));
    text = "0123456789A";
    test(`Should reject "${text} (length)"`, ctx => ctx.assert(validate_type(type, text).length, '=', 1));
    text = 12;
    test(`Should reject "${text} (mismatch)"`, ctx => ctx.assert(validate_type(type, text).length, '=', 1));
    //#endregion

    //#region Int100
    schema.buildType({ name:'Int100', type:'int', min:0, max:100 });
    test('Should have Int100 type', ctx => {
        type = schema.types.get('Int100');
        ctx.assert(type, '!null');
        ctx.assert(type.name, '=', 'Int100');
        ctx.assert(type.baseType.name, '=', 'int');
        ctx.assert(type.min, '=', 0);
        ctx.assert(type.max, '=', 100);
        ctx.assert(type.elemType, 'null');
    });
    var num = 12;
    test(`Should accept ${num}`, ctx => ctx.assert(validate_type(type, num), 'empty'));
    num = -12;
    test(`Should reject ${num} (min)`, ctx => ctx.assert(validate_type(type, num).length, '=', 1));
    num = 101;
    test(`Should reject ${num} (max)`, ctx => ctx.assert(validate_type(type, num).length, '=', 1));
    //#endregion

    //#region Int100Arr5
    schema.buildType({ name:'Int100Arr5', type:'list', length:5, elemType:'Int100' });
    test('Should have Int100Arr5 type', ctx => {
        type = schema.types.get('Int100Arr5');
        ctx.assert(type, '!null');
        ctx.assert(type.name, '=', 'Int100Arr5');
        ctx.assert(type.baseType.name, '=', 'list');
        ctx.assert(type.elemType, '=', schema.types.get('Int100'));
    });
    var arr = [1,2,3,4,5];
    test(`Should accept ${arr}`, ctx => ctx.assert(validate_type(type, arr), 'empty'));
    arr = [1,2,3,4,5,6];
    test(`Should reject ${arr} (length)`, ctx => ctx.assert(validate_type(type, arr).length, '=', 1));
    arr = [1,2,3,4,500];
    test(`Should reject ${arr} (max)`, ctx => ctx.assert(validate_type(type, arr).length, '=', 1));
    arr = [1,2,3,4,'a5'];
    test(`Should reject ${arr} (type)`, ctx => ctx.assert(validate_type(type, arr).length, '=', 1));
    //#endregion

    //#region EnumColors
    schema.buildType({ name:'EnumColors', type:'enum', values:['blue', 'red', 'green'] });
    test('Should have EnumColors type', ctx => {
        type = schema.types.get('EnumColors');
        ctx.assert(type, '!null');
        ctx.assert(type.baseType.name, '=', 'enum');
        ctx.assert(type.values.length, '=', '3');
    });
    var color = 'blue';
    test(`Should accept '${color}'`, ctx => ctx.assert(validate_type(type, color), 'empty'));
    color = 'blu';
    test(`Should reject '${color}'`, ctx => ctx.assert(validate_type(type, color).length, '=', 1));
    //#endregion

    //#region Person
    schema.buildType({ name:'Person', attributes: {
        "id": { type:{ name:'Int1000', type:'int', min:1, max:1000 } },
        "name": { type:'string' },
        "parent": { type:'Person', 'isRequired': false },
        "color": { type: 'EnumColors' }
    }});
    test('Should have Person type', ctx => {
        type = schema.types.get('Person');
        ctx.assert(type, '!null');
        ctx.assert(type.baseType.name, '=', 'object');
        ctx.assert(type.attributes.size, '=', '4');
    });

    var grandpa = { id:3, name:'Grandpa', color:'green' };
    var parent = { id:1, name:'Dad', parent:grandpa, color:'blue' };
    var child = { id:2, name:'Child', parent:parent, color:'red' };
    test(`Should accept ${JSON.stringify(child)}`, ctx => ctx.assert(validate_type(type, child), 'empty'));
    child.id = 'id';
    parent.name = 12;
    parent.color = 'black';
    delete grandpa.id;
    test(`Should reject ${JSON.stringify(child)}`, ctx => ctx.assert(validate_type(type, child).length, '=', 4));
    //#endregion

    //#region MapInt2Str
    schema.buildType({ name:'MapInt2Str', type:'map', keyType:'int', valueType:'string' });
    test('Should have MapInt2Str type', ctx => {
        type = schema.types.get('MapInt2Str');
        ctx.assert(type, '!null');
        ctx.assert(type.baseType.name, '=', 'map');
        ctx.assert(type.keyType.name, '=', 'int');
        ctx.assert(type.valueType.name, '=', 'string');
    });
    var map = { 1:'1', 2:'2', 3:'3' };
    test(`Should accept object:${JSON.stringify(map)}`, ctx => ctx.assert(validate_type(type, map), 'empty'));

    map = { a:'1', 2:2, 3:'3' };
    test(`Should reject object:${JSON.stringify(map)}`, ctx => ctx.assert(validate_type(type, map).length, '=', 3));
    //#endregion

    //#region MyObject
    schema.buildType({ name:'MyObject', type:'object', attributes: {
        "id": { type:"int" },
        "text": { type:"string" },
        "map": { type:"MapInt2Str" }
    }});
    test('Should have MyObject type', ctx => {
        type = schema.types.get('MyObject');
        ctx.assert(type, '!null');
        ctx.assert(type.baseType.name, '=', 'object');
        ctx.assert(type.attributes.size, '=', '3');
    });

    var obj1 = { 'id': 12, 'text': 'Hello World!', map: {1:'one', 2:'two', 3:'three'} };
    test(`Should accept object:${JSON.stringify(obj1)}`, ctx => ctx.assert(validate_type(type, obj1), 'empty'));
    
    var obj2 = { 'id': 12, 'text': 'Hello World!', map: {1:'one', '2a':'two', 3:'three'}, 'isValid':false };
    test(`Should reject object:${JSON.stringify(obj2)}`, ctx => ctx.assert(validate_type(type, obj2).length, '=', 2));
    //#endregion

    //#region MyObjectList
    schema.buildType({ name:'MyObjectList', type:'list', elemType:'MyObject'});
    test('Should have MyObjectList type', ctx => {
        type = schema.types.get('MyObjectList');
        ctx.assert(type, '!null');
        ctx.assert(type.baseType.name, '=', 'list');
        ctx.assert(type.elemType.name, '=', 'MyObject');
    });

    var objList1 = [
        { 'id': 1, 'text': 'Hello #1!', map: {1:'one', 2:'two', 3:'three'} },
        { 'id': 2, 'text': 'Hello #2!', map: {1:'one', 2:'two', 3:'three'} }
    ];
    test('Should accept object list', ctx => ctx.assert(validate_type(type, objList1), 'empty'));
    var objList2 = [
        { 'id': 'a', 'text': 'Hello #1!', map: {1:'one', '2a':'two', 3:'three'} },
        { 'id': 2, 'text': 123 }
    ];
    test('Should reject object list', ctx => ctx.assert(validate_type(type, objList2).length, '=', 5));
    //#endregion

    //#region MySuperObject
    schema.buildType({ name:'MySuperObject', type:"MyObject", attributes: {
            "sid": { type:"int" },
            "guid": { type:"string" },
            "parent": { type:"MySuperObject", isRequired:false },
            "children": { type:"MyObjectList"}
    }});
    test('Should have MySuperObject type', ctx => {
        type = schema.types.get('MySuperObject');
        ctx.assert(type, '!null');
        ctx.assert(type.baseType.name, '=', 'MyObject');
    });
    var superObject = {
        id: 1,
        text: "Hello",
        map: {1:'one', 2:'two', 3:'three'},
        sid: 12,
        guid: "a213-124f",
        parent: null,
        children: objList1
    }
    test('Should accept super object', ctx => ctx.assert(validate_type(type, superObject), 'empty'));

    test('Should create reference types', ctx => {
        schema.buildType({ type:'ref    MyObject' });
        schema.buildType({ name:'MyRefList', type:'list', elemType:'ref \n  MyObject' });
        schema.buildType({ name:'MyIndex', attributes: {
            persons: { type:{ type:'list', elemType:'ref Person' }}}
        });
        
        ctx.assert(schema.types.get('refMyObject'), '!null');
        ctx.assert(schema.types.get('refPerson'), '!null');
        ctx.assert(schema.types.get('MyIndex').attributes.get('persons').type.baseType, '=', schema.types.get('list'));
        ctx.assert(schema.types.get('MyIndex').attributes.get('persons').type.elemType, '=', schema.types.get('refPerson'));
    });
    //#endregion

    schema.buildType({ name:'MyDataTypes', type:schema.types.get('list'), elemType:'type'});
    test('Should accept run-time types', ctx => {
        var rtTypes = [
            { 'name':'String256', 'type':'string', 'length':256 },
            { 'name':'Byte', 'type':'int', 'min':0,'max':255 },
            { 'name':'Method', 'attributes': {
                    'name': { 'type':'String256' },
                    'arguments': { 'type':'attributeList' },
                    'return': { 'type':'type' }
                }
            },
            { 'name':'Class',
                'attributes': {
                    'name': { 'type':'String256' },
                    'extends': { 'type':'String256' },
                    'properties': { 'type':'attributeList' },
                    'methods': { 'type':{ 'type':'list', 'elemType':'Method' } }
                }
            }
        ];

        var type = schema.types.get('MyDataTypes');
        var results = [];
        type.validate(rtTypes, results);

        if (schema.types.get('String256') == null) results.push(new ValidationResult(path || [], ['String256 is not defined!']));
        if (schema.types.get('Byte') == null) results.push(new ValidationResult(path || [], ['Byte is not defined!']));
        if (schema.types.get('Class') == null) results.push(new ValidationResult(path || [], ['Class is not defined!']));
        if (results.length > 0) message_errors(results);
        ctx.assert(results, 'empty');

        var myClass = {
            "name":"MyFirstClass",
            "extends":"BaseClass",
            "properties": [
                {"name":"id", "type":"int"}
            ],
            "methods": [
                { "name":"Print", "arguments":[], "return":"Byte" }
            ]
        };
        type = schema.types.get('Class');
        results.length = 0;
        type.validate(myClass, results);
        if (results.length > 0) message_errors(results);
        ctx.assert(results, 'empty');
    });
    test('Should handle late type definitions', ctx => {
        var mySchema = new Schema();
        mySchema.addDefaultTypes();
        mySchema.addTypes([
            mySchema.getOrBuildType({
                'name':'Code',
                'attributes': {
                    'types':    { 'type':'typeList' },
                    'methods':  { 'type':{ 'type':'list', 'elemType':'Method' } },
                    'master':   { 'type':'type' }
                }
            }),
            mySchema.getOrBuildType({
                'name': 'Method',
                'attributes': {
                    'name':     { 'type':'string100' },
                    'id':       { 'type':'int100' },
                    'arguments':{ 'type':'attributeList' },
                    'returns':  { 'type':'type' }
                }
            }),
            mySchema.getOrBuildType({ 'name':'string100', 'type':'string', 'length':100 }),
            mySchema.getOrBuildType({ 'name':'int100', 'type':'int', 'min':0, 'max':100 })
        ]);
        mySchema.checkMissingTypes();
        ctx.assert(mySchema.types.get('Code'), '!null');
        ctx.assert(mySchema.types.get('Code').attributes.get('methods').type.elemType, '=', mySchema.types.get('Method'));
        var code = {
            "master":{ "name":"Master", "type":"i100" },
            "methods": [
                {   "name":"read", "id":1,
                    "arguments": [
                        { "name":"deviceId", "type":"DeviceId", "isRequired":true },
                        { "name":"length", "type":"DWORD", "isRequired":true },
                        { "name":"offset", "type":"DWORD", "isRequired":false }
                    ],
                    "returns":"Buffer"
                },
                { "name":"write", "id":2, "arguments": [
                    { "name":"deviceId", "type":"DeviceId", "isRequired":true },
                    { "name":"buffer", "type":"Buffer", "isRequired":true },
                    { "name":"length", "type":"DWORD", "isRequired":false },
                    { "name":"offset", "type":"DWORD", "isRequired":false }
                ]}
            ],
            "types": [
                { "name":"DeviceId", "type":"i100", "min":1, "max":20 },
                { "name":"DWORD", "type":"int", "min":0, "max":4294967296 },
                { "name":"Buffer",
                    "attributes": [
                        { "name":"address", "type":"DWORD" },
                        { "name":"length", "type":"int" }
                    ]
                },
                { "name":"i100", "type":"int100" }
            ]
        };
        var errors = [];
        mySchema.validate(mySchema.types.get('Code'), code, errors);
        if (errors.length > 0) message_errors(errors);
        ctx.assert(errors, 'empty');
    });
}

function test_create_schema() {
    header('Test create schema');
    var schema = new Schema();
    test('Should automatically add a \'type\' type', ctx => ctx.assert(schema.types.has('type'), '!null'));
    schema.addDefaultTypes();
    test('Should add all default types', ctx => {
        var countOfMissingTypes = 0;
        for (var i=0; i<Schema.defaultTypes.length; i++) {
            if (!schema.types.has(Schema.defaultTypes[i].name)) {
            //if (schema.types.iterate( (k, v) => v == Schema.defaultTypes[i])) {
                message(Schema.defaultTypes[i].name);
                countOfMissingTypes++;
            }
        }
        ctx.assert(countOfMissingTypes, '=', 0)
    });

    test('Should containt every added type', ctx => {
        var types = Object.values(createTypes());
        schema.addTypes(types);
        var countOfMissingTypes = 0;
        for (var i=0; i<types.length; i++) {
            if (!schema.types.has(types[i].name)) {
                message(types[i].name);
                countOfMissingTypes++;
            }
        }
        ctx.assert(countOfMissingTypes, '=', 0)
    });
}

function test_build_schema() {
    header('Test build schema from definition');

    var definition = [
        { "name":"int8", "type":"int", "min":-128, "max":127 },
        { "name":"string20", "type":"string", "length":20 },
        { "name":"Base", "attributes": {
            "name": { "type":"string", "length":8 } }
        },
        { "name":"Child", "type":"Base", "ref":"name", "attributes": {
            "parent": { "type":"Parent" } }
        },
        { "name":"Parent", "type":"Base", "ref":"name", "attributes": {
            "firstChild": { "type":"Child" },
            "children": { "type": { "name":"ChildList", "type":"list", "elemType":"Child" } } }
        }
    ];
    var schema = new Schema();
    schema.addDefaultTypes();
    schema.build(definition);

    test('Should build types successfully', ctx => {
        ctx.assert(schema.types.get('int8'), '!null');
            ctx.assert(schema.types.get('int8').min, '=', -128);
        ctx.assert(schema.types.get('string20'), '!null');
            ctx.assert(schema.types.get('string20').length, '=', 20);
        var base = schema.types.get('Base');
        var child = schema.types.get('Child');
        var parent = schema.types.get('Parent');
        ctx.assert(base, '!null');
            ctx.assert(base.attributes.size, '=', 1);
        ctx.assert(child, '!null');
            ctx.assert(child.attributes.get('parent').type, '=', parent);
        ctx.assert(parent, '!null');
            ctx.assert(parent.attributes.get('firstChild').type, '=', child);
            ctx.assert(parent.attributes.get('children').type.type, '=', schema.types.get('list)'));
            ctx.assert(parent.attributes.get('children').type.elemType, '=', child);
    });

    test('Should build a recursive types successfully', ctx => {
        schema.build([
            { "name":"recursiveList", "type":"list", "elemType":"recursiveList" },
            { "name":"recursiveMap", "type":"map", "keyType":"string", "valueType":"recursiveMap" },
            { "name":"recursiveObject", "type":"object", "attributes":{ "id":{ "type":"int" }, "parent":{ "type":"recursiveObject" } } }
        ]);
        var rl = schema.types.get('recursiveList');
        var rm = schema.types.get('recursiveMap');
        var ro = schema.types.get('recursiveObject');
        ctx.assert(rl, '!null');
        ctx.assert(rl.elemType, '=', rl);
        ctx.assert(rm, '!null');
        ctx.assert(rm.valueType, '=', rm);
        ctx.assert(ro, '!null');
        ctx.assert(ro.attributes.get('parent').type, '=', ro);

        maxRecursion = Type.MAX_RECURSION;
        Type.MAX_RECURSION = 2;
        ctx.notThrows( () => {
            var list = rl.createValue();
            message(JSON.stringify(list, null, 1));
            var map = rm.createValue();
            message(stringify(map, 1));
            var obj = ro.createValue();
            message(JSON.stringify(obj, null, 1));
        });
        Type.MAX_RECURSION = maxRecursion;
    });

    test('Should add instances successfully', ctx => {
        var int8Type = schema.types.get('int8');
        var int8 = int8Type.createValue();
        schema.addInstance(int8, 'int8');
        schema.addInstance(12, '12', int8Type);
        var string20Type = schema.types.get('string20');
        schema.addInstance('string20', 'string20', string20Type);
        var stringType = schema.types.get('string');
        var str = new String('string'); str.__type__ = stringType;
        schema.addInstance(str, 'string');
        var parentType = schema.types.get('Parent');
        var parent1 = parentType.createValue();
        schema.addInstance(parent1);
        var childType = schema.types.get('Child');
        var child1 = { 'name':'Child1', 'parent':parent1 };
        schema.addInstance(child1, null, childType);

        ctx.assert(schema.instances.has(int8Type.name), 'true');
        ctx.assert(schema.getInstance('int8', int8Type), '=', int8);
        ctx.assert(schema.getInstance('12').valueOf(), '=', 12);

        ctx.assert(schema.instances.has(string20Type.name), 'true');
        ctx.assert(schema.getInstance('string20'), '=', 'string20');

        ctx.assert(schema.instances.has(stringType.name), 'true');
        ctx.assert(schema.getInstance('string'), '=', 'string');

        ctx.assert(schema.instances.has(parentType.name), 'true');
        ctx.assert(schema.getInstance(parent1.name), '=', parent1);

        ctx.assert(schema.instances.has(childType.name), 'true');
        ctx.assert(schema.getInstance('Child1'), '=', child1);
    });
}

async function test_complex_schema() {
    header('Test complex schema');
    var res = await load('./test/test-schema.json');
    if (!res.error) {
        var schema = null;
        await test('Should build the schema successfully', async function(ctx) {
            await ctx.notThrows(async function() {
                schema = await Schema.build(res.data);
            });
        });
        if (schema) {
            test('Should have a valid "Design" type', ctx => {
                var design = schema.types.get('Design');
                    ctx.assert(design, '!null');
                    ctx.assert(design.attributes.get('types').type, '=', schema.types.get('typeList'));
                var method = schema.types.get('Method');
                    ctx.assert(method.attributes.get('arguments').type, '=', schema.types.get('attributeList'));
                var methods = design.attributes.get('methods');
                    ctx.assert(methods.type.type, '=', schema.types.get('listType'));
                    ctx.assert(methods.type.elemType, '=', method);
                var interface = schema.types.get('Interface');
                    ctx.assert(interface.attributes.get('methods').type.elemType, '=', method);
                var interfaces = design.attributes.get('interfaces');
                    ctx.assert(interfaces.type.baseType, '=', schema.types.get('list'));
                    ctx.assert(interfaces.type.elemType instanceof ObjectType, 'true');
                    ctx.assert(interfaces.type.elemType, '=', interface);
                var class_ = schema.types.get('Class');
                    ctx.assert(class_.attributes.get('implements').type, '=', schema.types.get('InterfaceRefList'));
                    ctx.assert(class_.attributes.get('implements').type.elemType.baseType, '=', schema.types.get('Interface'));
                var classes = design.attributes.get('classes');
                    ctx.assert(classes.type.baseType, '=', schema.types.get('list'));
                    ctx.assert(classes.type.elemType instanceof ObjectType, 'true');
                    ctx.assert(classes.type.elemType, '=', class_);            
            });

            res = await load('./test/test-definition.json');
            if (!res.error) {
                var designInstance = res.data;
                var results = schema.validate(designInstance, 'Design');
                for (var i=0; i<results.length; i++) {
                    message(results[i]);
                }
                test('Should validate a Design instance successfully', ctx => ctx.assert(results, 'empty'));
                test('Should have created a new type', ctx => {
                    ctx.assert(schema.types.get('ByteList'), '!null');
                });
                test('Should have created instances', ctx => {
                    var methods = schema.instances.get('Method');
                    var interfaces = schema.instances.get('Interface');
                    var classes = schema.instances.get('Class');
                    ctx.assert(methods.Write, '!null');
                    ctx.assert(interfaces.IAccess, '!null');
                    ctx.assert(classes.Reader, '!null');
                    var interface = schema.types.get('Interface');
                    var implements = schema.getInstance(classes.Reader.implements[0], interface);
                    ctx.assert(implements, '!null');
                });
            } else {
                error(res.error);
            }
        }
    } else {
        error(res.error);
    }
}

async function test_mergeObjects() {
    header('Test merge objects');

    var schema = new Schema();
    schema.addDefaultTypes();
    var personType = schema.buildType({
        'name':'Person',
        'attributes':{
            'id':{ 'type':'string' },
            'name':{ 'type':'string' },
            'age':{ 'type':'int' },
            'role':{ 'type':'string' }
        },
        'ref':'id'
    });

    var companyType = schema.buildType({
        'name':'Company',
        'attributes':{
            'id':{ 'type':'string' },
            'name':{ 'type':'string' },
            'director':{ 'type':'ref Person' },
            'employees':{ 'type':{ 'type':'list', 'elemType':'ref Person' }}
        }
    });

    var dummy = personType.createValue({'id':'p1', 'name':'Dummy', 'age':14, 'role':'dummy'});
    var joe = personType.createValue({'name':'Joe', 'age':24});
    var jane = personType.createValue({'id':'p2', 'name':'Jane', 'age':32, 'role':'manager'});
    schema.addInstance(joe);
    schema.addInstance(jane);
    var acme = companyType.createValue({'name':'Acme company', 'id':'c1', 'director':'p2', 'employees': ['p1', 'p2'] });
    test('Should merge 2 objects of same type', ctx => {
        schema.mergeObjects(dummy, joe);
        message(JSON.stringify(joe));
        var expected = { 'id':'p1', 'name':'Joe', 'age':24, 'role':'dummy' };
        ctx.assert(joe, ':=', expected);
    });
    test('Should merge 2 objects of different types', ctx => {
        schema.mergeObjects(joe, acme, mergeObjects.OVERWRITE);
        message(JSON.stringify(acme));
        var expected = { 'id':'p1', 'name':'Joe', 'director':'p2', 'employees': ['p1', 'p2'] };
        ctx.assert(acme, ':=', expected);
    });
}

var tests = () => [
    test_types,
    test_complex_type,
    test_type_enum,
    test_compare,
    test_schema,
    test_create_schema,
    test_build_schema,
    test_complex_schema,
    test_mergeObjects
];

publish(tests, 'Type tests');