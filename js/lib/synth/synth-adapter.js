include('/lib/player/player-lib.js');
include('/lib/synth/synth.js');
include('/lib/ge/sound.js');

(function() {
	function SynthAdapter(player) {
		SynthAdapter.base.constructor.call(this, player);
		SynthAdapter.player = player;
	}
	extend(Ps.IAdapterExt, SynthAdapter);

	// IAdapter implementation
	SynthAdapter.prototype.prepareContext = function prepareContext(data) {
		sound.init(data.readUint16(), this.fillSoundBuffer);
		SynthAdapter.base.prepareContext.call(this, data);
	};
	SynthAdapter.prototype.createDeviceImpl = function createDeviceImpl(deviceType, initData) {
		var device = null;
		switch (deviceType) {
			case psynth.SynthAdapter.Device.SYNTH:
				var voiceCount = initData.readUint8();
				if (voiceCount != 0) {
					device = new psynth.Synth(sound.smpRate, voiceCount);
					device.soundBank = this.player.datablocks[initData.readUint8()];
					device.setProgram(0);
				}
				break;
			case psynth.SynthAdapter.Device.DELAY:
				// todo: add presets
				device = new psynth.Delay(sound.smpRate);
				break;
			default:
				throw new Error(`Invalid device type: ${deviceType}`);
		}
		return device;
	};
	SynthAdapter.prototype.processCommand = function processCommand(channel, command) {
        var device = channel.device;
        var sequence = channel.sequence;
        var cursor = channel.cursor;
		switch (command) {
			case psynth.SynthAdapter.Commands.SETNOTE:
				device.setNote(sequence.getUint8(cursor++), sequence.getUint8(cursor++)/256);
				break;
			case psynth.SynthAdapter.Commands.SETUINT8:
				device.setControl(sequence.getUint8(cursor++), sequence.getUint8(cursor++));
				break;
			case psynth.SynthAdapter.Commands.SETFLOAT8:
				device.setControl(sequence.getUint8(cursor++), sequence.getUint8(cursor++)/256);
				break;
			// case psynth.SynthAdapter.Commands.SETCTRL16:
			// 	device.setControl(sequence.getUint8(cursor++), sequence.getUint16(cursor));
			// 	cursor += 2;
			// 	break;
			case psynth.SynthAdapter.Commands.SETFLOAT:
				device.setControl(sequence.getUint8(cursor++), sequence.getFloat32(cursor));
				cursor += 4;
				break;
			case psynth.SynthAdapter.Commands.SETPROGRAM:
				device.setProgram(sequence.getUint8(cursor++));
				break;
		}
		return cursor;
	};

	// IAdapterExt implementation
    SynthAdapter.prototype.makeCommand = function(command) {
        var stream = new Stream(128);
        stream.writeUint8(command);
        switch (command) {
            case psynth.SynthAdapter.Commands.SETNOTE:	// uint8 note, uint8 velocity
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 2);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeUint8(arguments[2]);
                }
                break;
			case psynth.SynthAdapter.Commands.SETUINT8:	// uint8 controllerId, uint8 value
			case psynth.SynthAdapter.Commands.SETFLOAT8:	// uint8 controllerId, uint8 value
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 2);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeUint8(arguments[2]);
                }
				break;
            // case psynth.SynthAdapter.Commands.SETCTRL16:	// uint8 controllerId, uint16 value
            //     if (arguments[1] instanceof Ps.Sequence) {
            //         stream.writeStream(arguments[1].stream, arguments[2], 3);
            //     } else {
            //         stream.writeUint8(arguments[1]);
            //         stream.writeUint16(arguments[2]);
            //     }
            //     break;
			case psynth.SynthAdapter.Commands.SETFLOAT:		// uint8 controllerId, float32 value
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 5);
                } else {
                    stream.writeUint8(arguments[1]);
					stream.writeFloat32(arguments[2]);
                }
                break;
			case psynth.SynthAdapter.Commands.SETPROGRAM:
				if (arguments[1] instanceof Ps.Sequence) {
					stream.writeStream(arguments[1].stream, arguments[2], 1);
				} else {
					stream.writeUint8(arguments[1]);
				}				
				break;
		}
		stream.buffer = stream.buffer.slice(0, stream.length);
        return stream;
    };

	SynthAdapter.prototype.makeSetCommandForController = function makeSetCommandForController(controlId, value) {
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
				command = this.makeCommand(psynth.SynthAdapter.Commands.SETUINT8, controlId, uint8);
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
				command = this.makeCommand(psynth.SynthAdapter.Commands.SETFLOAT8, controlId, uint8);
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
				command = this.makeCommand(psynth.SynthAdapter.Commands.SETFLOAT, controlId, value);
				break;

			default:
				throw new Error('Unexpected control Id ' + controlId);
				break;
		}
		return command;
	};

	SynthAdapter.getInfo = () => SynthAdapter.info;
	SynthAdapter.create = player => Reflect.constructor(psynth.SynthAdapter, [player]);
	SynthAdapter.info = { name: 'SynthAdapter', id: 1 };

	SynthAdapter.Commands = {
		SETNOTE: 2,
		SETUINT8: 3,
		SETFLOAT8: 4,
		// SETUINT16 = 4;
		SETFLOAT: 5,
		SETVELOCITY: 6,
		SETPROGRAM: 7
	};
	
	SynthAdapter.Device = {
		SYNTH: 0,
		DELAY: 1
	};

	SynthAdapter.frame = 0;
	SynthAdapter.samplePerFrame = 0;
	SynthAdapter.player = null;
	SynthAdapter.prototype.fillSoundBuffer = function(left, right, bufferSize) {
		var start = 0;
		var end = 0;
		var remains = bufferSize;
		for (var i=0; i<bufferSize; i++) {
			left[i] = .0;
			right[i] = .0;
		}
        while (remains) {
            var frameInt = Math.floor(SynthAdapter.frame);
            if (frameInt == 0) {
                if (!SynthAdapter.player.run(1)) {
					SynthAdapter.player.reset();
					SynthAdapter.player.run(0);
                }
                SynthAdapter.frame += SynthAdapter.samplePerFrame;
            }
            var len = SynthAdapter.frame < remains ? frameInt : remains;
            end = start + len;
            SynthAdapter.frame -= len;
            var adapter = SynthAdapter.player.adapters[psynth.SynthAdapter.getInfo().id];
            for (var i=0; i<adapter.devices.length; i++) {
                adapter.devices[i].run(left, right, start, end);
            }
            start = end;
            remains -= len;
        }
	};


	publish(SynthAdapter, 'SynthAdapter', psynth);

})();
