include('./syntax.js');
include('../type/schema.js');

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
            test(`Should evaluate -> '${tests[r]}' to ${r}`, context => context.assert(r, '=', result.value));
        }

        return results;
    }

    var tests = () => [
        test_syntax
    ];

    publish(tests, 'Util tests');
})();
