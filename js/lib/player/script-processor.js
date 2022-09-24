/******************************************************************************
 * Adapter-Sequence-User data block SCRIPT LANGUAGE
 * 
 * 1. Syntax
 *   Internal types used in this description
 *   - constants are defined by the 'set' keyword
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
 *     sequence "<string sequence-name>", "string <adapter-name>", { list<FRAME> }
 *   datablock: define or import a named data-block
 *     datablock "<string datablock-name>", { list<VALUE> }
 *     datablock "<string datablock-name>" import "<string url>"
 * 
 * 2. Example
 *  // set constants
 *  set SPR0 0
 *  set CHN1 1
 * 
 *  // data blocks
 *  datablock "Master", { b01, SpriteManager.Device.SPRITE }
 *  datablock "PrepareSprite", { b10, "sprites.json" }
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
function ScriptProcessor() {
    this.grammar = {
        'prototypes': {
            //#region separator
            ' ':  { 'symbol': 'W',  'ignore':true },
            '"':  { 'symbol': 'Q',  'ignore':false },
            '\t': { 'symbol': 'W',  'ignore':true },
          '\r\n': { 'symbol': 'NL', 'ignore':true },
            '\n': { 'symbol': 'NL', 'ignore':true },
            '\r': { 'symbol': 'NL', 'ignore':true },
            //#endregion

            //#region keywords
            'set':          { 'symbol': 'D', 'action': null },
            'adapter':      { 'symbol': 'A', 'action': null },
            'sequence':     { 'symbol': 'S', 'action': null },
            'frame':        { 'symbol': 'F', 'action': null },
            'datablock':    { 'symbol': 'B', 'action': null },
            //#endregion

            //#region misc.
            '{':  { 'symbol': 'C1', 'ignore':true }, //'action': c1 => { delete c1.data.term; return c1; } },
            '}':  { 'symbol': 'C2', 'ignore':true },
            '(':  { 'symbol': 'Z1', 'ignore':true },
            ')':  { 'symbol': 'Z2', 'ignore':true },
            ',':  { 'symbol': 'C',  'ignore':true },
            '//': { 'symbol': 'R'  },
            //#endregion

            //#region states
            '___T': { 'symbol':  'T', 'ignore':true },
            '___N': { 'symbol':  'N', 'start':true },
            '__W2': { 'symbol': 'W2', 'ignore':false },
            //#endregion
        },
        'rules': [
            //#region preprocessing

            // quotation
            // TODO: use QS (quoted string) instead of L (literal)
            { input:'Q',     output:'Q1',       priority: 3000, action: null },
            { input:'Q1 *',  output:'Q1',       priority: 3100, action: null },
            { input:'Q1 W',  output:'Q1 W2',    priority: 3200, action: null },
            { input:'Q1 Q',  output:'Q2',       priority: 3300, action: null },
            { input:'Q2',    output:'L',        priority: 3400, action: function(q2) { this.createQuotedString(q2); } },

            // merge whitespace
            { input:'W W',   output:'W', priority: 2000, action: null },

            // whitespace + comma
            { input:'W C',   output:'C',  priority: 2000, action: null },
            { input:'C W',   output:'C',  priority: 2000, action: null },

            // whitespace + bracket
            { input:'W C1',   output:'C1',  priority: 2000, action: null },
            { input:'C1 W',   output:'C1',  priority: 2000, action: null },
            { input:'W C2',   output:'C2',  priority: 2000, action: null },
            { input:'C2 W',   output:'C2',  priority: 2000, action: null },

            // brackets + whitespace
            { input:'W Z1',  output:'Z1', priority: 2000, action: null },
            { input:'Z1 W',  output:'Z1', priority: 2000, action: null },
            { input:'W Z1',  output:'Z1', priority: 2000, action: null },
            { input:'Z2 W',  output:'Z2', priority: 2000, action: null },
            //{ input:'WNL',  output:'W',  priority: 1900, action: null },

            // new line => terminal
            { input:'NL',   output:'T',  priority: 1900, action: function(nl) { return this.addLineNumber(nl); } },

            // row remarks
            { input:'R T',   output:'',   priority: 1800, action: null },
            { input:'R *',   output:'R',  priority: 1700, action: null },

            // terminal
            { input:'* T',   output:'',   priority:  100, action: (w, t) => w },
            //#endregion

            //#region data array
            { input:'C1 W',  output:'C1', priority: 1400, action: null }, // '{ '
            { input:'C1 T',  output:'C1', priority: 1400, action: null }, // '{<NL>'
            { input:'C1 L',  output:'L1', priority: 1400, action: null }, // '{1'
            { input:'C1 T',  output:'C1', priority: 1300, action: null }, // '{1<NL>'
            { input:'L1 W',  output:'L1', priority: 1300, action: null }, // '{1 '
            { input:'L1 C',  output:'L0', priority: 1300, action: null }, // '{1, '
            { input:'L0 T',  output:'L0', priority: 1300, action: null }, // '{1,<NL>'
            { input:'L0 W',  output:'L0', priority: 1300, action: null }, // '{1, '
            { input:'L0 L',  output:'L1', priority: 1300, action: null }, // '{1,2'
            { input:'L1 T',  output:'L1', priority: 1300, action: null }, // '{1,2<NL>'
            { input:'L1 C2', output:'L2', priority: 1200, action: null }, // '{1,2}'
            //#endregion

            //#region command { ... }
            { input:'L Z1',  output:'O1', priority: 1500, action: null }, // '<command>>('
            { input:'O1 Z2', output:'O3', priority: 1500, action: null }, // '<command>()'
            { input:'O1 L',  output:'O2', priority: 1500, action: null }, // '<command>(arg1'
            { input:'O2 C',  output:'O1', priority: 1500, action: null }, // '<command>(arg1,'
            { input:'O2 Z2', output:'O3', priority: 1500, action: null }, // '<command>(arg1,...)'
            //#endregion

            //#region frame 0, { <command>( ... ), ... }
            { input:'F W',  output:'F',  priority: 1400, action: null }, // 'frame '
            { input:'F L',  output:'F1', priority: 1400, action: null }, // 'frame 0'
            { input:'F1 W', output:'F1', priority: 1400, action: null }, // 'frame 0 '
            { input:'F1 C', output:'F2', priority: 1400, action: null }, // 'frame 0,'
            { input:'F2 W', output:'F2', priority: 1300, action: null }, // 'frame 0, '
            { input:'F2 C1',output:'F3', priority: 1300, action: null }, // 'frame 0, {'
            { input:'F3 W', output:'F3', priority: 1300, action: null }, // 'frame 0, { '
            { input:'F3 O3',output:'F4', priority: 1300, action: null }, // 'frame 0, { <command> ( ... )'
            { input:'F4 C', output:'F3', priority: 1300, action: null }, // 'frame 0, { <command> ( ... ),'
            { input:'F4 C2',output:'F5', priority: 1300, action: null }, // 'frame 0, { <command> ( ... ) }'
            //#endregion

            //#region set <symbol> <value>
            { input:'D W',   output:'D1', priority: 900,  action: null }, // 'set '
            { input:'D1 W',  output:'D1', priority: 900,  action: null }, // 'set   '
            { input:'D1 L',  output:'D2', priority: 900,  action: null }, // 'set <symbol>'
            { input:'D2 W',  output:'D3', priority: 900,  action: null }, // 'set <symbol> '
            { input:'D3 W',  output:'D3', priority: 900,  action: null }, // 'set <symbol>   '
            { input:'D3 L',  output:'D4', priority: 900,  action: null }, // 'set <symbol> 0'
            { input:'D4 W',  output:'D4', priority: 900,  action: null }, // 'set <symbol> 0   '
            { input:'D4 T',  output:'G',  priority: 900,  action: function(d4) { this.addSymbol(d4); } },
            //#endregion

            //#region adapter "<type>", <datablock ref>
            { input:'A W',   output:'A1', priority: 800,  action: null }, // 'adapter '
            { input:'A1 W',  output:'A1', priority: 800,  action: null }, // 'adapter    '
            { input:'A1 L',  output:'A2', priority: 800,  action: null }, // 'adapter "Player"'
            { input:'A2 W',  output:'A2', priority: 800,  action: null }, // 'adapter "Player"   '
            { input:'A2 C',  output:'A3', priority: 800,  action: null }, // 'adapter "Player",'
            { input:'A3 W',  output:'A3', priority: 800,  action: null }, // 'adapter "Player",   '
            { input:'A3 L',  output:'A4', priority: 800,  action: null }, // 'adapter "Player", 0'
            //{ input:'A3 V1', output:'A4', priority: 800,  action: null }, // 'adapter "Player", "db0"'
            { input:'A4 W',  output:'A4', priority: 800,  action: null }, // 'adapter "Player", 0   '
            { input:'A4 T',  output:'G',  priority: 800,  action: function(a4) { this.addAdapterInfo(a4); } },
            //#endregion

            //#region datablock "<name>", { <data> }
            { input:'B W',   output:'B1', priority: 700,  action: null }, // 'datablock '
            { input:'B1 W',  output:'B1', priority: 700,  action: null }, // 'datablock   '
            { input:'B1 L',  output:'B2', priority: 700,  action: null }, // 'datablock "Master"'
            { input:'B2 W',  output:'B2', priority: 700,  action: null }, // 'datablock "Master" '
            { input:'B2 C',  output:'B3', priority: 700,  action: null }, // 'datablock "Master",'
            { input:'B3 W',  output:'B3', priority: 700,  action: null }, // 'datablock "Master", '
            { input:'B3 L2', output:'B4', priority: 700,  action: null }, // 'datablock "Master",{...}'
            { input:'B4 W',  output:'B4', priority: 700,  action: null }, // 'datablock "Master" {...}'
            { input:'B4 T',  output:'G',  priority: 700,  action: function(b4) { this.addDatablockInfo(b4); } }, // 'datablock "Master" {...}<NL>'
            //#endregion

            //#region sequence "Master", "Player", { frame 0, { command { TestAdapter.SetText, "Seq1.1" }, ... } ... }
            { input:'S W',   output:'S1', priority: 600,  action: null }, // 'sequence '
            { input:'S1 W',  output:'S1', priority: 600,  action: null }, // 'sequence    '
            { input:'S1 L',  output:'S2', priority: 600,  action: null }, // 'sequence "Master"'
            { input:'S2 W',  output:'S2', priority: 600,  action: null }, // 'sequence "Master"   '
            { input:'S2 C',  output:'S3', priority: 600,  action: null }, // 'sequence "Master",'
            { input:'S3 W',  output:'S3', priority: 600,  action: null }, // 'sequence "Master",   '
            { input:'S3 L',  output:'S4', priority: 600,  action: null }, // 'sequence "Master","Player"'
            { input:'S4 W',  output:'S4', priority: 600,  action: null }, // 'sequence "Master","Player"   '
            { input:'S4 C',  output:'S5', priority: 600,  action: null }, // 'sequence "Master","Player",'
            { input:'S5 W',  output:'S5', priority: 600,  action: null }, // 'sequence "Master","Player",  '
            { input:'S5 C1', output:'S6', priority: 600,  action: null }, // 'sequence "Master","Player", {'
            { input:'S6 W',  output:'S6', priority: 600,  action: null }, // 'sequence "Master","Player", { '
            { input:'S6 F5', output:'S7', priority: 600,  action: null }, // 'sequence "Master","Player", { <frame>'
            { input:'S7 W',  output:'S7', priority: 600,  action: null }, // 'sequence "Master","Player", { <frame> '
            { input:'S7 C',  output:'S6', priority: 600,  action: null }, // 'sequence "Master","Player", { <frame>,'
            { input:'S7 C2', output:'S8', priority: 600,  action: null }, // 'sequence "Master","Player", { ... }'
            { input:'S8 T',  output:'G',  priority: 600,  action: function(s8) { this.addSequenceInfo(s8); } }, // 'sequence "Master","Player", { ... }<NL>'
            //#endregion

            { input:'N G',  output:'N',  priority: 200,  action: null },
            { input:'N',    output:'',   priority:  10,  action: null },
        ]
    };

    this.symbols = {};
    this.adapterInfo = [];
    this.datablockInfo = [];
    this.sequenceInfo = [];
    this.lineNumber = 1;

    this.player = null;
}

ScriptProcessor.prototype.addLineNumber = function addLineNumber(n) {
    n.lineNumber = this.lineNumber++;
    for (var i=n.id; i>=0; i--) {
        if (n.graph.vertices[i].lineNumber == undefined) {
            n.graph.vertices[i].lineNumber = n.lineNumber;
        }
    }
};

ScriptProcessor.prototype.createQuotedString = function createQuotedString(s) {
    var props = s.data.getValue();
    s.data.value = props.join('');
    s.edges.length = 0;
};

ScriptProcessor.prototype.mergeString = function mergeString(s, t) {
    t.data.value += s.data.value;
    return t;
};

ScriptProcessor.prototype.createStream = function createStream(data) {
    var stream = new Stream(4096);
    if (!Array.isArray(data)) throw new Error('ScriptProcessor.createStream input is not array!');
    for (var i=0; i<data.length; i++) {
        var v = this.parseValue(data[i]);
        if (v.type != null) {
            switch (v.type.name) {
                case 'string': stream.writeString(v.value); break;
                case 'int8': stream.writeInt8(v.value); break;
                case 'int16': stream.writeInt16(v.value); break;
                case 'int32': stream.writeInt32(v.value); break;
                case 'uint8': stream.writeUint8(v.value); break;
                case 'uint16': stream.writeUint16(v.value); break;
                case 'uint32': stream.writeUint32(v.value); break;
                case 'float': stream.writeFloat32(v.value); break;
            }
        } else {
            throw new Error(`Unknown symbol '${data[i]}'`);
        }
    }
    var result = new Stream(stream.length);
    result.writeStream(stream, 0, stream.length);
    return result;
};
ScriptProcessor.prototype.parseNumber = function parseNumber(term, data) {
    // b:213        => uint8 (byte)
    // w:2313       => uint16 (word)
    // d:1073741824 => uint32 (dword)
    // f:1.3        => float
    var result = false;
    if (term.charAt(1) == ':') {
        var p = term.charAt(0);
        var bits = { 'b': 8, 'w':16, 'd':32 }[p];
        var value = Number(term.substring(2));
        if (bits != undefined) {
            // try int
            data.type = Ps.PlayerAdapter.schema.types.get('uint'+bits);
            if (!data.type.validate(value)) {
                // try uint
                data.type = Ps.PlayerAdapter.schema.types.get('int'+bits);
                var result = [];
                if (!data.type.validate(value, result)) {
                    throw new Error(result);
                }
            }
            data.value = value;
            result = true;
        } else {
            throw new Error(`Invalid number prefix '${p}'!`);
        }
    } else {
        data.value = Number(term);
        if (!isNaN(data.value)) {
            data.type = term.indexOf('.') == -1 ? this.getIntType(data.value) : Ps.PlayerAdapter.schema.types.get('float');
            result = true;
        }
    }
    return result;
};
ScriptProcessor.prototype.getIntType = function getIntType(n) {
    var type = null;
    var types = ['uint8', 'int8', 'uint16', 'int16', 'uint32', 'int32']
    var result = false;
    for (var i=0; i<types.length; i++) {
        type = Ps.PlayerAdapter.schema.types.get(types[i]);
        if (result = type.validate(n)) {
            break;
        }
    }
    if (!result) {
        throw new Error(`Invalid number '${n}'`);
    }
    return type;
};

ScriptProcessor.prototype.parseValue = function parseValue(term) {
    var types = Ps.PlayerAdapter.schema.types;
    var data = {
        'type': null,
        'value': null
    };
    // term can be
    // - number
    // - string
    //   -literal "xxx"
    //   - number literal w/o prefix
    //   - keyword
    if (typeof term === 'number') {
        data.type = Number.isInteger(term) ? this.getIntType(term) : Ps.PlayerAdapter.schema.types.get('float');
        data.value = term;
    } else if (typeof term === 'string') {
        if (term.charAt(0) == '"') {
            data.type = types.get('string');
            data.value = term.substring(1, term.lastIndexOf('"'));
        } else {
            if (!this.parseNumber(term, data)) {
                // look up term
                var s = this.symbols[term];
                if (s != undefined) {
                    data.type = s.type;
                    data.value = s.value;
                } else {
                    throw new Error(`Unknown symbol '${term}'`);
                }
            }
        }
    } else {
        debugger
        throw new Error('Invalid input!');
    }
    if (data.value) data.value = data.value.valueOf();
    return data;
};

ScriptProcessor.prototype.addSymbol = function addSymbol(n) {
    var props = n.data.getValue();
    this.symbols[props[1]] = this.parseValue(props[2]);
};

ScriptProcessor.prototype.addAdapterInfo = function addAdapterInfo(n) {
    var props = n.data.getValue();
    var ai = { adapter:props[1], datablock:props[2] };
    this.adapterInfo.push(ai);
    n.data.value = ai;
};
ScriptProcessor.prototype.addDatablockInfo = function addDatablockInfo(n) {
    var name = n.edges[0].to.data.getValue()[0];
    var data = n.edges[1].to.data.getValue();
    var di = { name:name, data:data };
    this.datablockInfo.push(di);
    n.data.value = di;
};
ScriptProcessor.prototype.addSequenceInfo = function addSequenceInfo(n) {
    var props = n.data.getValue();
    var frames = this.getFrames(n);
    var di = { name:props[1], adapter:props[2], frames:frames };
    this.sequenceInfo.push(di);
    n.data.value = di;
};
ScriptProcessor.prototype.getFrames = function getFrames(s) {
    var frames = [];
    for (var i=2; i<s.edges.length; i++) {
        var f = s.edges[i].to;
        var delta = f.edges[0].to.data.getValue()[0];
        var frame = { delta: delta, commands:[] };
        for (j=1; j<f.edges.length; j++) {
            var command = f.edges[j].to.data.getValue();
            frame.commands.push(command);
        }
        frames.push(frame);
    }
    return frames;
};
