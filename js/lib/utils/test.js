include('./syntax.js');
include('../type/schema.js');

(function(){
    self.grammar = null;
    async function test_syntax() {
        header('Test syntax');
        if (!self.grammar) {
            await load('./test/grammar.js');
        }

        header('Test syntax');
        var results = [];
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
           '16': 'pow(2,4)',
           '20': 'pow(2,4)+sqrt((4+4)*2)',
           '60': '2*pow(4,2)+sqrt(pow(5,4))+3',
           '30': '2*get(id)+get(key)+1'
        };
        var syntax = new Syntax(grammar, 3);
        var obj = {
            'id': 12,
            'key': 5
        };
        message('Evaluate on ' + JSON.stringify(obj));
        for (var r in tests) {
            var expr = syntax.parse(tests[r]);
            var resolution = expr.resolve();
            var result = resolution.evaluate(obj);
            test(`Should evaluate -> '${tests[r]}' to ${r}`, context => context.assert(r, '=', result.value));
        }

        return results;
    }

    function test_ruleMapping() {
        message('Test in-out rule map');
        var syntax = new Syntax();
        var rules = [
            { input:['a'],              output:['a1'],          map:{},             missing:[0] },
            { input:['a', 'b'],         output:['a'],           map:{ 0:0 },        missing:[1] },
            { input:['a', 'b'],         output:['c', 'd'],      map:{ },            missing:[0, 1] },
            { input:['b', 'b'],         output:['b1'],          map:{},             missing:[0, 1] },
            { input:['a', 'b1'],        output:['b2'],          map:{},             missing:[0, 1] },
            { input:['S', 'a', 'b'],    output:['S', 'a'],      map:{ 0:0, 1:1 },   missing:[2] },
            { input:['S', 'a', 'b1'],   output:['S', 'b3'],     map:{ 0:0 },        missing:[1, 2] },
            { input:['S', 'a', 'b2'],   output:['S', 'b4'],     map:{ 0:0 },        missing:[1, 2] },
            { input:['S', 'a'],         output:['S'],           map:{ 0:0 },        missing:[1] },
            { input:['S', 'b3'],        output:['S', 'b4'],     map:{ 0:0 },        missing:[1] },
            { input:['S', 'b4'],        output:['S'],           map:{ 0:0 },        missing:[1] },
        ];
        var expr = syntax.createExpression();
        test('Should map rule-in and rule-out', ctx => {
            for (var i=0; i<rules.length; i++) {
                var ruleIn = rules[i].input;
                var ruleOut = rules[i].output;
                var missing = [];
                var inOutMap = expr.createInOutMap(ruleIn, ruleOut, missing);
                ctx.assert(rules[i].map, ':=', inOutMap._map);
                ctx.assert(rules[i].missing, ':=', missing);
            }
        });
    }

    function test_mergeNodes() {
        message('Test merge nodes');
        var grammar = {
            'prototypes': {
                ' ': { 'symbol': '' },
                'a': { 'symbol': 'a', 'action': function(a) { return true; } },
                'b': { 'symbol': 'b', 'ignore':false },
                'c': { 'symbol': 'c' },
                's': { 'symbol': 'S', 'start': true },
            },
            'rules': []
        };
        var tests = [
            { 'input':  'aa', 'edges': [],      'rulein':['a','a'],         'ruleout':['a'],            'expected': ['aa'] },
            { 'input':  'aa', 'edges': [0],     'rulein':['a','a'],         'ruleout':['a'],            'expected': ['aLa'] },
            { 'input':  'aa', 'edges': [1],     'rulein':['a','a'],         'ruleout':['a'],            'expected': ['aaL'] },

            { 'input':  'ab', 'edges': [],      'rulein':['a','b'],         'ruleout':['a'],            'expected': ['ab'] },
            { 'input':  'ab', 'edges': [0],     'rulein':['a','b'],         'ruleout':['a'],            'expected': ['aLb'] },
            { 'input':  'ab', 'edges': [1],     'rulein':['a','b'],         'ruleout':['a'],            'expected': ['abL'] },

            { 'input':  'ab', 'edges': [],      'rulein':['a','b'],         'ruleout':['b'],            'expected': ['ba'] },
            { 'input':  'ab', 'edges': [0],     'rulein':['a','b'],         'ruleout':['b'],            'expected': ['baL'] },
            { 'input':  'ab', 'edges': [1],     'rulein':['a','b'],         'ruleout':['b'],            'expected': ['bLa'] },

            { 'input':  'ba', 'edges': [],      'rulein':['b','a'],         'ruleout':['b'],            'expected': ['ba'] },
            { 'input':  'ba', 'edges': [0],     'rulein':['b','a'],         'ruleout':['b'],            'expected': ['bLa'] },
            { 'input':  'ba', 'edges': [1],     'rulein':['b','a'],         'ruleout':['b'],            'expected': ['baL'] },

            { 'input':  'ab', 'edges': [],      'rulein':['a','b'],         'ruleout':['c'],            'expected': ['ab'] },
            { 'input':  'ab', 'edges': [0],     'rulein':['a','b'],         'ruleout':['c'],            'expected': ['aLb'] },
            { 'input':  'ab', 'edges': [1],     'rulein':['a','b'],         'ruleout':['c'],            'expected': ['abL'] },

            { 'input':  'ba', 'edges': [],      'rulein':['b','a'],         'ruleout':['c'],            'expected': ['ab'] },
            { 'input':  'ba', 'edges': [0],     'rulein':['b','a'],         'ruleout':['c'],            'expected': ['bLa'] },
            { 'input':  'ba', 'edges': [1],     'rulein':['b','a'],         'ruleout':['c'],            'expected': ['aLb'] },

            { 'input':  'ac', 'edges': [],      'rulein':['a','c'],         'ruleout':['a'],            'expected': ['ac'] },
            { 'input':  'ac', 'edges': [0],     'rulein':['a','c'],         'ruleout':['a'],            'expected': ['aLc'] },
            { 'input':  'ac', 'edges': [1],     'rulein':['a','c'],         'ruleout':['a'],            'expected': ['acL'] },

            { 'input':  'ca', 'edges': [],      'rulein':['c','a'],         'ruleout':['c'],            'expected': ['ca'] },
            { 'input':  'ca', 'edges': [0],     'rulein':['c','a'],         'ruleout':['c'],            'expected': ['cLa'] },
            { 'input':  'ca', 'edges': [1],     'rulein':['c','a'],         'ruleout':['c'],            'expected': ['caL'] },

            { 'input':  'ac', 'edges': [],      'rulein':['a','c'],         'ruleout':['d'],            'expected': ['ac'] },
            { 'input':  'ac', 'edges': [0],     'rulein':['a','c'],         'ruleout':['d'],            'expected': ['aLc'] },
            { 'input':  'ac', 'edges': [1],     'rulein':['a','c'],         'ruleout':['d'],            'expected': ['acL'] },

            { 'input':  'ca', 'edges': [],      'rulein':['c','a'],         'ruleout':['d'],            'expected': ['ac'] },
            { 'input':  'ca', 'edges': [0],     'rulein':['c','a'],         'ruleout':['d'],            'expected': ['cLa'] },
            { 'input':  'ca', 'edges': [1],     'rulein':['c','a'],         'ruleout':['d'],            'expected': ['aLc'] }
        ];
        var syntax = new Syntax(grammar, 0);
        var errors = 0;
        for (var i=0; i<tests.length; i++) {
            var expr = syntax.createExpression();
            for (var j=0; j<tests[i].input.length; j++) {
                var key = tests[i].input.charAt(j);
                var code = syntax.symbols.indexOf(key);
                expr.createNode(code, key, key);
            }
            var nodes = Array.from(expr.tree.vertices);
            for (var j=0; j<tests[i].edges.length; j++) {
                var ec = tests[i].edges[j];
                expr.tree.addEdge(nodes[ec], expr.createNode(0, syntax.literal, '?'));
            }
            var missing = [];
            var inOutMap = expr.createInOutMap(tests[i].rulein, tests[i].ruleout, missing);
            nodes = expr.mergeNodes(nodes, inOutMap);
            var code = [];
            for (var j=0; j<nodes.length; j++) {
                expr.tree.DFS(nodes[j], n => { code.push(n.data.type.symbol); return false; });
            }

            if (code.join('') != tests[i].expected) errors++;
        }
        test('Should merge nodes correctly', ctx => ctx.assert(errors, '=', 0));
    }

    function test_shuffleNodes() {
        message('Test shuffle nodes');
        var grammar = {
            'prototypes': {
                ' ': { 'symbol': '' },
                'a': { 'symbol': 'a' },
                'b': { 'symbol': 'b', 'ignore':true },
                'c': { 'symbol': 'c' },
                's': { 'symbol': 'S', 'start': true },
            },
            'rules': [
                { input:'a b',      output:'b a',   priority: 100,  action: null },
                { input:'a b c',    output:'c b a', priority:  90,  action: null },
                { input:'a a c',    output:'a c',   priority:  80,  action: null },
                { input:'b a c',    output:'c a',   priority:  80,  action: null }
            ]
        };
        var tests = [
            // { 'input': 'ab',    'ruleIn': ['a', 'b'],       'ruleOut':['b', 'a'],       'expected': 'ba' },
            // { 'input': 'abc',   'ruleIn': ['a', 'b', 'c'],  'ruleOut':['c', 'b', 'a'],  'expected': 'cba' },
            { 'input': 'aac',   'ruleIn': ['a', 'a', 'c'],  'ruleOut':['c', 'a', 'a'],  'expected': 'caa' }
        ];

        var syntax = new Syntax(grammar);
        var errors = 0;
        var missing = [];
        for (var i=0; i<tests.length; i++) {
            var expr = syntax.parse(tests[i].input);
            var nodes = expr.tree.vertices;
            // remove <start> node
            nodes.splice(0, 1);
            var inOutMap = expr.createInOutMap(tests[i].ruleIn, tests[i].ruleOut, missing);
            var outNodes = expr.shuffleNodes(nodes, inOutMap);
            if (outNodes.map(x => x.data.type.symbol).join('') != tests[i].expected) errors++;
        }
        test('Should shuffle nodes correctly', ctx => ctx.assert(errors, '=', 0));
    }

    function test_applyRules() {
        message('Test apply rules');
        var grammar = {
            'prototypes': {
                ' ': { 'symbol': '' },
                'a': { 'symbol': 'a', 'action': function(a) { return true; } },
                'b': { 'symbol': 'b', 'ignore':false },
                'c': { 'symbol': 'c', 'ignore':true },
                'd': { 'symbol': 'd' },
                's': { 'symbol': 'S', 'start': true },
            },
            'rules': []
        };
        var tests = [
            { input:'aa',   'rule': { 'in':[1, 1],  'out':[1] },        'expected':'Sa-a' },
            { input:'ab',   'rule': { 'in':[1, 2],  'out':[1] },        'expected':'Sa-b' },
            { input:'ab',   'rule': { 'in':[1, 2],  'out':[2] },        'expected':'Sb-a' },
            { input:'ab',   'rule': { 'in':[1, 2],  'out':[2,1] },      'expected':'Sba' },
            { input:'a',    'rule': { 'in':[1],     'out':[2] },        'expected':'Sb' },
            { input:'ab',   'rule': { 'in':[1, 2],  'out':[3, 4] },     'expected':'Scd' }
        ];
        var syntax = new Syntax(grammar);

        var errors = 0;
        for (var i=0; i<tests.length; i++) {
            var expr = syntax.parse(tests[i].input);
            var nodes = expr.tree.vertices;
            expr.applyRule(tests[i].rule, nodes, 1);
            var code = [];
            for (var j=0; j<nodes.length; j++) {
                expr.tree.DFS(nodes[j], n => { code.push(syntax.symbols.getAt(n.data.code).symbol); return false; }, null, n => { code.push('-'); return false; } );
            }
            if (code.join('') != tests[i].expected) errors++;
        }
        test('Should apply rules successfully', ctx => ctx.assert(errors, '=', 0));
    }

    var tests = () => [
        test_ruleMapping,
        test_mergeNodes,
        test_shuffleNodes,
        test_applyRules,
        test_syntax
    ];

    publish(tests, 'Util tests');
})();
