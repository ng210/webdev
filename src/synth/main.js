include('/base/dbg.js');

include('grammar.js');
include('/utils/syntax.js');

include('/synth/synth.js');

include('/ge/player/player-lib.js');
include('/synth/synth-adapter.js');
include('./synth-adapter-ext.js');

include('ui/notechart.js');
include('ui/synth-ui.js');

var _ui = null;
var _synths = [];
var _series = null;
var _player = null;
var _selected = 0;
var _frame = 0;
var _samplePerFrame = 0;
var _settings = {
    'isRunning': true,
    'bpm': 60,
    'samplingRate': 24000
};

/*****************************************************************************/
async function createSequences(path) {
    var res = await load(path);
    if (res.error instanceof Error) {
        throw res.error;
    }
    var sequences = [];
    var syntax = new Syntax(_grammar, false);
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
async function loadSequence(url) {
    _series = [];
    var sequences = await createSequences('res/demo01.seq');
    for (var i=0; i<sequences.length; i++) {
        _player.sequences.push(sequences[i]);
        _series.push(psynth.SynthAdapter.toDataSeries(sequences[i]));
    }
    return _series;
}

/*****************************************************************************/
async function createUi() {
    var ui = new Ui.Panel('ui', {
        titlebar: false,
        layout:'horizontal',
        css: 'main',
        split: [20, 80],
        fixed: true,
        items: {
            'modules': {
                type: 'board',
                titlebar: false,
            },
            'editors': {
                type: 'panel',
                css: 'editors',
                titlebar: false,
                layout: 'vertical',
                //split: [30, 50, 20]
           }
        }
    });
    return ui;
}
function createSynth(voiceCount) {
    // create synth
    //var synth = new psynth.Synth(_settings.samplingRate, 3);
    psynth.SynthAdapter.addTargets(_player.targets, new Uint8Array([1, psynth.SynthAdapter.DEVICE_SYNTH, voiceCount]));
    var synth = _player.targets[_player.targets.length-1];
    var si = _synths.length;

    _synths.push(synth);
    // create synth ui
    var id = `synth${('0' + si).slice(-2)}`;
    var synthUi = new Ui.Synth(id);
    synthUi.addClass('synth');
    synthUi.dataBind(synth);
    _ui.items.modules.add(id, synthUi);
    synthUi.changePreset(synthUi.preset);
    synthUi.titleBar.onclick = onSelectChannel;
    
    // create channel
    var channel = new Player.Channel(`channel${si}`, _player);
    channel.loopCount = 0;
    channel.assign(_player.targets[si], _player.sequences[si]);
    _player.channels.push(channel);

    return synthUi;
}
function createEditor(isNote) {
    var template = {
        'width': 1200,
        'height': 600,
        'unit': [32, 24],
        'grid-color': [0.2, 0.4, 0.6],
        'titlebar': '',
        'line-width': 0.1,
        'path': '/synth/ui'
    };
    var id = `ed${('0'+_ui.items.editors.count).slice(-2)}`;
    var editor = isNote ? new Ui.NoteChart(id, template, null) : new Ui.MultiChart(id, template, null);
    editor.onSet = multiChartOnSet;
    editor.onRemove = multiChartOnRemove;

    _ui.items.editors.add(id, editor);
    return editor;
}
function multiChartOnSet(from, to) {
    //this.__proto__.onSet.call(this, from, to);
    //console.log('onset: ' + [from, to]);
    var dx = Math.abs(to[0] - from[0]) + 1;
    var dy = Math.abs(to[1] - from[1]) + 1;
    var velocity = 60;  //Math.floor(255 * dy * this.uniforms.uUnit.value[1]/this.uniforms.uSize.value[1]);
    var note = [from[0], from[1], velocity, dx];
    this.series.set(note);
    //console.log('custom: [' + note +']');

    // this.pattern.sequence.stream = psynth.SynthAdapter.fromDataSeries(this.dataSource).stream;
    // this.updateDataPoints(from, to);
}

function multiChartOnRemove(from, to) {
    this.__proto__.onRemove.call(this, from, to);
    console.log('onremove: ' + [from, to]);
    // resetPlayer();
    // this.pattern.sequence.stream = psynth.SynthAdapter.fromDataSeries(this.dataSource).stream;
    // this.updateDataPoints(from, to);

}

/*****************************************************************************/
function updateBpm() {
    // bpm 4th per minute => bpm*8/60 8th per second = bpm/7.5
    _samplePerFrame = Math.floor(_settings.samplingRate*7.5/_settings.bpm);
}

function onSelectChannel(e) {
    var ix = 0;
    var synthUi = e.control.parent;
    for (var key in _ui.items.modules.items) {
        if (_ui.items.modules.items[key] == synthUi) {
            selectChannel(ix);
            break;
        }
        ix++;
    }
}

function selectChannel(ix) {
    _ui.items.modules.item(_selected).removeClass('selected');
    _selected = ix;
    _ui.items.modules.item(ix).addClass('selected');

    var editor = _ui.items.editors.items.ed00;
    editor.dataBind(_series[ix]);
    editor.selectChannel(psynth.SynthAdapter.SETNOTE);
    editor.updateDataPoints();
}

/*****************************************************************************/
async function initializePlayer() {
    _player = new Player();

    // add adapter singletons
    _player.addAdapter(psynth.SynthAdapter);

    psynth.SynthAdapter.prepareContext({
        samplingRate: _settings.samplingRate,
        callback: fillSoundBuffer
    });
}
function resetPlayer() {
    for (var i=0; i<_player.channels.length; i++) {
        _player.channels[i].loopCount = 1;
        _player.channels[i].reset();
        _player.channels[i].isActive = true;
    }
}
function update() {
    var isRunning = false;
    for (var i=0; i<_player.channels.length; i++) {
        var isActive = _player.channels[i].run(1);
        //console.log(`Chn #${i} is ${isActive ? 'active' : 'inactive'}`);
        isRunning = isRunning || isActive;
        //console.log(`Playback is ${isRunning ? 'running' : 'stopped'}`);        
    }
    if (!isRunning) {
        resetPlayer();
        update();
    }
}

/*****************************************************************************/
function fillSoundBuffer(left, right, bufferSize, channel) {
    //var samplesPerFrame = _settings.samplingRate / SynthApp.player.refreshRate;
    var start = 0;
    var end = 0;
    var remains = bufferSize;
    for (var i=0; i<bufferSize; i++) {
        left[i] = .0;
        right[i] = .0;
    }
    while (remains) {
        if (_frame == 0) {
            update();
            _frame = _samplePerFrame;
            //SynthApp.frameCounter = _settings.samplingRate / SynthApp.player.refreshRate;
        }
        var len = _frame < remains ? _frame : remains;
        end = start + len;
        _frame -= len;
        for (var i=0; i<_player.channels.length; i++) {
            _player.channels[i].target.run(left, right, start, end);
        }
        start = end;
        remains -= len;
    }
    // for (var i=0; i<bufferSize; i++) {
    // 	_buffer[i] = buffer[i];
    // }
}

/*****************************************************************************/
async function onpageload(e) {

    Dbg.init('con');
    if (e && e.length) {
        alert(e);
        return;
    }

    Dbg.prln('Initialize player');
    await initializePlayer();

    Dbg.prln('Create UI');
    _ui = await createUi();

    Dbg.prln('Load sequence script');
    await loadSequence('res/demo01.seq');
    await Ui.Synth.loadPresets();

    for (var i=0; i<_series.length; i++) {
        Dbg.prln('Add synths');
        createSynth(3);
    }

    // Dbg.prln('Add editor');
    // var editor = createEditor(true);
    // editor.dataBind(_series[0]);
    // editor.selectChannel(psynth.SynthAdapter.SETNOTE);

    _ui.render({element:document.getElementById('main')});

    var toolbar = new Ui.Board(
        'mainToolBar',
        {
            'titlebar': false,
            'items': {
                'bpm': { type:'pot', label:'Bpm', min: 60, max: 160, step: 1, digits: 3, 'data-field': 'bpm', css:'main controls pot' },
                'start': { type:'button', value:'Start', 'data-type': Ui.Control.DataTypes.Bool, 'data-field': 'isRunning', css:'main controls'}
            },
            'data-source': _settings,
            'css': 'group'
        }
    );
    toolbar.dataBind();
    toolbar.render({element:document.getElementById('controls')});
    //selectChannel(0);
    // var bpm = new Ui.Pot('bpm', {
    //     min: 60, max: 160, step: 1,
    //     'digits': 3,
    //     'data-source': _settings, 'data-field': 'bpm'
    // });
    //bpm.render({element:document.getElementById('bpm')});
    
    updateBpm();

    resetPlayer();
    sound.start();
}