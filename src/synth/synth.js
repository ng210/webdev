include('frmwrk/fw.js');

include('ge/synth.js');
include('ge/player.js');
include('ge/synthAdapter.js');
include('ge/sound.js');

//var load = require('/base/load.js');
var ns_synth = require('/ge/synth.js');
var ns_player = require('/ge/player.js');
var sound = require('/ge/sound.js');
var SynthAdapter = require('/ge/synthAdapter.js');

var g_frameCounter = 0;
var g_player = null;
var g_synth = null;

function createPlayer() {
	var player = new ns_player.Player();
	var mainSeq = [
		new ns_player.Command(  0, ns_player.Cmd_setTempo, [10, 4]),		// set fps to 5, tpf to 1 (makes 5 tps)
		new ns_player.Command(  0, ns_player.Cmd_assign, [0, 1, 1 | 2]),	// connect target #0 with sequence #1 with status active
		new ns_player.Command( 64, ns_player.Cmd_end, null)					// end
	];
	var subSeq1 = [
		new ns_player.Command(   0, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 0
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 2
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [24, 0.7]),	// 4
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 6
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 0
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 2
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [15, 0.7]),	// 4
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [17, 0.7]),	// 6
		new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   4, ns_player.Cmd_end, null)				// 0
	];
	// the very first sequence is the master that spawns all the channels
	player.addSequence(mainSeq);
	player.addSequence(subSeq1);

	return player;
}

function createSynth() {
	var synth = new ns_synth.Synth(48000);
	synth.setup([
		ns_synth.Ctrl.amp, 0.6,
		ns_synth.Ctrl.Lfo1fre, 5.1,     ns_synth.Ctrl.Lfo1amp, 0.2,	ns_synth.Ctrl.Lfo1wav, ns_synth.WF_SIN,
		ns_synth.Ctrl.Lfo2fre, 1.0,     ns_synth.Ctrl.Lfo2amp, 1.0,	ns_synth.Ctrl.Lfo2wav, ns_synth.WF_SIN,

		ns_synth.Ctrl.Env1atk, 0.01,    ns_synth.Ctrl.Env1dec, 0.10,
		ns_synth.Ctrl.Env1sus, 0.2,     ns_synth.Ctrl.Env1rel, 0.2,
		ns_synth.Ctrl.Env1off, 0.0,     ns_synth.Ctrl.Env1amp, 0.8,

		ns_synth.Ctrl.Env2atk, 0.0,	ns_synth.Ctrl.Env2dec, 0.05,
		ns_synth.Ctrl.Env2sus, 0.5,	ns_synth.Ctrl.Env2rel, 0.5,
		ns_synth.Ctrl.Env2off, 1.0,	ns_synth.Ctrl.Env2amp, 1.0,

		ns_synth.Ctrl.Osc1wav, ns_synth.WF_TRI,
		ns_synth.Ctrl.Osc1fre, 6.0,	ns_synth.Ctrl.Osc1amp, 0.6,	ns_synth.Ctrl.Osc1psw, 0.6,
		ns_synth.Ctrl.Osc1tun, 12.0,
		ns_synth.Ctrl.Osc2wav, ns_synth.WF_PLS,
		ns_synth.Ctrl.Osc2fre, 0.8,	ns_synth.Ctrl.Osc2amp, 0.4,	ns_synth.Ctrl.Osc2psw, 0.3,
		ns_synth.Ctrl.Osc2tun, 12
	]);
	return synth;
}

function Pot(el, synth) {
	el.pot = this;
	// el.onmouseover = Pot.onmouseover;
	// el.onmouseout = Pot.onmouseout;
	// el.onclick = Pot.onclick;
	el.onmousedown = Pot.onmousedown;
	el.onmouseup = Pot.onmouseup;	this.min = parseFloat(el.min) || 0;

	this.el = el;
	this.min = parseFloat(el.getAttribute('min')) || 0;
	this.max = parseFloat(el.getAttribute('max')) || 1;
	this.scale = parseFloat(el.getAttribute('scale')) || 100;
	this.synth = synth;
	var id = this.el.id.split('_')[1];
	this.ctrlId = ns_synth.Ctrl[id];
	this.set(this.synth.getControl(this.ctrlId));
}

Pot.prototype.set = function(value) {
	if (value < this.min) {
		value = this.min;
	}
	if (value > this.max) {
		value = this.max;
	}
	this.el.innerHTML = Math.floor(value * this.scale);
	this.synth.setControl(this.ctrlId, value);
}
Pot.selectedItem = null;
Pot.oldOnMouseMove = null;
Pot.oldOnMouseUp = null;
Pot.dragPoint = [0, 0];
Pot.dragSpeed = 0.5;
// Pot.onmouseover = function(e) {
// 	e.pot.onmouseover(e);
// };
// Pot.onmouseout = function(e) {
// 	e.pot.onmouseover(e);
// };
Pot.onmousedown = function(e) {
	if (Pot.selectedItem != null) {
		Pot.selectedItem.style.border = 'none';
	}
	Pot.selectedItem = e.target;
	Pot.dragPoint[0] = e.screenX;
	Pot.dragPoint[1] = e.screenY;
	Pot.selectedItem.style.border = 'solid 1px #4060a0';
	Pot.oldOnMouseMove = document.onmousemove;
	document.onmousemove = Pot.onmousemove;
	document.onmouseup = Pot.onmouseup;
	e.preventDefault();
};
Pot.onmouseup = function(e) {
	document.onmousemove = Pot.oldOnMouseMove;
	document.onmouseup = Pot.oldOnMouseUp;
	e.preventDefault();
};
Pot.onmousemove = function(e) {
	//var deltaX = e.screenX - Pot.dragPoint[0];
	var deltaY = e.screenY - Pot.dragPoint[1];
	var sgn = deltaY < 0 ? 1 : -1;
	//Pot.dragPoint[0] = e.screenX;
	var pot = Pot.selectedItem.pot;
	Pot.dragPoint[1] = e.screenY;
	var delta = Pot.dragSpeed/pot.scale * sgn * deltaY*deltaY;
	pot.set(pot.synth.getControl(pot.ctrlId) + delta);
};

function createSynthUI(lbl, synth) {
	var tmpl = load('./synth.tmpl.html');
	var envTmpl = tmpl.getElementsByClassName('env')[0];
	var oscTmpl = tmpl.getElementsByClassName('osc')[0];
	var lfoTmpl = tmpl.getElementsByClassName('lfo')[0];

	var synthEl = document.getElementById(lbl);

	var env = envTmpl.cloneNode();
	env.id = lbl + '_Env1';
	env.innerHTML = envTmpl.innerHTML.replace(/{{id}}/g, lbl + '_Env1');
	synthEl.appendChild(env);
	env = envTmpl.cloneNode();
	env.id = lbl + '_Env2';
	env.innerHTML = envTmpl.innerHTML.replace(/{{id}}/g, lbl + '_Env2');
	synthEl.appendChild(env);

	var osc = oscTmpl.cloneNode();
	osc.id = lbl + '_Osc1';
	osc.innerHTML = oscTmpl.innerHTML.replace(/{{id}}/g, lbl + '_Osc1');
	synthEl.appendChild(osc);
	osc = oscTmpl.cloneNode();
	osc.id = lbl + '_Osc2';
	osc.innerHTML = oscTmpl.innerHTML.replace(/{{id}}/g, lbl + '_Osc2');
	synthEl.appendChild(osc);

	var lfo = lfoTmpl.cloneNode();
	lfo.id = lbl + '_Lfo1';
	lfo.innerHTML = lfoTmpl.innerHTML.replace(/{{id}}/g, lbl + '_Lfo1');
	synthEl.appendChild(lfo);
	lfo = lfoTmpl.cloneNode();
	lfo.id = lbl + '_Lfo2';
	lfo.innerHTML = lfoTmpl.innerHTML.replace(/{{id}}/g, lbl + '_Lfo2');
	synthEl.appendChild(lfo);

	var pots = synthEl.getElementsByClassName('pot');
	for (var i=0; i<pots.length; i++) {
		var pot = new Pot(pots[i], synth);
	}

	// for (var i=0; i<synth.envelopes.length; i++) {
	// 	var envEl = 
	// }
	// for (var i=0; i<synth.oscillators.length; i++) {
		
	// }
	// for (var i=0; i<synth.lfos.length; i++) {
		
	// }
}

function fillSoundBuffer(buffer, bufferSize) {
	var samplesPerFrame = 48000 / g_player.refreshRate;
	var start = 0;
	var end = 0;
	var remains = bufferSize;
	while (remains) {
		if (g_frameCounter == 0) {
			g_player.run(1);
			g_frameCounter = samplesPerFrame;
		}
		var len = g_frameCounter < remains ? g_frameCounter : remains;
		end = start + len;
		g_frameCounter -= len;
		g_synth.run(buffer, start, end);
		start = end;
		remains -= len;
	}
}

function onpageload(e) {
    var content = document.getElementById('content');
    // g_logger = new Logger({
    //     format: '<small><b>{{level}}</b> - <i>{{file}}::{{method}}</i>({{line}})</small> - ' +
    //             '<tt>{{message}}</tt></br>',
    //             //'<div style="font-size: large; background-color: silver; margin: 0px; padding: 0px"><tt>{{message}}</tt></div>',
    //     level: 'info',
    //     print: {
    //         context: null,
    //         method: function(data) {
    //             content.innerHTML += data;
    //         }
    //     }
	// });
	g_synth = createSynth();
	createSynthUI('synth1', g_synth);
	//createSynthUI('synth2', g_synth);
	
	g_player = createPlayer();

	g_player.addTarget(g_synth, new SynthAdapter());
	
	sound.init(48000, fillSoundBuffer);
}