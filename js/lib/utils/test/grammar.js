var grammar = {
    'prototypes': {
        // separator
        ' ': { 'symbol': '' },
        // operator
        '+':    { 'symbol': 'A', 'action': function(o, x, y) { return x.data.value + y.data.value; } },
        '*':    { 'symbol': 'M', 'action': (o, x, y) => x.data.value * y.data.value },
        'pow':  { 'symbol': 'F', 'action': (f, a, p) => Math.pow(a.data.value, p.data.value) },
        'sqrt': { 'symbol': 'F', 'action': (f, x) => Math.sqrt(x.data.value) },
        'get':  { 'symbol': 'F', 'action': function(f, name) { return this[name.data.value]; } },
        // syntax elements
        '(':    { 'symbol': 'B1', 'ignore':true },
        ')':    { 'symbol': 'B2', 'ignore':true },
        ',':    { 'symbol': 'C',  'ignore':true },
        //states
    },
    'rules': [
        { input:'F B1',     output:'F1', priority: 100,  action: null },
        { input:'B1 L B2',  output:'L',  priority:  90,  action: null },
        { input:'M1 L',     output:'L',  priority:  80,  action: null },
        { input:'L M',      output:'M1', priority:  70,  action: null },
        { input:'A1 L',     output:'L',  priority:  60,  action: null },
        { input:'L A',      output:'A1', priority:  50,  action: null },
        { input:'F1 L',     output:'F2', priority:  46,  action: null },
        { input:'F2 C',     output:'F1', priority:  30,  action: null },
        { input:'F2 B2',    output:'L',  priority:  20,  action: null },
        { input:'L',        output:null, priority:  10,  action: null }
    ],
};