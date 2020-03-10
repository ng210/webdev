include('/ge/player/player.js');
include('/ge/player/iadapter.js');
include('/synth/synth.js');
include('/ge/sound.js');

(function() {
	function SynthAdapter() {
		this.devices = [];
	}
	SynthAdapter.prototype = Player.IAdapter;
    SynthAdapter.prototype.getInfo = function() { return psynth.SynthAdapter.info; },
	//registerCommands: function(registry) { throw new Error('Not implemented!'); },
	SynthAdapter.prototype.prepareContext = function(data) {
		sound.init(48000, data.callback);
	};
	SynthAdapter.prototype.addTargets = function(targets, data) {
		var cursor = 0;
		var deviceCount = data[cursor++];
		for (var i=0; i<deviceCount; i++) {
			var device = null;
			switch (data[cursor++]) {
				case psynth.SynthAdapter.DEVICE_SYNTH:
					var voiceCount = data[cursor++];
					// todo: sound banks
					device = new psynth.Synth(48000, voiceCount);
					break;
			}
			psynth.SynthAdapter.devices.push(device);	
			targets.push(device);
		}
	};
	SynthAdapter.prototype.processCommand = function(target, command, sequence, cursor) {
		switch (command) {
				case psynth.SynthAdapter.SETNOTE:
				target.setNote(sequence.getUint8(cursor++), sequence.getUint8(cursor++)/256);
				break;
			case psynth.SynthAdapter.SETCTRL8:
				target.setControl(sequence.getUint8(cursor++), sequence.getUint8(cursor++));
				break;
			case psynth.SynthAdapter.SETCTRL16:
				target.setControl(sequence.getUint8(cursor++), sequence.getUint16(cursor));
				cursor += 2;
				break;
			case psynth.SynthAdapter.SETCTRLF:
				target.setControl(sequence.getUint8(cursor++), sequence.getFloat32(cursor));
				cursor += 4;
				break;
		}
		return cursor;
	};
	//updateRefreshRate: function(target, command) { },
	
	psynth.SynthAdapter = new SynthAdapter();

	psynth.SynthAdapter.SETNOTE = 2;
	psynth.SynthAdapter.SETCTRL8 = 3;
	psynth.SynthAdapter.SETCTRL16 = 4;
	psynth.SynthAdapter.SETCTRLF = 5;
	psynth.SynthAdapter.SETVELOCITY = 6;

	psynth.SynthAdapter.DEVICE_SYNTH = 0;
	psynth.SynthAdapter.DEVICE_DELAY = 1;

	psynth.SynthAdapter.info = {
			name: 'SynthAdapter',
			id: 1
	};

})();