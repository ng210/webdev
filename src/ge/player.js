(function() {
	var fw = require('/frmwrk/fw.js');
	var ns_player = {

		Cmd_end:	   -1,
		Cmd_setTempo:	1,
		Cmd_assign:		2,
		
		Flg_active:		1,
		Flg_loop:		2,
		
		/******************************************************************************
		 * Prototype for the abstract player, base type for all players
		 *****************************************************************************/
		AbstractAdapter: function() {
			this.id = 'Abstract';
			this.version = 1;
		},
		/******************************************************************************
		 * Adapter of the player to handle channels, targets and sequences
		 *****************************************************************************/
		PlayerAdapter: function() {
			this.id = 'Player';
			this.version = 1;
		},

		/******************************************************************************
		 * Prototype of the Player object
		 *****************************************************************************/
		Player: function(fps, tpf) {
			this.adapters = new fw.Map();
			this.targets = new fw.Array();
			this.channels = new fw.Array();
			this.masterChannel = null;
			this.sequences = new fw.Array();
			this.framesPerSecond = fps || 25;
			this.ticksPerFrame = tpf || 1;
			this.refreshRate = 25;
			
			this.addAdapter(new ns_player.PlayerAdapter());
		},
		
		/******************************************************************************
		 * Prototype of the Command structure
		 *****************************************************************************/
		Command: function(delta, cmd, args) {
			this.delta = delta || 0;
			this.cmd = cmd || 0;
			this.args = args;
		},
		
		/******************************************************************************
		 * Prototype of the Channel structure
		 *****************************************************************************/
		Channel: function(player, target, sequence) {
			this.id = '';
			this.player = player;
			this.target = target;
			this.sequence = sequence;
			this.cursor = 0;
			this.status = 0;
			this.currentTick = 0;
			this.frame = 0;
		}

	};

	ns_player.AbstractAdapter.prototype.prepareObject = function(object) {
		// prepare object
	};
	ns_player.AbstractAdapter.prototype.processCommand = function(object, cmd) {
		// apply command on object
	};
	ns_player.PlayerAdapter.prototype = new ns_player.AbstractAdapter;
	ns_player.PlayerAdapter.prototype.processCommand = function(player, cmd) {
		switch (cmd.cmd) {
			case ns_player.Cmd_setTempo:
				//console.log('set tempo');
				player.framesPerSecond = cmd.args[0];
				player.ticksPerFrame = cmd.args[1];
				player.refreshRate = player.framesPerSecond * player.ticksPerFrame;
				break;
			case ns_player.Cmd_assign:
				//console.log('assign');
				var target = player.targets[cmd.args[0]];
				var sequence = player.sequences[cmd.args[1]];
				var status = cmd.args[2];
				// get an inactive channel
				var ix = -1;
				for (var i=0; i<player.channels.length; i++) {
					var chn = player.channels[i];
					if ((chn.status & ns_player.Flg_active) == 0) {
						ix = i;
						break;
					}
				}
				if (ix == -1) {
					// create new channel
					ix = player.channels.length;
					var chn = new ns_player.Channel();
					chn.id = ix;
					player.channels.push(chn);
					//console.log('create new channel #' + ix);
				}
				// else {
				// //console.log('assign channel #' + ix);
				// }
				var ch = player.channels[ix];
				// assign channel
				ch.set(player, target, sequence);
				ch.status = status;
				break;
		}
	};
	ns_player.Player.prototype.addAdapter = function(adapter) {
		// Look for an adapter with the same id
		var ad = this.adapters[adapter.id];
		// adapter not found or version is lower
		if (ad == null || ad.version < adapter.version) {
			this.adapters[adapter.id] = adapter;
			ad = adapter;
		}
		return ad;
	};
	ns_player.Player.prototype.addTarget = function(object, adapter) {
		var ad = this.adapters[adapter.id];
		if (ad == null || ad.version < adapter.version) {
			ad = this.addAdapter(adapter);
		}
		if (ad != null && ad.version >= adapter.version) {
			// add target
			this.targets.push([object, ad]);
			if (!ad.prepareObject) {
				throw 'Adapter has no prepareObject!';
			}
			ad.prepareObject(object);
		} else {
			throw 'Proper adapter version not found!';
		}
	};
	ns_player.Player.prototype.addSequence = function(sequence) {
		this.sequences.push(sequence);
		if (this.sequences.length == 1) {
			// the very first sequence is assigned to the master channel
			this.masterChannel = new ns_player.Channel(this, [this, this.adapters.Player], this.sequences[0]);
			this.masterChannel.id = 'master';
			this.masterChannel.status |= ns_player.Flg_active | ns_player.Flg_loop;
			this.channels.push(this.masterChannel);
		}
	};
	ns_player.Player.prototype.run = function(ticks) {
		// run master channel
		var chn = this.channels[0];
		if ((chn.status & ns_player.Flg_active) != 0) {
			chn.run(ticks);
		}
		if ((chn.status & ns_player.Flg_active) != 0) {
			//run every other hannel
			for (var i=1; i<this.channels.length; i++) {
				var chn = this.channels[i];
				if ((chn.status & ns_player.Flg_active) != 0) {
					chn.run(ticks);
				}
			}
		}
	};
	ns_player.Channel.prototype.set = function(player, target, sequence) {
		//console.log('set channel #' + this.id);
		this.player = player;
		this.target = target;
		this.sequence = sequence;
		this.cursor = 0;
		this.status = 0;
		this.currentTick = 0;
	};
	ns_player.Channel.prototype.run = function(ticks) {
		do {
			var restart = false;
			if (this.currentTick < this.sequence[this.cursor].delta) {
				// advance tick counter
				this.currentTick++;	// += ticks;
				break;
			}
			this.currentTick = 0;	//-= this.sequence[this.cursor].delta;
			// process command
			do {
				var cmd = this.sequence[this.cursor];
				if (cmd.cmd != ns_player.Cmd_end) {
					//console.log(this.id + ':' + this.cursor);
					this.target[1].processCommand(this.target[0], cmd);
					this.currentTick++
				} else {
					if ((this.status & ns_player.Flg_loop) != 0) {
						if (this == this.player.masterChannel) {
							this.player.channels = new fw.Array();
							this.player.channels.push(this);
						}
						// restart sequence
						this.cursor = 0;
						this.currentTick = 0;
						restart = true;
					//console.log(this.id + ': restart');
						break;
					} else {
						// deactivate channel
						if (this == this.player.masterChannel) {
							this.status &= ~ns_player.Flg_active;
						//console.log(this.id + ': deactivate');
						} // else remove channel 
						break;
					}
				}
				this.cursor++;
			} while (this.sequence[this.cursor].delta == 0);
		} while (restart);
	};

	module.exports = ns_player;
})();