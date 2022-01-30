include('/lib/data/dictionary.js');
include('/lib/player/iadapter-ext.js');
include('/lib/player/player.js');
include('/lib/utils/syntax.js');
include('/lib/type/schema.js');
include('/lib/player/script-processor.js');
// include('/lib/data/dataseries.js');
// include('/lib/glui/glui-lib.js');

(async function() {
    implements(Ps.Player, Ps.IAdapterExt);
    Ps.Player.prototype.makeCommand = function(command)  {
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
                //stream.writeUint8(Ps.Player.Commands.EOF);
                break;
            case Ps.Player.Commands.EOS:
                //stream.writeUint8(Ps.Player.Commands.EOS);
                break;
        }

        stream.buffer = stream.buffer.slice(0, stream.length);
        return stream;
    };

    Ps.Player.prototype.getSymbol = function getSymbol(name) {
        return Ps.Player.symbols[name];
    };

    Ps.Player.prototype.getSymbols = () => Ps.Player.symbols;

    Ps.Player.prototype.importScript = async function(script) {
        var errors = [];
        var scriptProcessor = new ScriptProcessor();
        var syntax = new Syntax(scriptProcessor.grammar, 0);
        scriptProcessor.player = this;
        // add symbols
        for (var i in Ps.Player.adapterTypes) {
            var type = Ps.Player.adapterTypes[i];
            var symbols = type.adapter.getSymbols();
            for (var s in symbols) {
                scriptProcessor.symbols[s] = symbols[s];
            }
        }
        var expr = syntax.parse(script + '\r');
        expr.resolve(scriptProcessor);
        if (expr.lastNode.data.type.start != true) {
            var error = expr.lastNode.data.getValue().slice(0, 3).join(' ');
            errors.push(`Syntax error around '${error}' in line ${expr.lastNode.lineNumber}`);
        } else {
            var result = expr.evaluate(scriptProcessor);
            if (!result.type.start) {
                errors.push('Could not process input!');
            } else {
                // add datablock names as symbols
                for (var i=0; i<scriptProcessor.datablockInfo.length; i++) {
                    var key = scriptProcessor.parseValue(scriptProcessor.datablockInfo[i].name);
                    if (key.type.name == 'string') scriptProcessor.symbols[key.value] = scriptProcessor.parseValue(i);
                }
                // add sequence names as symbols
                for (var i=0; i<scriptProcessor.sequenceInfo.length; i++) {
                    var key = scriptProcessor.parseValue(scriptProcessor.sequenceInfo[i].name);
                    if (key.type.name == 'string') scriptProcessor.symbols[key.value] = scriptProcessor.parseValue(i);
                }
                // ensure player adapter's datablock is at #0
                for (var i=0; i<scriptProcessor.adapterInfo.length; i++) {
                    var ai = scriptProcessor.adapterInfo[i];
                    var type = scriptProcessor.parseValue(ai.adapter).value;
                    if (type == this.getInfo().name) {
                        var dbId = scriptProcessor.datablockInfo.findIndex(x => x.name == ai.datablock);
                        if (dbId == -1) {
                            errors.push(`Could not find master data block '${ai.datablock}'!`);
                            break;
                        }
                        for (var j=0; j<dbId; j++) {
                            var key = scriptProcessor.parseValue(scriptProcessor.datablockInfo[j].name).value;
                            scriptProcessor.symbols[key].value++;
                        }
                        var db = scriptProcessor.datablockInfo.splice(dbId, 1)[0];
                        scriptProcessor.datablockInfo.unshift(db);
                        ai.datablock = 0;
                        break;
                    }
                }

                // create datablocks
                this.datablocks = [];
                for (var i=0; i<scriptProcessor.datablockInfo.length; i++) {
                    this.datablocks.push(scriptProcessor.createStream(scriptProcessor.datablockInfo[i].data));
                }

                // create and prepare adapters
                await this.prepareContext(this.datablocks[0]);
                for (var i=0; i<scriptProcessor.adapterInfo.length; i++) {
                    var ai = scriptProcessor.adapterInfo[i];
                    var adapterTypeName = scriptProcessor.parseValue(ai.adapter).value;
                    var datablockId = scriptProcessor.parseValue(ai.datablock).value;
                    var adapter = this;
                    if (adapterTypeName != this.getInfo().name) {
                        adapter = this.addAdapter(Ps.Player.getAdapterType(adapterTypeName), datablockId);
                    }
                    await adapter.prepareContext(this.datablocks[datablockId]);
                }

                // ensure master sequence is at #0
                var seqId = scriptProcessor.sequenceInfo.findIndex(x => scriptProcessor.parseValue(x.adapter).value == this.getInfo().name);
                if (seqId > 0) {
                    for (var i=0; i<seqId; i++) {
                        var key = scriptProcessor.parseValue(scriptProcessor.sequenceInfo[i].name).value;
                        scriptProcessor.symbols[key].value++;
                    }
                    var seq = scriptProcessor.sequenceInfo.splice(seqId, 1)[0];
                    scriptProcessor.sequenceInfo.unshift(seq);
                }

                // create sequences
                for (var i=0; i<scriptProcessor.sequenceInfo.length; i++) {
                    var si = scriptProcessor.sequenceInfo[i];
                    var adapterTypeName = scriptProcessor.parseValue(si.adapter).value;
                    var adapter = this.adapters.find(x => x.adapter.getInfo().name == adapterTypeName).adapter;
                    var frames = [];
                    for (var j=0; j<si.frames.length; j++) {
                        var frj = si.frames[j];
                        var frame = new Ps.Frame();
                        frame.delta = scriptProcessor.parseValue(frj.delta).value;
                        for (var k=0; k<frj.commands.length; k++) {
                            var command = frj.commands[k];
                            var args = [];
                            for (var l=0; l<command.length; l++) {
                                args.push(scriptProcessor.parseValue(command[l]).value);
                            }
                            var stream = adapter.makeCommand(...args);
                            frame.commands.push(stream);
                        }
                        frames.push(frame);
                    }
                    var sequence = Ps.Sequence.fromFrames(frames, adapter);
                    this.sequences.push(sequence);
                }
                this.masterChannel.assign(0, this.sequences[0]);
            }
        }
        return errors;
    };

    Ps.Player.prototype.exportScript = function() {
        var arr = [];

        return arr.join('\n');
    };

    Ps.Player.schema = await Schema.build( { 'use-default-types': true } );

    var types = Ps.Player.schema.types;
    Ps.Player.symbols = {
        'Ps.Player': { 'type':types.get('uint8'), 'value': Ps.Player.Device.PLAYER },
        'Ps.Channel': { 'type':types.get('uint8'), 'value': Ps.Player.Device.CHANNEL },
        'Ps.EOF': { 'type':types.get('uint8'), 'value': Ps.Player.Commands.EOF },
        'Ps.EOS': { 'type':types.get('uint8'), 'value': Ps.Player.Commands.EOS },
        'Ps.Assign': { 'type':types.get('uint8'), 'value': Ps.Player.Commands.Assign },
        'Ps.Tempo': { 'type':types.get('uint8'), 'value': Ps.Player.Commands.Tempo }
    };

    // Ps.Player.createExt = async function createExt() {
    //     var player = Ps.Player.create();
    //     player.schema = await Schema.build(
    //         {
    //             'use-default-types': true
    //         }
    //     );
    //     return player;
    // };

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
    //publish(PlayerExt, 'PlayerExt', Ps);
})();