include('base/dbg.js');
include('glui/glui-lib.js');
include('synth/synth-adapter.js');
include('synth/score-control.js');

const SAMPLE_RATE = 48000;
const LOCAL_STORAGE_KEY = 'synth-app';

var App = {
    settings: {
        languageCode: 'en'
    },

    //#region UI
    ui: null,
    commands: null,
    openDialog: null,
    saveDialog: null,
    settingsDialog: null,

    selectedChannel: null,

    selectedSequence: 0,

    menuStyle: {
        'font': 'Arial 18px',
        'align':'center middle',
        'border':'#607080 1px outset',
        'color': '#001010',
        'background-color': '#607080',
        'spacing': '2px 1px',
        'padding': '0px 0px',
        'z-index': 100
    },
    menuItemTemplate: {
        'type': 'Label',
        'layout': 'vertical',
        'style': {
            'border':'#607080 1px outset',
            'align': 'left middle',
            'width': '10em',
            'padding': '3px 2px'
            // 'height': '1.2em',
        }
    },

    createUi: async function createUi() {
        // pre-load UI resources
        var res = await load([
            '/synth/res/main-menu.json',
            '/synth/res/controls.layout.json',
            '/synth/res/synth.layout.json',
            '/synth/res/bg.png',
            '/synth/res/control-bg.png',
            //'/synth/res/knob-bg.png',
            '/synth/res/synth.template.png'
        ]);
        var errors = res.select(x => x.error);
        if (errors.length > 0) {
            Dbg.prln(errors.map(x => x.error).join('\n'));
            return false;
        }
        var menuRes = res[0].data;
        var controlLayout = res[1].data;
        var ui = await glui.create('main', {
            'type': 'Container',
            'style': {
                'width': '100%', 'height': '100%',
                'background-color': '#4060a0'
            },
            'items': [
                {   'id': 'MainMenu',
                    'type': 'Menu',
                    'layout': 'horizontal',
                    'style': App.menuStyle,
                    'item-template': App.menuItemTemplate
                },
                controlLayout,
                {   'id': 'SynthPanel',
                    'type': 'Container',
                    'style': {
                        'width': '0px', 'height': '0px'
                    }
                },
                {   'id': 'ScorePanel',
                    'type': 'Score',
                    'style': {
                        'color': '#ffd080',
                        'background-color': '#102040'
                    },
                    'scroll-x-min': 0,
                    'scroll-x-max': 0,
                    'scroll-y-min': 0,
                    'scroll-y-max': 48,
        
                    'scale-x-min': 0,
                    'scale-x-max': 0,
                    'scale-y-min': 0.5,
                    'scale-y-max': 4,
        
                    'insert-mode': 'x-bound',
                    'drag-mode': 'free',
                    'curve-mode': 'line'
                }
            ]
        }, null, App);
        ui.size = App.size;
        ui.mainMenu = ui.items.find(x => x.id == 'MainMenu'); await ui.mainMenu.build(menuRes);
        this.commands = ui.mainMenu.codes;
        ui.controlPanel = ui.items.find(x => x.id == 'ControlPanel'); await ui.controlPanel.build();
        ui.controlPanel.getControlById('bpm').dataBind(App, 'bpm');

        ui.synthPanel = ui.items.find(x => x.id == 'SynthPanel');

        ui.scorePanel = ui.items.find(x => x.id == 'ScorePanel');
        ui.scorePanel.unitX = 4;
        ui.scorePanel.scaleX = 14;
        var width = Math.floor(ui.scorePanel.scaleX*ui.scorePanel.unitX)*16;
        ui.scorePanel.style.border = `#000000 1px solid`;
        ui.scorePanel.style.width = width + 2;
        ui.scorePanel.unitY = 12;
        ui.scorePanel.scaleY = 1.5;
        ui.scorePanel.style.height = ui.scorePanel.unitY*ui.scorePanel.scaleY*36;
        await ui.scorePanel.renderer.initialize(ui.scorePanel, glui.renderingContext);
        ui.scorePanel.scaleRangeX[0] = ui.scorePanel.scaleRangeX[1] = ui.scorePanel.scaleX;
        ui.scorePanel.setScale();
        ui.scorePanel.scrollTop = ui.scorePanel.stepY * 24;

        return ui;
    },
    size: function resize() {
        this.renderer.initialize();
        // await this.controlPanel.renderer.initialize();
        this.controlPanel.move(0, 0);

        this.mainMenu.move(this.controlPanel.width, 0);
        //this.ui.synthPanel.renderer.initialize();
        var top = Math.max(this.mainMenu.height, this.controlPanel.height);
        this.synthPanel.move(0, top);
        //this.ui.synthPanel.size(0, top);
        top += this.synthPanel.height;

        //this.ui.scorePanel.renderer.initialize();
        this.scorePanel.move(0, top);
        //this.ui.scorePanel.size(this.ui.synthPanel.width, this.ui.scorePanel.height);

        this.render();
    },
    updateUi: async function updateUi() {
        var res = await load('/synth/res/synth.layout.json');
        if (res.error) throw res.error;
        var synthTemplate = res.data;
        var height = 0;
        // create panel for synth-controls for each synth
        for (var i=0; i<this.synthAdapter.devices.length; i++) {
            var synth = this.synthAdapter.devices[i];
            if (this.ui.synthPanel.items[i]) {
                this.ui.synthPanel.items[i].dataBind(synth);
            } else {
                var synthUi = await glui.create('synth' + (i < 10 ? '0'+i : i), synthTemplate, this.ui.synthPanel, App);
                synthUi.onfocus = function(e, ctrl) {
                    var res = false;
                    if (ctrl.id == 'pname') {
                        ctrl.editMode = false;
                        // open presets dialog
                        setTimeout(
                            function(app, pname) {
                                if (!pname.editMode) {
                                    app.showPresets(pname.value, pname.parent.parent.boundObject);
                                }
                            }, 500, this.context, ctrl);
                        res = true;
                    }
                    return res;
                };
                synthUi.ondblclick = function(e, ctrl) {
                    ctrl.editMode = true;
                    ctrl.onfocus();
                };
                await synthUi.build(synth, 'controls');
                var polyCtrl = synthUi.getControlById('poly');
                var polyCount = synthUi.getControlById('polyCount');
                polyCtrl.dataBind(polyCount, 'value');
                polyCtrl.dataLink.addHandler('value', function(v) { this.dataSource.obj.setValue(v); }, polyCtrl);
                polyCtrl.setValue(synth.voices.length);
                polyCtrl.addHandler('change', synthUi,
                    function(e, ctrl) {
                        this.boundObject.setVoiceCount(ctrl.getValue());
                    }
                );
                synthUi.move(0, height);
                height += synthUi.height + 2;
                var pname = synthUi.getControlById('pname');
                pname.dataBind(this.listPresets(synth.soundBank));
                pname.setValue(pname.dataSource.obj[0]);
            }
        }
        // remove unnecessary synth-controls
        for (; i<this.ui.synthPanel.items.length; i++) {
            this.ui.synthPanel.remove(this.ui.synthPanel.items[i])
        }
        this.ui.synthPanel.size(synthTemplate.style.width, height);
        this.ui.scorePanel.assign(this.player.sequences[1]);
        this.ui.scorePanel.render();
    },
    applyStyles: function applyStyles(styles) {
        var ctrls = [ui];
        while (ctrl.length > 0) {
            ctrl = ctrls.pop();
            ctrl.applyStyles(styles);
            // add children
            if (Array.isArray(ctrl.items)) {
                for (var i=0; i<ctrl.items.length; i++) {
                    ctrls.push(ctrl.items[i]);
                }
            }
        }
        this.ui.render();
    },
    //#endregion

    //#region player
    frame: 0,
    sampleCount: 0,
    player: null,
    synthAdapter: null,
    selectedChannel: null,
    //#endregion

    //#region misc
    bpm: 60,
    isDone: false,
    textResources: {},

    setBpm: function setBpm(bpm) {
        this.bpm = bpm;
        psynth.SynthAdapter.samplePerFrame = SAMPLE_RATE*3.75/bpm;
    },

    init: async function init() {
        psynth.SynthAdapter.prototype.fillSoundBuffer = App.playerBasedFillBuffer;

        Ps.Player.registerAdapter(Ps.Player);
        Ps.Player.registerAdapter(psynth.SynthAdapter);
        this.player = Ps.Player.create();

        glui.scale.x = 0.8;
        glui.scale.y = 0.8;
        await glui.initialize(this, true);
        glui.animate();
        //sound.init(SAMPLE_RATE, this.fillSoundBuffer);

        this.ui = await this.createUi();
        if (this.ui) {
            Dbg.prln('Ui created');
            this.loadFromLocalStore();
            if (!this.localStore.asu.current) {
                Dbg.prln('Create blank ASU');
                this.createBlank();
            }
            this.selectedSequence = 1;
            // update UI
            await this.updateUi();
            this.ui.size();
        }

        var res = await load(`/synth/errors.${this.settings.languageCode}.json`);
        if (res.error) Dbg.prln('Could not load error text file!');
        else {
            for (var i in res.data) {
                this.textResources[i] = res.data[i];
            }
        }

        this.setBpm(App.bpm);
    },

    createBlank: function createBlank() {
        //#region create data blocks
        // DataBlock #0
        var playerInit = new Stream(1+4)
            .writeUint8(2)
                .writeUint8(Ps.Player.Device.CHANNEL)
                .writeUint8(Ps.Player.Device.CHANNEL);

        // DataBlock #1
        var synthInit = new Stream(2+1+1*3)
            .writeUint16(SAMPLE_RATE)
            .writeUint8(2)
            .writeArray([psynth.SynthAdapter.Device.Synth, 6, 2])
            .writeArray([psynth.SynthAdapter.Device.Synth, 1, 2]);

        // DataBlock #2
        var synthDataBank = new Stream(1+16+5)
            .writeUint8(1)
            .writeString('default......')
            .writeUint16(17)
            .writeUint8(29)
            .writeUint8(psynth.Synth.controls.amp).writeUint8(212)

            .writeUint8(psynth.Synth.controls.env1amp).writeFloat32(1.0)
                .writeUint8(psynth.Synth.controls.env1atk).writeUint8(1)
                .writeUint8(psynth.Synth.controls.env1dec).writeUint8(8)
                .writeUint8(psynth.Synth.controls.env1sus).writeUint8(32)
                .writeUint8(psynth.Synth.controls.env1rel).writeUint8(24)

            .writeUint8(psynth.Synth.controls.env2amp).writeFloat32(0.2)
                .writeUint8(psynth.Synth.controls.env2atk).writeUint8(8)
                .writeUint8(psynth.Synth.controls.env2dec).writeUint8(32)
                .writeUint8(psynth.Synth.controls.env2sus).writeUint8(128)
                .writeUint8(psynth.Synth.controls.env2rel).writeUint8(64)

            // .writeUint8(psynth.Synth.controls.lfo1amp).writeFloat32(0.0)
            //     .writeUint8(psynth.Synth.controls.lfo1fre).writeFloat32(0.0)

            .writeUint8(psynth.Synth.controls.lfo2amp).writeFloat32(1.2)
                .writeUint8(psynth.Synth.controls.lfo2fre).writeFloat32(6.0)

            .writeUint8(psynth.Synth.controls.osc1amp).writeFloat32(0.4)
                //.writeUint8(psynth.Synth.controls.osc1fre).writeFloat32(0.0)
                .writeUint8(psynth.Synth.controls.osc1tune).writeUint8(0)
                .writeUint8(psynth.Synth.controls.osc1psw).writeUint8(96)
                .writeUint8(psynth.Synth.controls.osc1wave).writeUint8(psynth.Osc.waveforms.SAW)

            .writeUint8(psynth.Synth.controls.osc2amp).writeFloat32(0.2)
                //.writeUint8(psynth.Synth.controls.osc1fre).writeFloat32(0.0)
                .writeUint8(psynth.Synth.controls.osc2tune).writeUint8(12)
                .writeUint8(psynth.Synth.controls.osc2psw).writeUint8(128)
                .writeUint8(psynth.Synth.controls.osc2wave).writeUint8(psynth.Osc.waveforms.PULSE)

            .writeUint8(psynth.Synth.controls.flt1mode).writeUint8(psynth.Filter.modes.LOWPASS)
                .writeUint8(psynth.Synth.controls.env3dc).writeFloat32(0.1)
                .writeUint8(psynth.Synth.controls.flt1res).writeUint8(64)
                .writeUint8(psynth.Synth.controls.flt1mod).writeUint8(255)
                .writeUint8(psynth.Synth.controls.env3amp).writeFloat32(0.5)
                .writeUint8(psynth.Synth.controls.env3atk).writeUint8(2)
                .writeUint8(psynth.Synth.controls.env3dec).writeUint8(16)
                .writeUint8(psynth.Synth.controls.env3sus).writeUint8(24)
                .writeUint8(psynth.Synth.controls.env3rel).writeUint8(32)


        this.player.dataBlocks.push(playerInit, synthInit, synthDataBank);
        //#endregion

        // create adapters
        this.synthAdapter = this.player.addAdapter(psynth.SynthAdapter);

        //#region create sequences
        // create master sequence
        var frames = [];
        frames.push(new Ps.Frame().setDelta(0).addCommand(this.player.makeCommand(Ps.Player.ASSIGN, 1, 1, 0, 1)));
        frames.push(new Ps.Frame().setDelta(64).addCommand(this.player.makeCommand(Ps.Player.EOS)));
        this.player.sequences.push(Ps.Sequence.fromFrames(frames, this.player));

        // create default synth sequence
        var d = 0;
        frames = [];
        for (var i=0; i<16; i++) {
            frames.push(new Ps.Frame().setDelta(d).addCommand(this.synthAdapter.makeCommand(psynth.SynthAdapter.SETNOTE, 24, 240)));
            frames.push(new Ps.Frame().setDelta(2).addCommand(this.synthAdapter.makeCommand(psynth.SynthAdapter.SETNOTE, 24, 0)));
            d = 2;
        }
        frames.push(new Ps.Frame().setDelta(2).addCommand(this.player.makeCommand(Ps.Player.EOS)));
        this.player.sequences.push(Ps.Sequence.fromFrames(frames, this.synthAdapter));
        //#endregion

        // initialize player
        this.player.prepareContext(this.player.dataBlocks[0]);
        this.synthAdapter.prepareContext(this.player.dataBlocks[1]);
        // assign master sequence to master channel
        this.player.masterChannel.assign(0, this.player.sequences[0]);
    },

    channelBasedFillBuffer: function channelBasedFillBuffer(left, right, bufferSize) {
        var start = 0;
        var end = 0;
        var remains = bufferSize;
        for (var i=0; i<bufferSize; i++) {
            left[i] = .0;
            right[i] = .0;
        }
        while (remains) {
            var frameInt = Math.floor(App.frame);
            if (frameInt == 0) {
                if (!App.selectedChannel.run(1)) {
                    App.selectedChannel.reset();
                    App.selectedChannel.run(0);
                }
                App.frame += psynth.SynthAdapter.samplePerFrame;
            }
            var len = App.frame < remains ? frameInt : remains;
            end = start + len;
            App.frame -= len;
            App.selectedChannel.device.run(left, right, start, end);
            start = end;
            remains -= len;
        }
    },
    playerBasedFillBuffer: function playerBasedFillBuffer(left, right, bufferSize) {
        var start = 0;
        var end = 0;
        var remains = bufferSize;
        for (var i=0; i<bufferSize; i++) {
            left[i] = .0;
            right[i] = .0;
        }
        while (remains) {
            var frameInt = Math.floor(App.sampleCount);
            if (frameInt == 0) {
                App.frame++;
                if (!App.player.run(1)) {
                    App.player.reset();
                    App.player.run(0);
                    App.frame = 0;
                }
                App.sampleCount += psynth.SynthAdapter.samplePerFrame;
            }
            var len = App.sampleCount < remains ? frameInt : remains;
            end = start + len;
            App.sampleCount -= len;
            var adapter = App.player.adapters[psynth.SynthAdapter.getInfo().id];
            for (var i=0; i<adapter.devices.length; i++) {
                adapter.devices[i].run(left, right, start, end);
            }
            start = end;
            remains -= len;
        }
    },

    getTextResource: function getTextResource(id, defaultText) {
        var text = null;
        var args = arguments;
        if (this.textResources) {
            text = this.textResources[id] || defaultText;
            var re = /([^\$]\$\d)/g
            text = text.replace(re, function(m, p) { var ix = parseInt(p.substr(2)); return isNaN(ix) ? p : p.charAt(0) + args[ix+1]; });
        }
        return text;
    },
    //#endregion

    //#region load/save
    localStore: {
        'settings': {},
        'asu': {}
    },
    storeUrl: '',

    loadAsu: async function loadAsu(source) {
        var res = await this.player.load(source);
        if (res) {
            this.getTextResource(res, 'Could not load resource!');
        } else {
            this.synthAdapter = this.player.adapters[psynth.SynthAdapter.getInfo().id];
            //this.selectedChannel = this.player.channels[1];
            this.selectedSequence = 1;
        }
        // update UI
        await this.updateUi();
    },

    loadFromLocalStore: async function loadFromLocalStore() {
        var data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
        if (data) {
            // update settings
            for (var i in data.settings) {
                this.localStore.settings[i] = data.settings[i];
            }
            // load asu
            if (data && data.asu.current) {
                this.localStore.asu.current = data.asu.current;
                await this.loadAsu(data.asu.current);
            }
            
        }
    },
    saveToLocalStore: async function saveToLocalStore() {
        var data = {
            // settings
            'settings': {

            },
            // current ASU
            'asu': {}
        };
        data.asu.current = await Ps.Player.createBinaryData(this.player);
        localStorage.setItem(LOCAL_STORAGE_KEY, data);
    },
    //#endregion

    //#region preset
    addPreset: function addPreset(name, synth) {
        if (!name) return 102;
        var sb = synth.soundBank;
        var count = sb.readUint8(0);

        return 0;
    },
    loadPreset: function loadPreset(data, synth) {
        if (data instanceof Stream) {

        } else if (typeof data === 'object') {
        } else throw new Error('Not supported preset format!');
    },
    listPresets: function listPresets(sb) {
        var list = [];
        var count = sb.readUint8(0);
        for (var i=0; i<count; i++) {
            list.push(sb.readString(1+i*16));
        }
        return list;
    },
    showPresets: function showPresets() {
        console.log('showPreset');
    },
    //#endregion

    //#region Event Handlers
    onchange: function onchange(e, ctrl) {
        switch (ctrl.id) {
            case 'bpm':
                this.setBpm(ctrl.getValue());
                break;
            case 'ScorePanel':
                var isRunning = false;
                if (sound.isRunning) {
                    isRunning = true;
                    sound.stop();
                }
                var sequence = ctrl.getAsSequence(App.synthAdapter);
                for (var i=1; i<App.player.channels.length; i++) {
                    var ch = App.player.channels[i];
                    if (ch.sequence == App.player.sequences[App.selectedSequence]) {
                        if (ch.cursor > sequence.stream.length) ch.cursor = 0;
                        // release every voice
                        var dev = ch.device;
                        for (var i=0; i<dev.voices.length; i++) {
                            var voice = dev.voices[i];
                            voice.setNote(0, 0);
                        }
                        ch.sequence = sequence;
                    }
                }
                App.player.sequences[App.selectedSequence] = sequence;
                if (isRunning) {
                    sound.start();
                }
                break;
        }
    },
    onclick: async function onclick(e, ctrl) {
        switch (ctrl.id) {
            case 'run':
                if (!sound.isRunning) {
                    ctrl.setValue('Stop');
                    sound.start();
                } else {
                    ctrl.setValue('Play');
                    sound.stop();
                }
                break;
            case 'padd':
                var pname = ctrl.parent.getControlById('pname');
                var message = 'Ok';
                if (pname.dataSource.obj.includes(pname.value)) {
                    res = this.getTextResource(100, 'Preset name already in use!');
                } else {
                    var res = this.addPreset(pname.value, ctrl.parent.parent.boundObject);
                    if (res == 0) {
                        this.listPresets(ctrl.parent.parent.boundObject.soundBank);
                        res = 101;
                    }
                    message = this.getTextResource(res, 'Error' , pname.value);
                };
                await glui.MessageBox(message);
                break;
            case 'pdel':
console.log('del: ', ctrl.parent.dataSource.obj);
                break;
        }
    },
    oncommand: async function oncommand(e, ctrl) {
        switch (e.control.code)
        {
            case this.commands.OPEN:
                
                break;
            case this.commands.SAVE:
                var res = await this.saveToLocalStore();
                if (!res) await glui.MessageBox(this.getTextResource(res, 'Saved.'));
                break;
            case this.commands.SAVEAS:
                break;
            case this.commands.SETTINGS:
                break;   
        }
    }
    //#endregion
};

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }
    Dbg.init('con');
    App.init();
}
