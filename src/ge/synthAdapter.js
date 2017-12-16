include('ge/player.js');
(function() {
	var ns_player = require('/ge/player.js');

	var synthAdapter = function() {
		this.id = 'SynthAdapter';
		this.version = 1;
	}
	synthAdapter.Cmd_setNote = 0;
	synthAdapter.Cmd_setCtrl = 1;

	synthAdapter.prototype = new ns_player.AbstractAdapter;
	synthAdapter.prototype.prepareObject = function(synth) {
		;
	};
	synthAdapter.prototype.processCommand = function(synth, cmd) {
		switch (cmd.cmd) {
			case synthAdapter.Cmd_setNote:
				synth.setNote(cmd.args[0], cmd.args[1]);
				break;
			case synthAdapter.Cmd_setCtrl:
				synth.setControl(cmd.args[0], cmd.args[1]);
				break;
		}
	};
	module.exports=synthAdapter;
})();