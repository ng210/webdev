/******************************************************************************
 * Adapter-Sequence-User data block SCRIPT LANGUAGE
 * 
 * 1. Syntax
 *   Internal types used in this description
 *   - constants are defined by the set keyword
 *   - REF: reference of a value of a runtime object, available from global
 *   - DBREF: datablock reference, either name (string) or order number (uint)
 *   - COMMAND: a command name with arguments in brackets - <string command-name>(any argument1, any argument2, ...)
 *   - FRAME: a delta and a list<COMMAND>
 *   - VALUE: a numeric of string literal
 *     b:<uint8>: 8 bit integer value,
 *     w:<uint16>: 16 bit integer value,
 *     d:<uint32>: 32 bit integer value,
 *     f:<float32>: 32 bit float value
 *     "<string>": text value
 *     else a constant or a REF
 * 
 * 1.1. Keywords
 *   Reserved words: adapter, sequence, datablock, import, frame
 * 
 * 1.2. Comments
 *   Support line comments created with //
 * 
 * 1.3. Expressions
 *   set: define and set a named value
 *     set <string name> <object value>
 *   adapter: define an adapter with name and a dbref for preparation
 *     adapter "<string adapter-name>", <REF prepare-block>
 *   sequence: define a named sequence of commands for a given adapter
 *     sequence "<string sequence-name>", "string <adapter-name>" { list<FRAME> }
 *   datablock: define or import a named data-block
  *    datablock "<string datablock-name>" list<VALUE>
 *     datablock "<string datablock-name>" import "<string url>"
 * 
 * 2. Example
 *  // set constants
 *  set SPR0 0
 *  set CHN1 1
 * 
 *  // data blocks
 *  datablock "Master" b01, SpriteManager.Device.SPRITE
 *  datablock "PrepareSprite" b10, "sprites.json"
 * 
 *  // list of adapters: type, prepare datablock ref
 *  adapter "Player", 0
 *  adapter "SpriteManager", "PrepareSprite"
 * 
 *  // list of sequences: type, adapter ref
 *  sequence "Master", "Player" {
 *    frame(  0, assign(CHN1, "MySequence", SPR0, 1));
 *    frame(200, end());
 *  }
 * 
 *  sequence "MySequence", "Sprites" {
 *    frame(0, spr_frame(SPR0, 3), spr_scale(SPR0, 2.1, 0.5, 1), spr_rotate(SPR0, 30), spr_position(SPR0, 10, 10, 0))
 *    frame(100, spr_frame(SPR0, 0))
 *  }
 * 
 *******************************************************************************/

var grammar = {
    'prototypes': {
        // separator
        ' ': { 'symbol': 'W'  },
       '\t': { 'symbol': 'W'  },
     '\r\n': { 'symbol': 'NL' },
       '\n': { 'symbol': 'NL' },
       '\r': { 'symbol': 'NL' },
       //'\0': { 'symbol': 'T'  },
       //';':  { 'symbol': 'T'  },

        // keywords
        'set':          { 'symbol': 'D', 'action': function() { this.command.apply(this, arguments); } },
        'adapter':      { 'symbol': 'A', 'action': function() { this.command.apply(this, arguments); } },
        'sequence':     { 'symbol': 'S', 'action': function() { this.command.apply(this, arguments); } },
        'frame':        { 'symbol': 'F', 'action': function() { this.command.apply(this, arguments); } },
        'datablock':    { 'symbol': 'B', 'action': function() { this.command.apply(this, arguments); } },

        // misc.
        '{': { 'symbol': 'C1' },
        '}': { 'symbol': 'C2' },
        '(': { 'symbol': 'C3' },
        ')': { 'symbol': 'C4' },
        ',': { 'symbol': 'C'  },
       '//': { 'symbol': 'R'  },

        //states
        '___T': { 'symbol': 'T' },
        //'___E': { 'symbol': 'E' },
        '__D1': { 'symbol': 'D1' },
        '__D2': { 'symbol': 'D2' },
        '__D3': { 'symbol': 'D3' },
        '__D4': { 'symbol': 'D4' },
        '__D5': { 'symbol': 'D5' },
        '__A1': { 'symbol': 'A1' },
        '__A2': { 'symbol': 'A2' },
        '__A3': { 'symbol': 'A3' },
        '__A4': { 'symbol': 'A4' },
        '__B1': { 'symbol': 'B1' },
        '__B2': { 'symbol': 'B2' },
        '__B3': { 'symbol': 'B3' },
        '__B4': { 'symbol': 'B4' },
        '__B5': { 'symbol': 'B5' },
        '__B6': { 'symbol': 'B6' },
        '__S1': { 'symbol': 'S1' },
        '__S2': { 'symbol': 'S2' },
        '__S3': { 'symbol': 'S3' },
        '__S4': { 'symbol': 'S4' },
        '__S5': { 'symbol': 'S5' },
        '__S6': { 'symbol': 'S6' },
        '__S7': { 'symbol': 'S7' },
        '__F1': { 'symbol': 'F1' },
        '__F2': { 'symbol': 'F2' },
        '__F3': { 'symbol': 'F3' },
        '__F4': { 'symbol': 'F4' },
        '__F5': { 'symbol': 'F5' },
        '__F6': { 'symbol': 'F6' },
        '__F7': { 'symbol': 'F7' },
        '__Fx': { 'symbol': 'Fx' },
       '__S10': { 'symbol': 'S10' },
       '__S11': { 'symbol': 'S11' },
       '__S12': { 'symbol': 'S12' },
       '__S13': { 'symbol': 'S13' },
       '__S20': { 'symbol': 'S20' },
        '__R1': { 'symbol': 'R1' }
    },
    'rules': [
        { input:'WW',   output:'W',  priority: 2000,  action: null },
        { input:'WC',   output:'C',  priority: 2000,  action: null },
        { input:'CW',   output:'C',  priority: 2000,  action: null },
        { input:'NL',   output:'T',  priority: 2000,  action: function(t) { t.data.lineNumber = this.lineNumber++; t.data.term = '<T>'; } },
        { input:'TT',   output:'T',  priority: 1900,  action: null },
        { input:'RT',   output:'',   priority: 1800,  action: null },
        { input:'R*',   output:'R',  priority: 1700,  action: null },
        // { input:'WW',   output:'W',  priority:  700,  action: null },

        // set SPR0 0
        { input:'DW',   output:'D1', priority: 900,  action: null }, // 'set '
        { input:'D1W',  output:'D1', priority: 900,  action: null }, // 'set   '
        { input:'D1L',  output:'D2', priority: 900,  action: null }, // 'set SPR0'
        { input:'D2W',  output:'D3', priority: 900,  action: null }, // 'set SPR0 '
        { input:'D3W',  output:'D3', priority: 900,  action: null }, // 'set SPR0   '
        { input:'D3L',  output:'D4', priority: 900,  action: null }, // 'set SPR0 0'
        { input:'D4W',  output:'D4', priority: 900,  action: null }, // 'set SPR0 0   '
        { input:'D4T',  output:'',   priority: 900,  action: function(d4, t) { this.command(d4, t); } }, //d4.data.lineNumber = t.data.lineNumber; } },

        // adapter "Player", 0
        { input:'AW',   output:'A1', priority: 700,  action: null }, // 'adapter '
        { input:'A1W',  output:'A1', priority: 700,  action: null }, // 'adapter    '
        { input:'A1L',  output:'A2', priority: 700,  action: null }, // 'adapter "Player"'
        { input:'A2W',  output:'A2', priority: 700,  action: null }, // 'adapter "Player"   '
        { input:'A2C',  output:'A3', priority: 700,  action: null }, // 'adapter "Player",'
        { input:'A3W',  output:'A3', priority: 700,  action: null }, // 'adapter "Player",   '
        { input:'A3L',  output:'A4', priority: 700,  action: null }, // 'adapter "Player", 0'
        { input:'A4W',  output:'A4', priority: 700,  action: null }, // 'adapter "Player", 0   '
        { input:'A4T',  output:'',   priority: 700,  action: function(a4, t) { this.command(a4, t); } },

        // datablock "Master" { b:1, w:100 }
        { input:'BW',   output:'B1', priority: 800,  action: null }, // 'datablock '
        { input:'B1W',  output:'B1', priority: 800,  action: null }, // 'datablock   '
        { input:'B1L',  output:'B2', priority: 800,  action: null }, // 'datablock "Master"'
        { input:'B2W',  output:'B3', priority: 800,  action: null }, // 'datablock "Master" '
        { input:'B3W',  output:'B3', priority: 800,  action: null }, // 'datablock "Master"    '
        { input:'B3C1', output:'B4', priority: 800,  action: null }, // 'datablock "Master" {'
        { input:'B4W',  output:'B4', priority: 800,  action: null }, // 'datablock "Master" { '
        { input:'B4L',  output:'B5', priority: 800,  action: null }, // 'datablock "Master" { 1'
        { input:'B4T',  output:'B4', priority: 800,  action: null }, // 'datablock "Master" { 1<NL>'
        { input:'B5W',  output:'B5', priority: 800,  action: null }, // 'datablock "Master" { 1 '
        { input:'B5C',  output:'B4', priority: 800,  action: null }, // 'datablock "Master" { 1,'
        { input:'B5T',  output:'B5', priority: 800,  action: null }, // 'datablock "Master" { 1,<NL>'
        { input:'B5C2', output:'B6', priority: 800,  action: null }, // 'datablock "Master" { 1,100 }'
        { input:'B6T',  output:'',   priority: 800,  action: function(b6, t) { this.command(b6, t); } },

        // sequence "Master", "Player" { frame(  0, assign(CHN1, "MySequence", SPR0, 1)) }
        { input:'SW',   output:'S1', priority: 600,  action: null }, // 'sequence '
        { input:'S1W',  output:'S1', priority: 600,  action: null }, // 'sequence    '
        { input:'S1L',  output:'S2', priority: 600,  action: null }, // 'sequence "Master"'
        { input:'S2W',  output:'S2', priority: 600,  action: null }, // 'sequence "Master"   '
        { input:'S2C',  output:'S3', priority: 600,  action: null }, // 'sequence "Master",'
        { input:'S3W',  output:'S3', priority: 600,  action: null }, // 'sequence "Master",   '
        { input:'S3L',  output:'S5', priority: 600,  action: null }, // 'sequence "Master","Player"'
        { input:'S5W',  output:'S5', priority: 600,  action: null }, // 'sequence "Master","Player"   '
        { input:'S5C1', output:'S6', priority: 600,  action: function(s5) { this.createSub(s5, 'frames'); } }, // 'sequence "Master","Player" {'
        { input:'S6T',  output:'S6', priority: 600,  action: null }, // 'sequence "Master","Player" {<NL>'
        { input:'S6W',  output:'S6', priority: 600,  action: null }, // 'sequence "Master","Player" {    '
        { input:'S6Fx', output:'S6', priority: 600,  action: function(s6, fx) { return this.addParameter(s6, fx); } }, // 'sequence "Master","Player" { frame(...)'
        { input:'S6C2', output:'S7', priority: 600,  action: null }, // 'sequence "Master","Player" { ... }'
        { input:'S7T',  output:'S7', priority: 600,  action: function(s7, t) { this.command(s7, t); } },

        { input:'FC3',  output:'F1', priority: 700,  action: null }, // 'frame('
        { input:'F1W',  output:'F1', priority: 700,  action: null }, // 'frame(   '
        { input:'F1T',  output:'F1', priority: 700,  action: null }, // 'frame(<NL>'
        { input:'F1L',  output:'F2', priority: 700,  action: null }, // 'frame(delta'
        { input:'F2C',  output:'F3', priority: 700,  action: null }, // 'frame(delta,'
        { input:'F3W',  output:'F3', priority: 700,  action: null }, // 'frame(delta,   '
        { input:'F3T',  output:'F3', priority: 700,  action: null }, // 'frame(delta,<NL>'
        { input:'F3L',  output:'F4', priority: 700,  action: null }, // 'frame(delta,assign'
        { input:'F3C4', output:'Fx', priority: 700,  action: null }, // 'frame(delta,assign(...))'
        { input:'F4C3', output:'F5', priority: 700,  action: null }, // 'frame(delta,assign('
        { input:'F5W',  output:'F5', priority: 700,  action: null }, // 'frame(delta,assign(   '
        { input:'F5T',  output:'F5', priority: 700,  action: null }, // 'frame(delta,assign(<NL>'
        { input:'F5C4', output:'F3', priority: 700,  action: function(f5) { return this.addParameter(f5, null); } }, // 'frame(delta,end()
        { input:'F5L',  output:'F6', priority: 700,  action: function(f5, l) { return this.addParameter(f5, l); } }, // 'frame(delta,assign(CHN1'
        { input:'F6C',  output:'F5', priority: 700,  action: null }, // 'frame(delta,assign(CHN1,'
        { input:'F6C4', output:'F3', priority: 700,  action: null }, // 'frame(delta,assign(CHN1,...)'
        { input:'F6W',  output:'F6', priority: 700,  action: null }, // 'frame(delta,assign(CHN1   '
        { input:'F6T',  output:'F6', priority: 700,  action: null }, // 'frame(delta,assign(CHN1<NL>'

        { input:'*T',    output:'',  priority: 100,  action: function(l, t) { this.errors.push(`(${t.data.lineNumber}): Syntax error!`); } }
    ]
};