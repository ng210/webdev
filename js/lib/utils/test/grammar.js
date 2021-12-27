var grammar = {
    'prototypes': {
        // separator
        ' ': { 'symbol': '' },
        // operator
        '+':    { 'symbol': 'A', 'action': function(o, x, y) { return x.data.value + y.data.value; } },
        '*':    { 'symbol': 'M', 'action': (o, x, y) => x.data.value * y.data.value },
        'pow':  { 'symbol': 'F', 'action': (o, a, p) => Math.pow(a.data.value, p.data.value) },
        'sqrt': { 'symbol': 'F', 'action': (o, x) => Math.sqrt(x.data.value) },
        'get':  { 'symbol': 'F', 'action': function(f, name) { return this[name.data.value]; } },
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
        { input:'FB1',  output:'F1', priority: 100,  action: f => f },
        { input:'B1LB2',output:'L',  priority:  90,  action: (b1,l,b2) => l },
        { input:'M1L',  output:'L',  priority:  80,  action: null },
        { input:'LM',   output:'M1', priority:  70,  action: null },
        { input:'A1L',  output:'L',  priority:  60,  action: null },
        { input:'LA',   output:'A1', priority:  50,  action: null },
        { input:'F1L',  output:'F2', priority:  46,  action: null },
        { input:'F2C',  output:'F1', priority:  30,  action: f2 => f2 },
        { input:'F2B2', output:'L',  priority:  20,  action: f2 => f2 },
        { input:'L',    output:null, priority:  10,   action: null }
    ],
};