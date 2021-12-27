include('/lib/data/dictionary.js');
include('/lib/player/iadapter-ext.js');
include('/lib/player/player.js');
include('/lib/utils/syntax.js');
include('/lib/type/schema.js');
include('/lib/player/grammar.js');
// include('/lib/data/dataseries.js');
// include('/lib/data/stream.js');
// include('/lib/synth/synth-adapter.js');
// include('/lib/glui/glui-lib.js');

(function() {
    function PlayerExt() {
        PlayerExt.base.constructor.call(this);
        this.schema = null;
    }
    extend(Ps.Player, PlayerExt);
    implements(PlayerExt, Ps.IAdapterExt);
    // Extensions to the player-adapter
    PlayerExt.prototype.makeCommand = function(command)  {
        var stream = new Stream(128);
        if (typeof command == 'string') {
            command = Ps.Player.Commands[command.toUpperCase()];
        }
        stream.writeUint8(command);
        var inputStream = null;
        if (arguments[1] instanceof Ps.Sequence) inputStream = arguments[1].stream;
        else if (arguments[1] instanceof Stream) inputStream = arguments[1];
        switch (command) {
            case Ps.Player.Commands.Assign:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 4);
                } else {
                    stream.writeUint8(arguments[1]);    // channel id
                    stream.writeUint8(arguments[2]);    // sequence id
                    stream.writeUint8(arguments[3]);    // device id
                    stream.writeUint8(arguments[4]);    // loop count
                }
                break;
            case Ps.Player.Commands.Tempo:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 4);
                } else {
                    stream.writeFloat32(arguments[1]);
                }
                break;
            case Ps.Player.Commands.EOF:
                stream.writeUint8(Ps.Player.Commands.EOF);
                break;
            case Ps.Player.Commands.EOS:
                stream.writeUint8(Ps.Player.Commands.EOS);
                break;
        }

        stream.buffer = stream.buffer.slice(0, stream.length);
        return stream;
    };

    PlayerExt.prototype.getSymbol = function getSymbol(name) {
        var types = this.schema.types;
        return {
            'Player': { 'type':types.get('uint8'), 'value': Ps.Player.Device.PLAYER },
            'Channel': { 'type':types.get('uint8'), 'value': Ps.Player.Device.CHANNEL },
            'EOF': { 'type':types.get('uint8'), 'value': Ps.Player.Commands.EOF },
            'EOS': { 'type':types.get('uint8'), 'value': Ps.Player.Commands.EOS },
            'Assign': { 'type':types.get('uint8'), 'value': Ps.Player.Commands.Assign },
            'Tempo': { 'type':types.get('uint8'), 'value': Ps.Player.Commands.Tempo }
        }[name];
    };

    PlayerExt.prototype.importScript = function(script) {
        var errors = [];
        var syntax = new Syntax(grammar, 2);
        var context = {
            lineNumber: 1,
            parseValue: function parseValue(term) {
                var types = this.player.schema.types;
                var data = {
                    'type': types.get('string'),
                    'value': null
                };
                var start = 0, length = term.length;
                // detect type from term
                // 1. "string" => string
                if (term.startsWith('"')) {
                    data.value = types.get('string').parse(term);
                } else {
                    // 1.3          => float
                    // 23           => uint8
                    // b:213        => uint8 (byte)
                    // w:2313       => uint16 (word)
                    // d:1073741824 => uint32 (dword)
                    // f:1.3        => float
                    // <symbol>     => lookup symbol
                    start = 2;
                    switch (term.charAt(0)) {
                        case 'b': data.type = types.get('uint8'); break;
                        case 'w': data.type = types.get('uint16'); break;
                        case 'd': data.type = types.get('uint32'); break;
                        case 'f': data.type = types.get('float'); break;
                        default:
                            data.value = Number(term);
                            if (!isNaN(data.value)) {
                                data.type = term.indexOf('.') == -1 ? types.get('uint8') : types.get('float');
                            } else {
                                // look up term
                                var s = this.symbols[term];
                                if (!s) {
                                    var tokens = term.split('.');
                                    // check adapters
                                    var def = this.adapters.find(x => x.adapter.getInfo().name == tokens[0]);
                                    data = def.adapter.getSymbol(tokens[1]);
                                } else {
                                    data.type = s.type;
                                    data.value = s.value;
                                }
                            }
                            break;
                    }
                }
                if (data.value == null) {
                    data.value = data.type.parse(term.substr(start, length));
                }
                data.value = data.value.valueOf();
                
                return data;
            },
            createStream: function createStream(data) {
                var stream = new Stream(4096);
                for (var i=0; i<data.length; i++) {
                    var v = this.parseValue(data[i]);
                    switch (v.type.name) {
                        case 'string': stream.writeString(v.value); break;
                        case 'uint8': stream.writeUint8(v.value); break;
                        case 'uint16': stream.writeUint16(v.value); break;
                        case 'uint32': stream.writeUint32(v.value); break;
                        case 'float': stream.writeFloat32(v.value); break;
                    }
                }
                return new Stream(stream.length).writeStream(stream, 0, stream.length);
            },
            addLineNumber: function addLineNumber(n) {
                n.lineNumber = this.lineNumber++;
                return n;
            },
            addAdapter: function addAdapter(type, dbRef) {
                type = this.parseValue(type).value;
                var adapter = null;
                for (var i in Ps.Player.adapterTypes) {
                    var ad = Reflect.construct(Ps.Player.adapterTypes[i], [this.player]);
                    if (ad.getInfo().name == type) { adapter = ad; break; }
                }                        
                if (adapter) {
                    this.adapters.push({ adapter:adapter, datablock:this.parseValue(dbRef).value });
                } else {
                    //error = `Unknown adapter '${type}'!`
                }
            },
            addDatablock: function addDatablock(name, data) {
                this.datablocks.add(name, this.createStream(data));
            },
            addSymbol: function addSymbol(name, value) {
                this.symbols[name] = this.parseValue(value);
            },
            symbols: {},
            player: this,
            adapters: [],
            datablocks: new Dictionary(),
            sequences: []
        };
        var expr = syntax.parse(script + '\r');
        expr.resolve(context);
        if (expr.lastNode.data.type.start != true) {
            var arr = [];
            expr.tree.DFS(expr.lastNode, null, n => {
                arr.unshift(n.data.term);
            });
            errors.push(`Syntax error around '${arr.join('')}'`);
        } else {
            var result = expr.evaluate(context);
            debugger
        }
        return errors;
    };

    PlayerExt.prototype.exportScript = function() {
        var arr = [];

        return arr.join('\n');
    };

    PlayerExt.create = async function create() {
        var playerExt = new PlayerExt();
        playerExt.initialize();
        playerExt.schema = await Schema.build(
            {
                'use-default-types': true
            }
        );
        return playerExt;
    };

//     Ps.Player.prototype.makeCommand = function(command) {
//         var stream = new Stream(128);
//         stream.writeUint8(command);
//         switch (command) {
//             case Ps.Player.Assign:
//                 if (arguments[1] instanceof Ps.Sequence) {
//                     stream.writeStream(arguments[1].stream, arguments[2], 3);
//                 } else {
//                     stream.writeUint8(arguments[1]);
//                     stream.writeUint8(arguments[2]);
//                     stream.writeUint8(arguments[3]);
//                 }
//                 break;
//             case Ps.Player.TEMPO:
//                 if (arguments[1] instanceof Ps.Sequence) {
//                     stream.writeStream(arguments[1].stream, arguments[2], 2);
//                 } else {
//                     stream.writeUint8(arguments[1]);
//                     stream.writeUint8(arguments[2]);
//                 }
//                 break;
//         }
//         return new Stream(stream);
//     };

//     Ps.Player.prototype.toDataSeries = function(sequence) {
//         var noteMap = {};
//         return Ps.IAdapterExt.toDataSeries.call(this, sequence,
//             (cmd, stream, cursor) => cmd,
//             (cmd, delta, stream, cursor, ds) => {
//                 switch (cmd) {
//                     case Ps.Player.Assign:
//                         var device = stream.readUint8(cursor++);
//                         var sequence = stream.readUint8(cursor++);
//                         ds.set(delta, stream.readUint8([delta, device, sequence]));
//                         break;
//                     case Ps.Player.TEMPO:
//                         ds.set(delta, stream.readUint8(cursor++));
//                         break;
//                     default:
//                         throw new Error(`Unsupported command #${cmd}`);
//                 }
//                 return cursor;
//             }
//         );
//     };

//     Ps.Player.prototype.fromDataSeries = function(series, channelId) {
//         var sequence = null;
//         var keys = Object.keys(series);
//         var f0 = 0, f1 = 0;
//         var noteMap = {};
//         var isEnd = false;
//         var lastWrite = -1;
//         var info = [];
//         do {
//             for (var k=0; k<keys.length; k++) {
//                 var key = parseInt(keys[k]);
//                 var ds = series[key];
//                 if (ds.data.length == 0) continue;
//                 if (info[k] == undefined) {
//                     info[k] = ds.getInfo();
//                 }
//                 if (key == Ps.Player.EOS) {
//                     isEnd = (f0 == info[k].max[0]);
//                     continue;
//                 }
//                 if (key == psynth.SynthAdapter.SETVELOCITY) continue;
//                 if (channelId != undefined && channelId != k) continue;
//                 if (info[k].max[0] >= f0) {
//                     var dataPoints = ds.get(f0);
//                     for (var i=0; i<dataPoints.length; i++) {
//                         if (sequence == null) {
//                             sequence = new Ps.Sequence(psynth.SynthAdapter);
//                             sequence.writeHeader();
//                         }
//                         // write delta
//                         sequence.writeDelta(f0 - f1);
//                         // make and write command
//                         var dataPoint = Array.from(dataPoints[i]);
//                         dataPoint[0] = key == psynth.SynthAdapter.SETNOTE ? key : psynth.SynthAdapter.SETCTRL8;
//                         var cmd = sequence.adapter.makeCommand.apply(null, dataPoint);
//                         sequence.stream.writeStream(cmd);
//                         noteMap[dataPoint[1]] = f0 + dataPoint[3];
//                     }
//                 }
//             }
//             sequence = sequence || new Ps.Sequence(psynth.SynthAdapter);
//             for (var n in noteMap) {
//                 if (noteMap[n] == f0) {
//                     if (lastWrite == sequence.cursor) {
//                         sequence.writeDelta(f0 - f1);
//                     }
//                     sequence.writeCommand(psynth.SynthAdapter.SETNOTE);
//                     sequence.stream.writeUint8(parseInt(n));
//                     sequence.stream.writeUint8(0);
//                     noteMap[n] = undefined;
//                 }
//             }
//             if (isEnd) {
//                 if (lastWrite == sequence.cursor) {
//                     sequence.writeDelta(f0 - f1);
//                 }
//                 sequence.writeCommand(Ps.Player.EOS);
//                 break;
//             }
//             if (lastWrite != sequence.cursor) {
//                 sequence.writeEOF();
//                 lastWrite = sequence.cursor;
//                 f1 = f0;
//             }
//             f0++;
//         } while (true);
//         return sequence;
//     };

//     Ps.Player.prototype.createDialog = function(type) {
//         var ui = null;
//         switch (type) {
//             case 'device': ui = new NewDevice(); break;
//             case 'sequence': ui = new NewSequence(); break;
//             default: throw new Error(`Invalid dialog type ${type}!`);
//         }
//         return ui;
//     };
    
//     Ps.Player.prototype.createDeviceUi = function(device) {
//         var template = {
//             'titlebar': 'Player',
//             'layout': Ui.Container.Layout.Free,
//             'items': {
//                 'bpm': { type:'pot', value: 100 }
//             },
//             'data-source': device
//         };
//         var ui = new Ui.Board(device.id, template, null);
//         ui.addClass('player');
//         return ui;
//     };

//     Ps.Player.prototype.createSequenceUi = function(sequence) {
//         var template = {
//             'titlebar': 'Player',
//             'layout': Ui.Container.Layout.Free
//         };
//         return new Ui.Board(sequence.id, template, null);
//     };

//     /* Dialogs ***************************************************************/
//     function NewDevice() {
//         Ui.Board.call(this, 'new-device', {
//             "titlebar": false,
//             "items": {
//                 "type": { "label": "Device type", "type": "ddlist", "item-key": false, "item-value": "$key" }
//             }
//         });
//         this.items.type.setItems( ['Channel'] );
//     }
//     extend(Ui.Board, NewDevice);
//     NewDevice.prototype.onchange = function(e) {
//     };

//     function NewSequence() {
//         Ui.Board.call(this, 'new-sequence', {
//             "titlebar": false,
//             "items": {
//                 "type": { "label": "Type", "type": "ddlist" }
//             }
//         });
//         this.items.type.setItems( Ps.Player.Device );
//     }
//     extend(Ui.Board, NewSequence);
//     NewDevice.prototype.onclick = function(e) {
//         console.log('Hello ' + e.control.id);
//     }
    publish(PlayerExt, 'PlayerExt', Ps);
})();