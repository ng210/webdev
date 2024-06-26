include('/lib/player/player-lib.js');
include('/lib/synth/synth.js');
include('/lib/ge/sound.js');

(function() {
	function SynthAdapter(player) {
		SynthAdapter.base.constructor.call(this, player);
		this.frame = 0;
		this.samplePerFrame = 0;
	}
	extend(Ps.IAdapter, SynthAdapter);

	// IAdapter implementation
	SynthAdapter.prototype.getInfo = function() { return psynth.SynthAdapter.info; };
	SynthAdapter.prototype.prepareContext = function prepareContext(data) {
		var sampleRate = data.readUint16();
		sound.init(sampleRate, (left, right, bufferSize) => this.fillSoundBuffer(left, right, bufferSize));
		// default bpm = 80
		this.samplePerFrame = sampleRate*3.75/80;
		SynthAdapter.base.prepareContext.call(this, data);
	};
	SynthAdapter.prototype.createDeviceImpl = function createDeviceImpl(deviceType, initData) {
		var device = null;
		switch (deviceType) {
			case psynth.SynthAdapter.Device.SYNTH:
				var voiceCount = initData.readUint8();
				if (voiceCount != 0) {
					device = new psynth.Synth(sound.sampleRate, voiceCount);
					device.setSoundBank(this.player.datablocks[initData.readUint8()]);
					device.setProgram(initData.readUint8());
				}
				break;
			case psynth.SynthAdapter.Device.DELAY:
				// todo: add presets
				device = new psynth.Delay(sound.sampleRate);
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
			case psynth.SynthAdapter.Commands.SetNote:
				device.setNote(sequence.getUint8(cursor++), sequence.getUint8(cursor++)/255);
				break;
			case psynth.SynthAdapter.Commands.SetUint8:
				device.setControl(sequence.getUint8(cursor++), sequence.getUint8(cursor++));
				break;
			case psynth.SynthAdapter.Commands.SetFloat8:
				device.setControl(sequence.getUint8(cursor++), sequence.getUint8(cursor++)/256);
				break;
			// case psynth.SynthAdapter.Commands.SETCTRL16:
			// 	device.setControl(sequence.getUint8(cursor++), sequence.getUint16(cursor));
			// 	cursor += 2;
			// 	break;
			case psynth.SynthAdapter.Commands.SetFloat:
				device.setControl(sequence.getUint8(cursor++), sequence.getFloat32(cursor));
				cursor += 4;
				break;
			case psynth.SynthAdapter.Commands.SetProgram:
				device.setProgram(sequence.getUint8(cursor++));
				break;
		}
		return cursor;
	};
	SynthAdapter.prototype.setRefreshRate = function updateRefreshRate(fps) {
		this.samplePerFrame = sound.sampleRate/fps;
	};

	SynthAdapter.getInfo = () => SynthAdapter.info;
	SynthAdapter.create = player => Reflect.constructor(psynth.SynthAdapter, [player]);
	SynthAdapter.info = { name: 'SynthAdapter', id: 1 };

	SynthAdapter.Commands = {
		SetNote: 2,
		SetUint8: 3,
		SetFloat8: 4,
		// SETUINT16 = 4;
		SetFloat: 5,
		SetVelocity: 6,
		SetProgram: 7
	};
	
	SynthAdapter.Device = {
		SYNTH: 0,
		DELAY: 1
	};

	SynthAdapter.prototype.fillSoundBuffer = function(left, right, bufferSize) {
		var start = 0;
		var end = 0;
		var player = this.player;
		var remains = bufferSize;
		for (var i=0; i<bufferSize; i++) {
			left[i] = .0;
			right[i] = .0;
		}
		while (remains) {
			var frameInt = Math.floor(this.frame);
			if (frameInt == 0) {
				if (!player.run(1)) {
					player.restart();
				}
				this.frame += this.samplePerFrame;
			}
			var len = this.frame < remains ? frameInt : remains;
			end = start + len;
			this.frame -= len;
			for (var i=0; i<this.devices.length; i++) {
				this.devices[i].run(left, right, start, end);
			}
			start = end;
			remains -= len;
		}
		return player.isActive;
	};


	publish(SynthAdapter, 'SynthAdapter', psynth);

})();
