include('/base/dbg.js');

include('/ge/sound.js');
include('/ge/player/player-lib.js');
include('/utils/syntax.js');
include('ui/notechart.js');

include('/synth/synth.js');
include('/synth/synth-adapter.js');
include('./synth-adapter-ext.js');
include('ui/synth-ui.js');

include('grammar.js');

var _synth = null;
var _synthCount = 3;
var _isRunning = false;
//var _config1 = null;
var _frame = 0;
var _presets = null;
var _presetSelect = null;
var _timer = null;
//var _lastNote = 0;
var _frame = 0;
//var _playerFrame = 0;
var _synths = [];
var _ledColor = [128, 160, 255];
var _player = null;
var _samplePerFrame = 0;
//var _cursor = 0;
var _buffer = new Float32Array(16*1024);


var _masterTune = 12;



var _patternConfig = {
    'width': 400,
    'height': 240,
    // 'grid-color': [0.5, 0.5, 0.5],
    'unit': [20, 12],
    'titlebar': 'Pattern1',
    'render-mode': 'bar2',
    'line-width': 0.1
};

var _patternUi = [];
var _patterns = [];

// resource handling
async function loadTemplate() {
    var res = await load('./ui/synth.tmpl.html');
    if (res.error instanceof Error) {
        alert(res.error);
        return;
    }
    _template = {};
    // envelope
    _template.env = res.node.querySelector('div.env');
    // osc
    _template.osc = res.node.querySelector('div.osc');
    // lfo
    _template.lfo = res.node.querySelector('div.lfo');
    // filter
    _template.flt = res.node.querySelector('div.flt');
    // synth1 (solo)
    _template.synth1 = buildSynthTemplate(res.node.querySelector('div.synth1'));
    // synth2 (bass)
    //_template.synth2 = buildSynthTemplate(res.node.querySelector('div.synth2'));
}
function buildSynthTemplate(synth) {
    var modules = synth.querySelector('.modules').children;
    for (var i=0; i<modules.length; i++) {
        var node = modules[i];
        var className = node.className.toLowerCase().split(' ')[0];
        var template = _template[className];
        if (template != undefined) {
            var lbl = node.id.split('}}')[1];
            node.innerHTML = template.innerHTML.replace(/{{id}}/g, lbl);
        }
    }
    synth.querySelector('div.osc').onclick = alert;
    return synth;
}
async function createSequences(path) {
    var res = await load(path);
    if (res.error instanceof Error) {
        throw res.error;
    }
    var sequences = [];
    var syntax = new Syntax(_grammar);
    var lines = res.data.split('\n');
    var i=0;
    while (i<lines.length) {
        var sequence = new Player.Sequence(psynth.SynthAdapter);
        while (i<lines.length) {
            var line = lines[i++];
            if (line.search(/^\s*\/\/|^\s*$/) == -1) {
                var expr = syntax.parse(line);
                if (expr.resolve().evaluate(sequence)) {
                    sequences.push(sequence);
                    break;
                }
            }
        }
    }
    Dbg.prln(`${sequences.length} sequences loaded.`);
    return sequences;
}

// UI
async function buildUi() {
    var tab = document.getElementById('modules');
    for (var i=0; i<_synthCount; i++) {
        var tr = document.createElement('TR');
        tab.appendChild(tr);

        // create synth
        var td = document.createElement('TD');
        var lbl = 'synth' + (i+1);
        psynth.SynthAdapter.devices[i].label = lbl;
        var synth = await createSynth(lbl, psynth.SynthAdapter.devices[i]);
        td.appendChild(synth);
        tr.appendChild(td);
        updateSynth(synth);

        // create pattern
        td = document.createElement('TD');
        await createPatternUi(i, td);
        tr.appendChild(td);
    }
}
async function createSynth(lbl, synth) {
    //var synth = new psynth.Synth(48000, voiceCount);
    voiceCount = synth.voices.length;
    _synths.push(synth);
    var synthElem = document.createElement('DIV');
    synthElem.id = lbl;
    synthElem.className = 'synth';
    synthElem.innerHTML = _template.synth1.innerHTML.replace(/{{id}}/g, lbl);
    synthElem.synth = synth;
    synth.element = synthElem;

    // set potmeters
    var pots = synthElem.getElementsByClassName('pot');
    for (var i=0; i<pots.length; i++) {
        Pot.bind(pots[i], synth);
    }
    // set waveform toggles
    var toggles = synthElem.querySelectorAll('toggle');
    for (var i=0; i<toggles.length; i++) {
        var toggle = toggles[i];
        toggle.bar = document.createElement('div');
        toggle.bar.className = 'toggle bar';
        toggle.appendChild(toggle.bar);
        toggle.onclick = toggleWaveform;
        toggle.value = psynth[toggle.getAttribute('value')];
        toggle.state = false;
        toggle.pot = synth.getControl(psynth.Ctrl[toggle.getAttribute('bind')]);
    }

    var select = synthElem.querySelector('select.preset');
    getPresets(select);
    select.onchange = selectPreset;
    synthElem.querySelector('.preset.save').onclick = savePreset;
    synthElem.querySelector('.preset.remove').onclick = removePreset;
    // todo: store and reload preset from local storage
    select.selectedIndex = 0;
    selectPreset({target:select});
    //synth.setup(_presets.default);

    var pot = synth.getControl(psynth.Ctrl.lfo2amp);
    pot.element.scale = 10;
    pot.max = 10;
    pot.element.innerHTML = pot.value * pot.element.scale;

    // create voices LEDs
    synth.voiceLeds = [];
    var tbl = synthElem.querySelector('#voiceLEDs') || document.createElement('table');
    tbl.id = lbl + 'VoiceLEDs';
    var tr =  document.createElement('tr');
    tbl.appendChild(tr);
    for (var i=0; i<voiceCount; i++) {
        var td = document.createElement('td');
        td.className = 'led';
        var led = document.createElement('div');
        led.className = 'led';
        synth.voiceLeds.push(led);
        td.appendChild(led);
        tr.appendChild(td);
    }
    synthElem.querySelector('div.voiceLEDs').appendChild(tbl);
    return synthElem;
}
function updateSynth(synthElem) {
    var style = window.getComputedStyle(synthElem);
    var match = style.backgroundColor.match(/\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    var color = match != null ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : _ledColor;
    synthElem.synth.color = Array.from(color);
    for (var i=0; i<3; i++) {
        color[i] = Math.floor(color[i] * 1.8);
        if (color[i] > 255) color[1] = 255;
    }
    synthElem.synth.voiceLeds.color = color;

    synthElem.onfocus = synthOnFocus;
    synthElem.onblur = synthOnBlur;
}
async function createPatternUi(id, el) {
    var lbl = `Pattern${id}`;
    var multiChart = new Ui.NoteChart(`${lbl}_chart`, _patternConfig, null);
    multiChart.title = lbl;
    multiChart.pattern = _patterns[id];
    multiChart.dataBind(multiChart.pattern.map);
    multiChart.selectChannel(psynth.SynthAdapter.SETNOTE);
    multiChart.onSet = multiChartOnSet;
    multiChart.onRemove = multiChartOnRemove;
    //var ix = _patternUi.length;
    _patternUi.push(multiChart);
    // var range = {start:0, end:255, step:1};
    // _patterns[ix].getRange(multiChart.selectedChannelId, range);
    // //multiChart.scroll(0, 0);
    // multiChart.uniforms.uMaxX.value = range.max[0];
    // //multiChart.uniforms.uRange[1] = range.max[1];
    await multiChart.render({'element': el});
    multiChart.toolbar.style.backgroundColor = `rgb(${_synths[id].color})`;
}
function multiChartOnSet(from, to) {
    this.__proto__.onSet.call(this, from, to);
    this.pattern.sequence.stream = psynth.SynthAdapter.fromDataSeries(this.dataSource).stream;
    this.updateDataPoints(from, to);
}
function multiChartOnRemove(from, to) {
    this.__proto__.onRemove.call(this, from, to);
    resetPlayer();
    this.pattern.sequence.stream = psynth.SynthAdapter.fromDataSeries(this.dataSource).stream;
    this.updateDataPoints(from, to);

}
function toggleWaveform(e) {
    var toggle = e.target.parentNode;
    toggle.state = !toggle.state;
    enableWaveform(toggle);
}
function enableWaveform(toggle, enable) {
    var waveform = toggle.pot.value;
    if (enable || toggle.state) {
        toggle.bar.style.opacity = '0.0';
        waveform |= toggle.value;
    } else {
        toggle.bar.style.opacity = '0.6';
        waveform &= ~toggle.value;
    }
    toggle.pot.set(waveform);
}

// program and misc.
function fillSoundBuffer(buffer, bufferSize) {
    //var samplesPerFrame = 48000 / SynthApp.player.refreshRate;
    var start = 0;
    var end = 0;
    var remains = bufferSize;
    for (var i=0; i<bufferSize; i++) {
        buffer[i] = .0;
    }
    while (remains) {
        if (_frame == 0) {
            update();
            _sum = 0;
            _frame = _samplePerFrame;
            //SynthApp.frameCounter = 48000 / SynthApp.player.refreshRate;
        }
        var len = _frame < remains ? _frame : remains;
        end = start + len;
        _frame -= len;
        for (var i=0; i<_player.channels.length; i++) {
            _player.channels[i].target.run(buffer, start, end);
        }
        start = end;
        remains -= len;
    }
    for (var i=0; i<bufferSize; i++) {
        _buffer[i] = buffer[i];
    }
}
function updateBpm() {
    // bpm 4th per minute => bpm*8/60 8th per second = bpm/7.5
    _samplePerFrame = Math.floor(48000*7.5/this.pot.value);
}

async function initializePlayer() {
    _player = new Player();
    // ADAPTERS
    // add adapter singletons
    _player.addAdapter(psynth.SynthAdapter);
    // initialize adapters: create targets and create context
    psynth.SynthAdapter.createTargets(_player.targets, new Uint8Array(
        [
                6, 
                psynth.SynthAdapter.DEVICE_SYNTH, 2,    // synth with 2 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 6,    // synth with 6 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 6,    // synth with 2 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 6,    // synth with 2 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 2,    // synth with 2 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 2,    // synth with 2 voices
        ]));

    //psynth.SynthAdapter.createContext();
    sound.init(48000, fillSoundBuffer);

    // SEQUENCES
    var sequences = await createSequences('res/demo02.seq');

    for (var i=0; i<_synthCount; i++) {
        var sequence = sequences[i % sequences.length];
        _patterns[i] = {
            map: psynth.SynthAdapter.toDataSeries(sequence),
            sequence: sequence
        };
        Dbg.prln(`Sequence channels: ${Object.keys(_patterns[i].map)}`);

        // create channel
        var channel = new Player.Channel(`channel${i}`, _player);
        channel.loopCount = 1000;
        channel.assign(_player.targets[i], _patterns[i].sequence);
        _player.channels.push(channel);
    }
}
function resetPlayer() {
    for (var i=0; i<_player.channels.length; i++) {
        _player.channels[i].reset();
    }
}

function update() {
    for (var i=0; i<_player.channels.length; i++) {
        _player.channels[i].run(1);
    }
}

function main(frame) {
    //if (_timer) clearTimeout(_timer);
    window.requestAnimationFrame(main);
    //_timer = setTimeout(main, 30, _frame);
    // paint voice LEDs
    for (var i=0; i<_synths.length; i++) {
        var synth = _synths[i];
        for (var j=0; j<synth.voiceLeds.length; j++) {
            var led = synth.voiceLeds[j];
            var a = synth.voices[j].envelopes[0].timer;
            led.style.backgroundColor = `rgba(${synth.voiceLeds.color.join()},${a})`;
        }
    }
    // paint oscillators
}

async function onpageload(e) {
    Dbg.init('con');
    if (e && e.length) {
        alert(e);
        return;
    }

    createUi();

    _startButton = document.getElementById('start');
    _startButton.onclick = function() {
        if (_isRunning) {
            sound.stop();
            _startButton.innerText = "Start";
            _isRunning = false;
        } else {
            sound.start();
            _startButton.innerText = "Stop";
            _isRunning = true;
        }
        sound.start;
    };
    var bpm = document.getElementById('bpm');
    bpm.onchange = updateBpm;
    _bpm = new psynth.Pot(0, 1, 0);
    Ui.Pot.bind(bpm, _bpm);
    updateBpm.call(bpm);
   
    document.getElementById('import').onclick = importPresets;
    document.getElementById('export').onclick = exportPresets;

    await loadTemplate();

    await loadPresets();

    await initializePlayer();

    await buildUi();
    
    main();
}