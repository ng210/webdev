(function() {
    var grammar = {
        'prototypes': {
            // separator
            ' ': { 'symbol': '' },
            // operator
            '+': { 'symbol': 'A', 'action': (x, y) => x + y },
            '*': { 'symbol': 'M', 'action': (x, y) => x * y },
            '^': { 'symbol': 'P', 'action': (x, y) => Math.pow(x, y) },
            // functions
            'sin': { 'symbol': 'F', 'action': x => Math.sin(x) },
            'cos': { 'symbol': 'F', 'action': x => Math.cos(x) },
            // misc.
            '(': { 'symbol': 'B1' },
            ')': { 'symbol': 'B2' },
            ',': { 'symbol': 'C' },
            //states
            '__A1': { 'symbol': 'A1' },
            '__A2': { 'symbol': 'A2' },
            '__M1': { 'symbol': 'M1' },
            '__M2': { 'symbol': 'M2' }
        },
        'rules': [
            { input:'LM',   output:'M1',  priority: 50,  action: null },
            { input:'M1L',  output:'L',  priority: 40,  action: null },
            { input:'LA',   output:'A1',  priority: 25,  action: null },
            { input:'A1L',  output:'L',  priority: 30,  action: null },
            { input:'L',    output:null,  priority: 1,   action: null }
        ],
    };
    module.exports = grammar;
})();