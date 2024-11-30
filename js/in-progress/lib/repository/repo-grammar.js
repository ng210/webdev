// Phase1:
//  expression: SELECT Item WHERE id=$id => SLLWLDLERL
// SELECT(User, EQUAL(id, $id))
//  terms:
//  - SELECT <entity> => SL => S1
//  - WHERE <field>=<value> => WLOL => WT0 => W1
//  - WHERE <field>=$<param> => WLEIL => WLOV => WT1 => W1
//  functions:
//  - S: select(entity)
//  - W: filter(field, value)


Repository.grammar = {
    'prototypes': {
        // separator
        ' ':        { 'symbol': '' },
        // operator

        '>=':       { 'symbol': 'O1', 'action': Repository.operator, 'operator': (x, y) => x >= y },
        '<=':       { 'symbol': 'O1', 'action': Repository.operator, 'operator': (x, y) => x >= y },
        '=':        { 'symbol': 'O1', 'action': Repository.operator, 'operator': (x, y) => x == y },
        '<':        { 'symbol': 'O1', 'action': Repository.operator, 'operator': (x, y) => x < y },
        '>':        { 'symbol': 'O1', 'action': Repository.operator, 'operator': (x, y) => x > y },
        'and':      { 'symbol': 'O2', 'action': Repository.operator, 'operator': (x, y) => x && y },
        'or':       { 'symbol': 'O3', 'action': Repository.operator, 'operator': (x, y) => x || y },
        
        'select':   { 'symbol':  'S' },
        'where':    { 'symbol':  'W' },

        // syntax elements
        //  '(':    { 'symbol': 'B1' },
        //  ')':    { 'symbol': 'B2' },
        //  ',':    { 'symbol':  'C' },
        '$':        { 'symbol':  'I' },
        // '.':        { 'symbol':  'D' },

        //states
        '_V':     { 'symbol': 'V' },

        '_O11':    { 'symbol': 'O11' },
        '_O21':    { 'symbol': 'O21' },
        '_O31':    { 'symbol': 'O31' },

        '_S1':     { 'symbol': 'S1' },
        '_SF':     { 'symbol': 'SF' },

        '_W1':     { 'symbol': 'W1' },

        '_T0':     { 'symbol': 'T0' }
    },
    'rules': [
        { input:'IL',   output:  'V', priority: 90,  action: (i, l) => { i.data.value = l.data.value; return i; } },
        { input:'O11L', output: 'T0', priority: 68,  action: null },
        { input:'O11V', output: 'T0', priority: 66,  action: null },
        { input:'LO1',  output:'O11', priority: 64,  action: null },
        { input:'T0O1', output:'O11', priority: 62,  action: null },
        { input:'O11T0',output: 'T0', priority: 60,  action: null },

        { input:'O21L', output: 'T0', priority: 58,  action: null },
        { input:'O21V', output: 'T0', priority: 56,  action: null },
        { input:'LO2',  output:'O21', priority: 54,  action: null },
        { input:'T0O2', output:'O21', priority: 52,  action: null },
        { input:'O21T0',output: 'T0', priority: 50,  action: null },

        { input:'O31L', output: 'T0', priority: 48,  action: null },
        { input:'O31V', output: 'T0', priority: 46,  action: null },
        { input:'LO3',  output:'O31', priority: 44,  action: null },
        { input:'T0O3', output:'O31', priority: 42,  action: null },
        { input:'O31T0',output: 'T0', priority: 40,  action: null },

        { input:'SL',   output:'S1', priority:  30,  action: null },

        { input:'WT0',  output:'W1', priority:  20,  action: null },

        { input:'S1W1', output:'SF', priority:  10,  action: null }
    ]
};

Repository.grammar.term = Repository.grammar.prototypes._T0;
Repository.grammar.parameter = Repository.grammar.prototypes._V;
