include('./schema.js');

var testData = {};

function createTypes() {
    var types = {};
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
        types.map.validate({ "0":1 }, results);
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

    // var schema = new Schema();
    // var colors = ['red', 'green', 'blue'];
    // var type = schema.buildType({ 'name':'uint8', 'type':'int', 'min':0, 'max':255 });
    // message(`${type.name}:${type.baseType.name} added`);
    // type = schema.buildType({ 'name':'uint16', 'type':'int', 'min':0, 'max':65536 });
    // message(`${type.name}:${type.baseType.name} added`);
    // type = schema.buildType({ 'name':'uint32', 'type':'int', 'min':0, 'max':4294967296 });
    // message(`${type.name}:${type.baseType.name} added`);
//         type = schema.types.type;
//         var value = schema.types.Types; //type.createValue();
//         Dbg.prln('\n *** ' + value.name)
// debugger
//         var errors = type.validate(value);
//         message_errors(errors);
    // var totalResults = [];
    // var totalErrors = 0;
    // test('Should parse and validate all 500 random values of all types successfully', ctx => {
    //     for (var ci=0; ci<500; ci++) {
    //         for (var key in schema.types) {
    //             var type = schema.types[key];
    //             if (!type.isAbstract) {
    //                 var value = type.createValue();
    //                 var totalResult = { type:type.name, value:null, errors:null };
    //                 if (value == null) {
    //                     totalResult.errors = [new Error('Value was null!')];
    //                     totalErrors++;
    //                 } else {
    //                     if (type == schema.types.type || type == schema.types.Types || type == schema.types.TypeList) {
    //                         totalResult.value = `{${value.name}}`;
    //                     } else {
    //                         totalResult.value = JSON.stringify(value);
    //                     }
    //                     var errors = type.validate(value);
    //                     if (errors.length > 0) {
    //                         totalResult.errors = errors;
    //                         totalErrors++;
    //                     }
    //                 }
    //                 totalResults.push(totalResult);
    //             }
    //         }
    //     }
    //     ctx.assert(totalErrors, '=', 0);
    //     for (var ei=0; ei<totalResults.length; ei++) {
    //         if (totalResults[ei].errors) {
    //             message(`${totalResults[ei].type} = ${totalResults[ei].value}`);
    //             message_errors(totalResults[ei].errors);
    //         }
    //     }
    // });
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
        ctx.assert(types.person.attributes.get('id'), 'null');
        ctx.assert(types.person.getAttribute('id'), ':=', ['id', types.entity.attributes.get('id')]);
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

function test_create_schema() {
    header('Test create schema');
    var schema = new Schema();
    test('Should automatically add a \'type\' type', ctx => ctx.assert(schema.types.has('type'), '!null'));
    schema.addDefaultTypes();
    test('Should add a all default types', ctx => {
        var countOfMissingTypes = 0;
        for (var i=0; i<Schema.defaultTypes.length; i++) {
            if (schema.types.iterate( (k, v) => v == Schema.defaultTypes[i])) {
                message(k);
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
            if (schema.types.iterate( (k, v) => v == types[i])) {
                message(k);
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
        { "name":"Child", "type":"Base", "attributes": {
            "parent": { "type":"Parent" } }
        },
        { "name":"Parent", "type":"Base", "attributes": {
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
        var child = schema.types.get('Child')
        var parent = schema.types.get('Parent')
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
        schema.addInstance(int8Type.createValue());
        schema.addInstance(12, int8Type);
        var string20Type = schema.types.get('string20');
        schema.addInstance('string20', string20Type);
        var stringType = schema.types.get('string');
        var str = new String('string'); str.__type__ = stringType;
        schema.addInstance(str);
        var parentType = schema.types.get('Parent');
        var parent1 = parentType.createValue();
        schema.addInstance(parent1);
        var child1 = { 'name':'Child1', 'parent':parent1 };
        schema.addInstance(child1, schema.types.get('Child'));

        ctx.assert(schema.instances.has(int8Type.name), 'true');
        ctx.assert(schema.instances.get(int8Type.name).length, '=', 2);
        ctx.assert(schema.instances.has(string20Type.name), 'true');
        ctx.assert(schema.instances.get(string20Type.name).length, '=', 1);
        ctx.assert(schema.instances.has(stringType.name), 'true');
        ctx.assert(schema.instances.get(stringType.name).length, '=', 1);
        ctx.assert(schema.instances.has(parentType.name), 'true');
        ctx.assert(schema.instances.get(parentType.name).length, '=', 1);        
    });
}

async function test_complex_schema() {
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

var tests = () => [
    // test_types,
    // test_complex_type,
    // test_type_enum,
    // test_create_schema,
    // test_build_schema,
    test_complex_schema
];

publish(tests, 'Type tests');