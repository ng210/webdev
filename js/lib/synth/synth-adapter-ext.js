include('/lib/player/iadapter-ext.js');
include('/lib/synth/synth-adapter.js');
// include('/lib/data/dataseries.js');
// include('/lib/data/stream.js');
// include('./synth-adapter.js');
// include('/lib/glui/glui-lib.js');

// Extensions to the synth-adapter
(function() {
    implements(psynth.SynthAdapter, Ps.IAdapterExt);

    psynth.SynthAdapter.initialize = function initialize() {
        var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H']
        for (var i=0; i<8; i++) {
            for (var j=0; j<notes.length; j++) {
                psynth.SynthAdapter.symbols[`Sy.${notes[j]}${i}`] = { 'type':uint8, 'value': i*12 + j };
            }
        }
    
        for (var i in psynth.Synth.controls) {
            psynth.SynthAdapter.symbols['Sy.'+i] = { 'type':uint8, 'value': psynth.Synth.controls[i] };
        }
    };

    psynth.SynthAdapter.prototype.makeCommand = function(command) {
        var stream = new Stream(128);
        stream.writeUint8(command);
        switch (command) {
            case psynth.SynthAdapter.Commands.SetNote:      // uint8 note, uint8 velocity
                var note = this.getUint8Argument(arguments, 0);
                var velocity = this.getUint8Argument(arguments, 1);
                stream.writeUint8(note);
                stream.writeUint8(velocity);
                break;
			case psynth.SynthAdapter.Commands.SetUint8:     // uint8 controllerId, uint8 value
			case psynth.SynthAdapter.Commands.SetFloat8:	// uint8 controllerId, uint8 value
                var controllerId = this.getUint8Argument(arguments, 0);
                var value = this.getUint8Argument(arguments, 1);
                stream.writeUint8(controllerId);
                stream.writeUint8(value);
				break;
            case psynth.SynthAdapter.Commands.SetUint16:	// uint8 controllerId, uint16 value
                var controllerId = this.getUint8Argument(arguments, 0);
                var value = this.getUint16Argument(arguments, 1);
                stream.writeUint8(controllerId);
                stream.writeUint16(value);
                break;
			case psynth.SynthAdapter.Commands.SetFloat:		// uint8 controllerId, float32 value
                var controllerId = this.getUint8Argument(arguments, 0);
                var value = this.getFloat32Argument(arguments, 1);
                stream.writeUint8(controllerId);
                stream.writeFloat32(value);
                break;
			case psynth.SynthAdapter.Commands.SetProgram:
                var programId = this.getUint8Argument(arguments, 0);
                stream.writeUint8(programId);
				break;
		}
		stream.buffer = stream.buffer.slice(0, stream.length);
        return stream;
    };
	psynth.SynthAdapter.prototype.makeSetCommandForController = function makeSetCommandForController(controlId, value) {
		var command = null;
		switch (controlId) {
		// out = uint8
			case psynth.Synth.controls.osc1note:
			case psynth.Synth.controls.osc1tune:
			case psynth.Synth.controls.osc1wave:
			case psynth.Synth.controls.osc2note:
			case psynth.Synth.controls.osc2tune:
			case psynth.Synth.controls.osc2wave:
			case psynth.Synth.controls.flt1mode:
				var uint8 = Math.floor(value);
				if (uint8 < 0) uint8 = 0; else if (uint8 > 255) uint8 = 255;
				command = this.makeCommand(psynth.SynthAdapter.Commands.SetUint8, controlId, uint8);
				break;
		
		// out = uint8/256
			case psynth.Synth.controls.amp:
			case psynth.Synth.controls.env1atk:
			case psynth.Synth.controls.env1dec:
			case psynth.Synth.controls.env1sus:
			case psynth.Synth.controls.env1rel:
			case psynth.Synth.controls.env2atk:
			case psynth.Synth.controls.env2dec:
			case psynth.Synth.controls.env2sus:
			case psynth.Synth.controls.env2rel:
			case psynth.Synth.controls.env3atk:
			case psynth.Synth.controls.env3dec:
			case psynth.Synth.controls.env3sus:
			case psynth.Synth.controls.env3rel:
			case psynth.Synth.controls.env4atk:
			case psynth.Synth.controls.env4dec:
			case psynth.Synth.controls.env4sus:
			case psynth.Synth.controls.env4rel:
			case psynth.Synth.controls.osc1psw:
			case psynth.Synth.controls.osc2psw:
			case psynth.Synth.controls.flt1cut:
			case psynth.Synth.controls.flt1res:
			case psynth.Synth.controls.flt1mod:
				var uint8 = Math.floor(value*255);
				if (uint8 < 0) uint8 = 0; else if (uint8 > 255) uint8 = 255;
				command = this.makeCommand(psynth.SynthAdapter.Commands.SetFloat8, controlId, uint8);
				break;
		
		// out = uint16
		
		// out = float32
			case psynth.Synth.controls.lfo1amp:
			case psynth.Synth.controls.lfo1dc:
			case psynth.Synth.controls.lfo1fre:
			case psynth.Synth.controls.lfo2amp:
			case psynth.Synth.controls.lfo2dc:
			case psynth.Synth.controls.lfo2fre:
			case psynth.Synth.controls.env1amp:
			case psynth.Synth.controls.env1dc:
			case psynth.Synth.controls.env2amp:
			case psynth.Synth.controls.env2dc:
			case psynth.Synth.controls.env3amp:
			case psynth.Synth.controls.env3dc:
			case psynth.Synth.controls.env4amp:
			case psynth.Synth.controls.env4dc:
			case psynth.Synth.controls.osc1amp:
			case psynth.Synth.controls.osc1fre:
			case psynth.Synth.controls.osc2amp:
			case psynth.Synth.controls.osc2fre:
			case psynth.Synth.controls.flt1amp:
				command = this.makeCommand(psynth.SynthAdapter.Commands.SetFloat, controlId, value);
				break;

			default:
				throw new Error('Unexpected control Id ' + controlId);
		}
		return command;
	};

    psynth.SynthAdapter.prototype.getSymbols = () => psynth.SynthAdapter.symbols;

    var uint8 = Ps.Player.schema.types.get('uint8');
    psynth.SynthAdapter.symbols = {
        // commands
		'Sy.SetNote':       { 'type':uint8, 'value': psynth.SynthAdapter.Commands.SetNote },
		'Sy.SetUint8':      { 'type':uint8, 'value': psynth.SynthAdapter.Commands.SetUint8 },
		'Sy.SetFloat8':     { 'type':uint8, 'value': psynth.SynthAdapter.Commands.SetFloat8 },
		'Sy.SetFloat':      { 'type':uint8, 'value': psynth.SynthAdapter.Commands.SetFloat },
		'Sy.SetVelocity':   { 'type':uint8, 'value': psynth.SynthAdapter.Commands.SetVelocity },
		'Sy.SetProgram':    { 'type':uint8, 'value': psynth.SynthAdapter.Commands.SetProgram },
        // devices
        'Sy.Synth':         { 'type':uint8, 'value': psynth.SynthAdapter.Device.SYNTH },
        'Sy.Delay':         { 'type':uint8, 'value': psynth.SynthAdapter.Device.DELAY },
        // synth controls
        'Sy.Sin':           { 'type':uint8, 'value': psynth.Osc.waveforms.SINUS },
        'Sy.Tri':           { 'type':uint8, 'value': psynth.Osc.waveforms.TRIANGLE },
        'Sy.Saw':           { 'type':uint8, 'value': psynth.Osc.waveforms.SAW },
        'Sy.Pls':           { 'type':uint8, 'value': psynth.Osc.waveforms.PULSE },
        'Sy.Rnd':           { 'type':uint8, 'value': psynth.Osc.waveforms.NOISE },

        'Sy.LowPass':       { 'type':uint8, 'value': psynth.Filter.modes.LOWPASS },
        'Sy.BandPass':      { 'type':uint8, 'value': psynth.Filter.modes.BANDPASS },
        'Sy.HighPass':      { 'type':uint8, 'value': psynth.Filter.modes.HIGHPASS },
    };


    // psynth.SynthAdapter.createExt = async function createExt() {
    //     var synthAdapterExt = psynth.SynthAdapter.create();
    //     synthAdapterExt.schema = await Schema.build(
    //         {
    //             'use-default-types': true
    //         }
    //     );
    //     return synthAdapterExt;
    // };

    //publish(SynthAdapterExt, 'SynthAdapterExt', psynth);

    // psynth.SynthAdapter.prototype.toDataSeries = function(sequence) {
    //     var noteMap = {};
    //     return Ps.IAdapterExt.toDataSeries.call(this, sequence,
    //         (cmd, stream) => cmd == psynth.SynthAdapter.SetNote ? cmd : stream.readUint8(),
    //         (cmd, delta, stream, ds) => {
    //             switch (cmd) {
    //                 case psynth.SynthAdapter.SetNote:
    //                     var pitch = stream.readUint8();
    //                     var velocity = stream.readUint8();
    //                     if (velocity != 0) {
    //                         // note on
    //                         noteMap[pitch] = ds.set([delta, pitch, velocity, delta]);
    //                         //series[psynth.SynthAdapter.SETVELOCITY].set([delta, velocity]);
    //                     } else {
    //                         // note off
    //                         var dataPoint = noteMap[pitch];
    //                         dataPoint[3] = delta - dataPoint[3];
    //                     }
    //                     break;
    //                 case psynth.SynthAdapter.SETCTRL8:
    //                     ds.set(delta, stream.readUint8());
    //                     break;
    //                 default:
    //                     throw new Error(`Unsupported command #${cmd}`);
    //             }
    //         }
    //     );
    // };

    // psynth.SynthAdapter.prototype.fromDataSeries = function(series, channelId) {
    //     var sequence = null;
    //     var keys = Object.keys(series);
    //     var f0 = 0, f1 = 0;
    //     var noteMap = {};
    //     var isEnd = false;
    //     var lastWrite = -1;
    //     var info = [];
    //     do {
    //         for (var k=0; k<keys.length; k++) {
    //             var key = parseInt(keys[k]);
    //             var ds = series[key];
    //             if (ds.data.length == 0) continue;
    //             if (info[k] == undefined) {
    //                 info[k] = ds.getInfo();
    //             }
    //             if (key == Ps.Player.EOS) {
    //                 isEnd = (f0 == info[k].max[0]);
    //                 continue;
    //             }
    //             if (key == psynth.SynthAdapter.SETVELOCITY) continue;
    //             if (channelId != undefined && channelId != k) continue;
    //             if (info[k].max[0] >= f0) {
    //                 var dataPoints = ds.get(f0);
    //                 for (var i=0; i<dataPoints.length; i++) {
    //                     if (sequence == null) {
    //                         sequence = new Ps.Sequence(this);
    //                         sequence.writeHeader();
    //                     }
    //                     // write delta
    //                     sequence.writeDelta(f0 - f1);
    //                     // make and write command
    //                     var dataPoint = Array.from(dataPoints[i]);
    //                     dataPoint[0] = key == psynth.SynthAdapter.SetNote ? key : psynth.SynthAdapter.SETCTRL8;
    //                     var cmd = sequence.adapter.makeCommand.apply(null, dataPoint);
    //                     sequence.stream.writeStream(cmd);
    //                     noteMap[dataPoint[1]] = f0 + dataPoint[3];
    //                 }
    //             }
    //         }
    //         sequence = sequence || new Ps.Sequence(this);
    //         for (var n in noteMap) {
    //             if (noteMap[n] == f0) {
    //                 if (lastWrite == sequence.cursor) {
    //                     sequence.writeDelta(f0 - f1);
    //                 }
    //                 sequence.writeCommand(psynth.SynthAdapter.SetNote);
    //                 sequence.stream.writeUint8(parseInt(n));
    //                 sequence.stream.writeUint8(0);
    //                 noteMap[n] = undefined;
    //             }
    //         }
    //         if (isEnd) {
    //             if (lastWrite == sequence.cursor) {
    //                 sequence.writeDelta(f0 - f1);
    //             }
    //             sequence.writeCommand(Ps.Player.EOS);
    //             break;
    //         }
    //         if (lastWrite != sequence.cursor) {
    //             sequence.writeEOF();
    //             lastWrite = sequence.cursor;
    //             f1 = f0;
    //         }
    //         f0++;
    //     } while (true);
    //     return sequence;
    // };

    // psynth.SynthAdapter.prototype.createDialog = function(type) {
    //     var ui = psynth.SynthAdapter.dialogs[type];
    //     if (!ui) {
    //         throw new Error(`Invalid dialog type ${type}!`);
    //     }
    //     switch (type) {
    //         case 'device':
    //             ui.items.id.setValue(`device${('0' + (this.devices.length+1)).slice(-2)}`);
    //             break;
    //         case 'sequence':
    //             break;
    //     }
        
    //     return ui;
    // };

    // psynth.SynthAdapter.prototype.createDeviceUi = function(device) {
    //     var ui = new Ui.Synth(device.id);
    //     ui.dataBind(device);
    //     ui.addClass('synth');
    //     return ui;
    // };

    // psynth.SynthAdapter.prototype.createSequenceUi = function(sequence) {
    //     var series = this.toDataSeries(sequence);
    //     var template = {
    //         'width': 1200,
    //         'height': 600,
    //         'unit': [32, 24],
    //         'grid-color': [0.2, 0.4, 0.6],
    //         'titlebar': '',
    //         'line-width': 0.1,
    //         'path': '/synth/ui',
    //         'data-source': series
    //     };
    //     return new Ui.NoteChart(sequence.id, template, null);    // : new Ui.MultiChart(id, template, null);
    // };

    // /* Dialogs ***************************************************************/
    // function NewDevice() {
    //     Ui.Board.call(this, 'new-device', {
    //         "titlebar": false,
    //         "layout": "free",
    //         "items": {
    //             "type": { "label": "Device type", "type": "ddlist", "item-key": false, "item-value": "$key" },
    //             "id": { "label": "Id", "type": "textbox", "value": '', "events": ["change"] },
    //             "voices": { "label": "Voices", "type": "pot", "min": 1, "max": 16, "step": 1, "value": 1, "digits": 2 }
    //         }
    //     });
    //     this.items.type.setItems( ['Synth'] );
    //     this.items.voices.setVisible(false);
    // }
    // extend(Ui.Board, NewDevice);

    // NewDevice.prototype.onchange = function(e) {
    //     if (e.control == this.items.type) {
    //         this.items.voices.setVisible(true);
    //     }
    // };

    // NewDevice.prototype.getData = function() {
    //     var initData = new Stream(1);
    //     initData.writeUint8(this.items.voices.getValue());
    //     var result = {
    //         type: this.items.type.getValue(),
    //         data: new Uint8Array(initData.buffer)
    //     };
    //     return result;
    // };

    // function NewSequence() {
    //     Ui.Board.call(this, 'new-sequence', {
    //         "titlebar": false,
    //         "layout": "free",
    //         "items": {
    //             "type": { "label": "Type", "type": "ddlist", "item-key": false, "item-value": "$key" },
    //             "id": { "label": "Id", "type": "textbox", "value": 'sequence', "events": ["change"] },
    //             "device": { "label": "Device type", "type": "ddlist", "item-key": "$key", "item-value": false }
    //         }
    //     });
    //     this.items.type.setItems( ['Notes', 'Controller'] );
    //     this.items.device.setItems( psynth.SynthAdapter.Device );
    // }
    // extend(Ui.Board, NewSequence);

    // NewSequence.prototype.getData = function() {
    //     var result = {
    //         type: this.items.type.getValue(),
    //         device: this.items.device.getValue(),
    //     };
    //     return result;
    // };


    // psynth.SynthAdapter.dialogs = {
    //     'device': new NewDevice(),
    //     'sequence': new NewSequence()
    // };
})();