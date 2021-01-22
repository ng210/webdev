include('syntax.js');
include('schema.js');

(function(){

    var grammar = {
        'prototypes': {
            // separator
            ' ': { 'symbol': '' },
            // operator
            '+':    { 'symbol': 'A', 'action': function(x, y) { return x.data.value + y.data.value; } },
            '*':    { 'symbol': 'M', 'action': (x, y) => x.data.value * y.data.value },
            'pow':  { 'symbol': 'F', 'action': (a, p) => Math.pow(a.data.value, p.data.value) },
            'sqrt': { 'symbol': 'F', 'action': (x) => Math.sqrt(x.data.value) },
            'get':  { 'symbol': 'F', 'action': function(name) { return this[name.data.value]; } },
            // syntax elements
            '(':    { 'symbol': 'B1' },
            ')':    { 'symbol': 'B2' },
            ',':    { 'symbol': 'C' },
            //states
            '__A1': { 'symbol': 'A1' },
            '__A2': { 'symbol': 'A2' },
            '__M1': { 'symbol': 'M1' },
            '__M2': { 'symbol': 'M2' },
            '__F1': { 'symbol': 'F1' },
            '__F2': { 'symbol': 'F2' }
        },
        'rules': [
            { input:'FB1',  output:'F1', priority: 100,  action: null },
            { input:'B1LB2',output:'L',  priority:  90,  action: (b1,l,b2) => l },
            { input:'M1L',  output:'L',  priority:  80,  action: null },
            { input:'LM',   output:'M1', priority:  70,  action: null },
            { input:'A1L',  output:'L',  priority:  60,  action: null },
            { input:'LA',   output:'A1', priority:  50,  action: null },
            { input:'F1L',  output:'F2', priority:  46,  action: null },
            { input:'F2C',  output:'F1', priority:  30,  action: null },
            { input:'F2B2', output:'L',  priority:  20,  action: null },
            { input:'L',    output:null, priority:  10,   action: null }
        ],
    };

    function test_syntax() {
        message('Test syntax', 1);
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
        var syntax = new Syntax(grammar, true);
        var obj = {
            'id': 12,
            'key': 5
        };
        message('Evaluate on ' + JSON.stringify(obj));
        for (var r in tests) {
            var expr = syntax.parse(tests[r]);
            var result = expr.resolve().evaluate(obj);
            test(`Should evaluate '${tests[r]}' to ${r}`, context => context.assert(r, '=', result));
        }

        return results;
    }

    function message_errors(errors) {
        for (var i=0; i<errors.length; i++) {
            message(errors[i].toString());
        }
    }

    function test_schema() {
        message('Test schema', 1);
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
            ctx.assert(cst[0].obj, '=', type);
            ctx.assert(cst[0].fn, '=', Schema.checkType);
            ctx.assert(cst[1].obj, '=', type);
            ctx.assert(cst[1].fn, '=', Schema.checkLength);
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
            ctx.assert(cst[0].obj, '=', type);
            ctx.assert(cst[0].fn, '=', Schema.checkType);
            ctx.assert(cst[1].obj, '=', type);
            ctx.assert(cst[1].fn, '=', Schema.checkRange);
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
            ctx.assert(cst[0].obj, '=', type);
            ctx.assert(cst[0].fn, '=', Schema.checkType);
            ctx.assert(cst[1].obj, '=', type);
            ctx.assert(cst[1].fn, '=', Schema.checkLength);
            ctx.assert(cst[2].obj, '=', type);
            ctx.assert(cst[2].fn, '=', Schema.checkElemType);
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
        var parent = { id:1, name:'Parent', parent:grandpa };
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
    }

    var tests = () => [
        // test_syntax,
        test_schema
    ];

    publish(tests, 'Util tests');
})();