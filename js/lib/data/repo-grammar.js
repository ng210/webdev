// Phase1:
//  expression: SELECT Item WHERE id=$id => SLLWLDLERL
// SELECT(User, EQUAL(id, $id))
//  terms:
//  - SELECT <entity> => SL => S1
//  - WHERE <field>=<value> => WLOL => WT0 => W1
//  - WHERE <field>=$<param> => WLEIL => WLOI1 => WT1 => W1
//  functions:
//  - S: select(entity)
//  - W: filter(field, value)


Repository.grammar = {
    'prototypes': {
        // separator
        ' ':        { 'symbol': '' },
        // operator
        //  'and':  { 'symbol':  'A', 'action': function(x, y) { return x.data.value && y.data.value; } },
        //  'or':   { 'symbol':  'O', 'action': (x, y) => x.data.value || y.data.value },
        '=':        { 'symbol':  'O', 'action': Repository.operator },
        
        'select':   { 'symbol':  'S', action: Repository.select },
        'where':    { 'symbol':  'W' },
        // syntax elements
        //  '(':    { 'symbol': 'B1' },
        //  ')':    { 'symbol': 'B2' },
        //  ',':    { 'symbol':  'C' },
        
        '$':        { 'symbol':  'I' },
        // '.':        { 'symbol':  'D' },
        //states
        '_S1':     { 'symbol': 'S1' },
        '_SF':     { 'symbol': 'SF' },
        '_W1':     { 'symbol': 'W1' },
        '_I1':     { 'symbol': 'I1' },
        '_O1':     { 'symbol': 'O1' },
        '_T0':     { 'symbol': 'T0' },
        '_T1':     { 'symbol': 'T1' }
    },
    'rules': [
        { input:'IL',   output:'I1', priority:  80,  action: null },

        { input:'LO',   output:'O1', priority:  70,  action: null },
        { input:'O1L',  output:'T0', priority:  50,  action: null },
        { input:'O1I1', output:'T1', priority:  60,  action: null },
        
        { input:'SL',   output:'S1', priority:  40,  action: null },

        { input:'WT0',  output:'W1', priority:  30,  action: null },
        { input:'WT1',  output:'W1', priority:  20,  action: null },

        { input:'S1W1', output:'SF', priority:  10,  action: null }
    ]
};
