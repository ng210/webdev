include('syntax.js');
include('schema.js');

(function(){
    self.grammar = null;
    async function test_syntax() {
        if (!self.grammar) {
            await load('./test/grammar.js');
        }

        header('Test syntax');
        var results = [
            'Test syntax'
        ];
        var tests = {
            '6': '1+2+3',
            '7': '1+2*3',
            '5': '1*2+3',
            '6': '1*2*3',
           '11': '1+2*3+4',
           '14': '1*2+3*4',
           '10': '1*2*3+4',
           '25': '1+2*3*4',
           '9': '(1+2)*3',
           '65': '((1+2)*3+4)*5',
           '20': 'pow(2,4)+sqrt((4+4)*2)',
           '60': '2*pow(4,2)+sqrt(pow(5,4))+3',
           '30': '2*get(id)+get(key)+1'
        };
        var syntax = new Syntax(grammar, 1);
        var obj = {
            'id': 12,
            'key': 5
        };
        message('Evaluate on ' + JSON.stringify(obj));
        for (var r in tests) {
            var expr = syntax.parse(tests[r]);
            var result = expr.resolve().evaluate(obj);
            test(`Should evaluate -> '${tests[r]}' to ${r}`, context => context.assert(r, '=', result));
        }

        return results;
    }

    function message_errors(errors) {
        for (var i=0; i<errors.length; i++) {
            message(errors[i].toString());
        }
    }

    function test_schema() {
        header('Test schema');
        var schema = new Schema();

        schema.buildType({ name:'String10', type:Schema.Types.STRING, length:10 });
        test('Should have a String10 type', ctx => {
            var type = schema.types.String10;
            ctx.assert(type, '!null');
            ctx.assert(type.name, '=', 'String10');
            ctx.assert(type.baseType.name, '=', Schema.Types.STRING);
            ctx.assert(type.length, '=', 10);
            ctx.assert(type.elemType, 'null');
            var cst = type.constraints;
            ctx.assert(cst.length, '=', 2);
            ctx.assert(cst[0], '=', Schema.checkType);
            ctx.assert(cst[1], '=', Schema.checkLength);
        });
        var text = "0123456789";
        test(`Should accept "${text}"`, ctx => {
            var type = schema.types.String10;
            ctx.assert(type, '!null');
            var errors = type.validate(text);
            message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });
        text = "0123456789A";
        test(`Should reject "${text}"`, ctx => {
            var type = schema.types.String10;
            ctx.assert(type, '!null');
            var errors = type.validate(text);
            message_errors(errors);
            ctx.assert(errors.length, '=', 1);
        });
        text = 12;
        test(`Should reject ${text}`, ctx => {
            var type = schema.types.String10;
            ctx.assert(type, '!null');
            var errors = type.validate(text);
            message_errors(errors);
            ctx.assert(errors.length, '=', 1);
        });

        schema.buildType({ name:'Int100', type:Schema.Types.INT, min:0, max:100 });
        test('Should have a Int100 type', ctx => {
            var type = schema.types.Int100;
            ctx.assert(type, '!null');
            ctx.assert(type.name, '=', 'Int100');
            ctx.assert(type.baseType.name, '=', Schema.Types.INT);
            ctx.assert(type.min, '=', 0);
            ctx.assert(type.max, '=', 100);
            ctx.assert(type.elemType, 'null');
            var cst = type.constraints;
            ctx.assert(cst.length, '=', 2);
            ctx.assert(cst[0], '=', Schema.checkType);
            ctx.assert(cst[1], '=', Schema.checkRange);
        });
        var num = 12;
        test(`Should accept ${num}`, ctx => {
            var type = schema.types.Int100;
            var errors = type.validate(num);
            message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });
        num = -12;
        test(`Should reject ${num} (min)`, ctx => {
            var type = schema.types.Int100;
            var errors = type.validate(num);
            message_errors(errors);
            ctx.assert(errors.length, '=', 1);
        });
        num = 101;
        test(`Should reject ${num} (max)`, ctx => {
            var type = schema.types.Int100;
            var errors = type.validate(num);
            message_errors(errors);
            ctx.assert(errors.length, '=', 1);
        });

        schema.buildType({ name:'Int100Arr5', type:Schema.Types.LIST, length:5, elemType:'Int100' });
        test('Should have a Int100Arr5 type', ctx => {
            var type = schema.types.Int100Arr5;
            ctx.assert(type, '!null');
            ctx.assert(type.name, '=', 'Int100Arr5');
            ctx.assert(type.baseType.name, '=', Schema.Types.LIST);
            ctx.assert(type.elemType, '=', schema.types.Int100);
            var cst = type.constraints;
            ctx.assert(cst.length, '=', 3);
            ctx.assert(cst[0], '=', Schema.checkType);
            ctx.assert(cst[1], '=', Schema.checkLength);
            ctx.assert(cst[2], '=', Schema.checkElemType);
        });
        var arr = [1,2,3,4,5];
        test(`Should accept ${arr}`, ctx => {
            var type = schema.types.Int100Arr5;
            var errors = type.validate(arr);
            message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });
        arr = [1,2,3,4,5,6];
        test(`Should reject ${arr} (length)`, ctx => {
            var type = schema.types.Int100Arr5;
            var errors = type.validate(arr);
            message_errors(errors);
            ctx.assert(errors.length, '=', 1);
        });
        arr = [1,2,3,4,500];
        test(`Should reject ${arr} (max)`, ctx => {
            var type = schema.types.Int100Arr5;
            var errors = type.validate(arr);
            message_errors(errors);
            ctx.assert(errors.length, '=', 1);
        });
        arr = [1,2,3,4,'a5'];
        test(`Should reject ${arr} (type)`, ctx => {
            var type = schema.types.Int100Arr5;
            var errors = type.validate(arr);
            message_errors(errors);
            ctx.assert(errors.length, '=', 1);
        });

        schema.buildType({ name:'EnumColors', type:Schema.Types.ENUM, values:['blue', 'red', 'green'] });
        var color = 'blue';
        test(`Should accept '${color}'`, ctx => {
            var type = schema.types.EnumColors;
            var errors = type.validate(color);
            message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });
        color = 'blu';
        test(`Should reject '${color}'`, ctx => {
            var type = schema.types.EnumColors;
            var errors = type.validate(color);
            message_errors(errors);
            ctx.assert(errors.length, '=', 1);
        });
        schema.buildType({ name:'Person', attributes: [
            { "name":"id", type:{ name:'Int1000', type:Schema.Types.INT, min:1, max:1000 }, required:true },
            { "name":"name", type:'string' },
            { "name":"parent", type:'Person' },
            { "name":"color", type: 'EnumColors' }
        ]});
        var grandpa = { id:3, name:'Grandpa', color:'green'};
        var parent = { id:1, name:'Dad', parent:grandpa };
        var child = { id:2, name:'Child', parent:parent, color:'red' };
        test(`Should accept ${JSON.stringify(child)}`, ctx => {
            var type = schema.types.Person;
            var errors = type.validate(child);
            message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });
        child.id = 'id';
        parent.name = 12;
        parent.color = 'black';
        delete grandpa.id;
        test(`Should reject ${JSON.stringify(child)}`, ctx => {
            var type = schema.types.Person;
            var errors = type.validate(child);
            message_errors(errors);
            ctx.assert(errors.length, '=', 4);
        });

        schema.buildType({ name:'IntToString', type:Schema.Types.MAP, key:'int', value:'string' });
        var map = { 1:'1', 2:'2', 3:'3' };
        test(`Should accept object:${JSON.stringify(map)}`, ctx => {
            var type = schema.types.IntToString;
            var errors = type.validate(map);
            message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });
        map = { a:'1', 2:2, 3:'3' };
        test(`Should reject object:${JSON.stringify(map)}`, ctx => {
            var type = schema.types.IntToString;
            var errors = type.validate(map);
            message_errors(errors);
            ctx.assert(errors.length, '=', 2);
        });
        schema.buildType({ name:'MyObject', type:Schema.Types.OBJECT, sealed:true, attributes: [
            { name:"id", type:"int" },
            { name:"text", type:"string" },
            { name:"map", type:"IntToString" }
        ]});
        var obj1 = { 'id': 12, 'text': 'Hello World!', map: {1:'one', 2:'two', 3:'three'} };
        test(`Should accept object:${JSON.stringify(obj1)}`, ctx => {
            var type = schema.types.MyObject;
            var errors = type.validate(obj1);
            message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });
        var obj2 = { 'id': 12, 'text': 'Hello World!', map: {1:'one', '2a':'two', 3:'three'}, 'isValid':false };
        test(`Should reject object:${JSON.stringify(obj2)}`, ctx => {
            var type = schema.types.MyObject;
            var errors = type.validate(obj2);
            message_errors(errors);
            ctx.assert(errors.length, '=', 2);
        });

        schema.buildType({ name:'MyObjectList', type:Schema.Types.LIST, elemType:'MyObject'});
        var objList = [
            { 'id': 1, 'text': 'Hello #1!', map: {1:'one', 2:'two', 3:'three'} },
            { 'id': 2, 'text': 'Hello #2!', map: {1:'one', 2:'two', 3:'three'} }
        ];
        test('Should accept object list', ctx => {
            var type = schema.types.MyObjectList;
            var errors = type.validate(objList);
            if (errors.length > 0) message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });

        schema.buildType({ name:'MySuperObject',
            type:"MyObject",
            attributes: [
                { name:"sid", type:"int" },
                { name:"guid", type:"string" },
                { name:"parent", type:"MySuperObject" },
                { name:"children", type:"MyObjectList"}
        ]});
        var superObject = {
            id: 1,
            text: "Hello",
            map: {1:'one', 2:'two', 3:'three'},
            sid: 12,
            guid: "a213-124f",
            parent: null,
            children: objList
        }
        test('Should accept super object', ctx => {
            var type = schema.types.MySuperObject;
            var errors = type.validate(superObject);
            if (errors.length > 0) message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });

        test('Should create reference types', ctx => {
            schema.buildType({ type:'ref     MyObject' });
            schema.buildType({ name:'MyRefList', type:'list', elemType:'ref \n  MyObject' });
            schema.buildType({ name:'MyIndex', attributes: [{ name:'persons', type:{ type:'list', elemType:'ref Person' }}] });
            ctx.assert(schema.types['*MyObject'], '!null');
            ctx.assert(schema.types['*Person'], '!null');
            ctx.assert(schema.types['MyIndex'].attributes.persons.type.baseType, '=', schema.types.list);
            ctx.assert(schema.types['MyIndex'].attributes.persons.type.elemType, '=', schema.types['*Person']);
        });

        schema.buildType({ name:'MyDataTypes', type:Schema.Types.LIST, elemType:'type'});
        test('Should accept run-time types', ctx => {
            var rtTypes = [
                { "name":"String256", "type":"string", "length":256 },
                { "name":"Byte", "type":"int", "min":0,"max":255 },
                { "name":"Method", "attributes": [
                        { "name":"name", "type":"String256" },
                        { "name":"arguments", "type":"AttributeList" },
                        { "name":"return", "type":"type" }
                    ]
                },
                { "name":"Class",
                    "attributes": [
                        { "name":"name", "type":"String256" },
                        { "name":"extends", "type":"String256" },
                        { "name":"properties", "type":"AttributeList" },
                        { "name":"methods", "type":{ "type":"list", "elemType":"Method" } }
                    ]
                }
            ];
            var type = schema.types.MyDataTypes;
            var errors = type.validate(rtTypes);
            if (!schema.types.String256 || schema.types.String256.basicType != schema.types.string) errors.push(new Error('String256 is not defined!'));
            if (!schema.types.Byte || schema.types.Byte.basicType != schema.types.int) errors.push(new Error('Byte is not defined!'));
            if (!schema.types.Class || schema.types.Class.basicType != schema.types.object) errors.push(new Error('Class is not defined!'));
            if (errors.length > 0) message_errors(errors);
            ctx.assert(errors.length, '=', 0);

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
            type = schema.types.Class;
            errors = type.validate(myClass);
            if (errors.length > 0) message_errors(errors);
            ctx.assert(errors.length, '=', 0);
        });
        test('Should handle late type definitions', ctx => {
            var mySchema = new Schema([
                {
                    "name":"Code",
                    "attributes": [
                        { "name":"types", "type":"TypeList" },
                        { "name":"methods", "type":{ "type":"list", "elemType":"Method" } },
                        { "name":"master", "type":"type" }
                    ]
                },
                {
                    "name": "Method",
                    "attributes": [
                        { "name":"name", "type":"string100" },
                        { "name":"id", "type":"int100" },
                        { "name":"arguments", "type":"AttributeList" },
                        { "name":"returns", "type":"Types" }
                    ]
                },
                { "name":"string100", "type":"string", "length":100 },
                { "name":"int100", "type":"int", "min":0, "max":100 }
            ]);
            ctx.assert(mySchema.types.Code, '!null');
            ctx.assert(mySchema.types.Code.attributes.methods.type.elemType, '=', mySchema.types.Method);
            var code = {
                "master":{ "name":"Master", "type":"i100" },
                "methods": [
                    {   "name":"read", "id":1,
                        "arguments": [
                            { "name":"deviceId", "type":"DeviceId", "required":true },
                            { "name":"length", "type":"DWORD", "required":true },
                            { "name":"offset", "type":"DWORD", "required":false }
                        ],
                        "returns":"Buffer"
                    },
                    { "name":"write", "id":2, "arguments": [
                        { "name":"deviceId", "type":"DeviceId", "required":true },
                        { "name":"buffer", "type":"Buffer", "required":true },
                        { "name":"length", "type":"DWORD", "required":false },
                        { "name":"offset", "type":"DWORD", "required":false }
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
            mySchema.validate(mySchema.types.Code, code, errors);
            if (errors.length > 0) message_errors(errors);
            ctx.assert(errors, 'empty');
        });
    }

    async function test_load_schema() {
        header('Test load schema and definition');
        var schemaInfo = {
            schema: null,
            schemaDefinition: './test/test-schema.json',
            validate: 'Design'
        };
        var definition = './test/test-definition.json';
        var errors = [];
        schema = await Schema.load(schemaInfo, definition, errors);
        test('Should load schema and definition', ctx => {
            ctx.assert(schemaInfo.schema, '!null');
            if (errors.length > 0) message_errors(errors);
            ctx.assert(errors, 'empty');
        });
    }

    var tests = () => [
        // test_syntax,
        // test_types,
        test_schema,
        // test_load_schema
    ];

    publish(tests, 'Util tests');
})();
