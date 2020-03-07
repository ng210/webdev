include('/base/dbg.js');

include('ui/ui.js');

include('/ge/sound.js');

include('grammar.js');
include('/utils/syntax.js');

include('/synth/synth.js');

include('/ge/player/player-lib.js');
include('/synth/synth-adapter.js');
include('./synth-adapter-ext.js');


var _ui = null;
var _synths = [];


function createSynth() {
    var synth = new psynth.Synth(48000, 3);
    _synths.push(synth);
    var id = `synth${('0'+_synths.length).slice(-2)}`;
    var synthUi = new Ui.Synth(id);
    synthUi.addClass('synth');
    synthUi.dataBind(synth);
    _ui.items.modules.add(id, synthUi);
    return synthUi;
}

function createEditor() {
    var template = {
        'width': 320,
        'height': 240,
        'unit': [32, 24],
        'grid-color': [0.2, 0.4, 0.6],
        'titlebar': 'Test1',
        'line-width': 0.1
    };
    var id = `ed${('0'+_synths.length).slice(-2)}`;
    var multiChart = new Ui.MultiChart(id, template, null);
    multiChart.dataBind(MultiDataSeries);
    multiChart.selectChannel('ints');
    _ui.items.editors.add();
}

async function onpageload(e) {

    Dbg.init('con');
    if (e && e.length) {
        alert(e);
        return;
    }
    Dbg.prln('Create UI');
    _ui = await createUi();

    Dbg.prln('Add synths');
    await Ui.Synth.loadPresets();
    createSynth();
    createSynth();

    Dbg.prln('Add editor');
    //_ui.addNewEditor();

    _ui.render({element:document.getElementById('main')});

    Dbg.prln('Init playback');
    //await initializePlayer();
}