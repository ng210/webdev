include('base/dbg.js');
include('glui/glui-lib.js');
include('synth/synth-adapter.js');
include('synth/panel-control.js');
include('synth/score-control.js');

const SAMPLE_RATE = 48000;

var App = {
    //#region UI
    ui: null,
    mainMenu: null,
    openDialog: null,
    saveDialog: null,
    settingsDialog: null,

    synthPanel: [],

    menuStyle: {
        'font': 'Arial 24',
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
        // load UI resources
        var res = await load([
            '/synth/res/main-menu.json',
            '/synth/res/controls.layout.json',
            '/synth/res/bg.png',
            '/synth/res/control-bg.png',
            '/synth/res/synth-blank.png'
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
                    'item-template': App.menuItemTemplate,
                    'data-source': menuRes,
                    'data-field': ''
                },
                controlLayout,
                {   'id': 'SynthPanel',
                    'type': 'Container',
                    'style': {

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
        ui.mainMenu = ui.items.find(x => x.id == 'MainMenu'); await ui.mainMenu.build();
        ui.controlPanel = ui.items.find(x => x.id == 'ControlPanel'); await ui.controlPanel.build();
        ui.controlPanel.getControlById('bpm').dataBind(App, 'bpm');
        ui.synthPanel = ui.items.find(x => x.id == 'SynthPanel');

        ui.scorePanel = ui.items.find(x => x.id == 'ScorePanel');
        ui.scorePanel.unitX = 4;
        ui.scorePanel.scaleX = 4;
        var width = Math.floor(ui.scorePanel.scaleX*ui.scorePanel.unitX)*16;
        ui.scorePanel.style.border = `#000000 1px solid`;
        ui.scorePanel.style.width = width + 2;
        ui.scorePanel.unitY = 12;
        ui.scorePanel.style.height = ui.scorePanel.unitY*36;
        ui.scorePanel.renderer.initialize(ui.scorePanel, glui.renderingContext);
        ui.scorePanel.scaleRangeX[0] = ui.scorePanel.scaleRangeX[1] = ui.scorePanel.scaleX;
        ui.scorePanel.scaleY = 1.5;
        ui.scorePanel.setScale();
        ui.scorePanel.scrollTop = ui.scorePanel.stepY * 24;

        return ui;
    },
    resize: async function resize() {
        await this.ui.renderer.initialize();
        await this.ui.controlPanel.renderer.initialize();
        this.ui.controlPanel.move(0, 0);

        this.ui.mainMenu.move(this.ui.controlPanel.width, 0);

        this.ui.synthPanel.renderer.initialize();
        var top = Math.max(this.ui.mainMenu.height, this.ui.controlPanel.height);
        this.ui.synthPanel.move(0, top);
        top += this.ui.synthPanel.height;

        this.ui.scorePanel.renderer.initialize();
        this.ui.scorePanel.move(0, top);

        this.ui.render();
    },
    updateUi: async function updateUi() {
        var res = await load('/synth/res/synth.layout.json');
        if (res.error) throw res.error;
        var template = res.data;
        var top = 0;
        // create panel for synth-controls for each synth
        for (var i=0; this.synthAdapter.devices.length; i++) {
            var synth = this.synthAdapter.devices[i];
            if (this.synthPanel.items[i]) {
                this.synthPanel.items[i].dataBind(synth);
            } else {
                template.type = 'Panel';
                var synthUi = await glui.create('s' + i, template, this.synthPanel, App);
                await synthUi.build(synth);
                synthUi.move(0, top);
                top += synthUi.height + 2;        
            }
        }
        // remove unnecessary synth-controls
        for (var i=this.synthAdapter.devices.length; i<this.synthPanel.items.length; i++) {
            this.synthPanel.remove(this.synthPanel.items[i])
        }
        this.synthPanel.render();

        this.scorePanel.assignChannel(this.player.channel[1]);
        this.scorePanel.render();
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
    player: null,
    synthAdapter: null,
    patterns: [],

    fillBuffer: function fillBuffer(left, right, bufferSize, ch) {
        App.isDone = !channelBasedFillBuffer(left, right, bufferSize, App.channel);
    },

    playerBasedFillBuffer: function playerBasedFillBuffer(left, right, bufferSize, player) {
        var start = 0;
        var end = 0;
        var remains = bufferSize;
        for (var i=0; i<bufferSize; i++) {
            left[i] = .0;
            right[i] = .0;
        }
        while (remains) {
            var frameInt = Math.floor(this.frame);
            if (frameInt == 0) {
                this.currentStep++;
                if (!player.run(1)) {
                    player.reset();
                    player.run(0)
                    this.currentStep = 0;
                }
                this.frame += this.samplePerFrame;
            }
            var len = this.frame < remains ? frameInt : remains;
            end = start + len;
            this.frame -= len;
            var adapter = player.adapters[psynth.SynthAdapter.getInfo().id];
            for (var i=0; i<adapter.devices.length; i++) {
                adapter.devices[i].run(left, right, start, end);
            }
            start = end;
            remains -= len;
        }
    
        if (this.isScopeVisible) {
            for (var i=0; i<bufferSize; i++) {
                this.scope[this.scopeWritePosition++] = 0.5*(left[i] + right[i]);
                if (this.scopeWritePosition > this.scopeLength) {
                    this.scopeWritePosition -= this.scopeLength;
                }
            }
        }
    },
    //#endregion

    //#region misc
    bpm: 60,
    isDone: false,

    setBpm: function setBpm(bpm) {
        this.bpm = bpm;
        this.samplePerFrame = SAMPLE_RATE*3.75/bpm;
    },

    init: async function init() {
        Ps.Player.registerAdapter(Ps.Player);
        Ps.Player.registerAdapter(psynth.SynthAdapter);
        this.player = Ps.Player.create();

        glui.scale.x = 1.0;
        glui.scale.y = 1.0;
        await glui.initialize(this, true);
        glui.animate();
        //sound.init(SAMPLE_RATE, this.fillSoundBuffer);

        this.ui = await this.createUi();
        if (this.ui) {
            Dbg.prln('Ui created');
            await this.loadAsu('/synth/demo.asu');
            await this.resize();
        }
    },

    loadAsu: async function loadAsu(path) {
        // load data
        await this.player.load(path);

        this.synthAdapter = this.player.adapters[psynth.SynthAdapter.getInfo().id];

        // update UI
        this.updateUi();

        glui.animate();
        sound.init(SAMPLE_RATE, this.fillSoundBuffer);

        // load binary data, prepare adapters
        await player.load('synth/test-data.bin');
    },
    //#endregion

    //#region Event Handlers
    onchange: function onchange(e, ctrl) {
        if (ctrl.id == 'bpm') {
            setBpm(ctrl.getValue());
        }
    },
    onclick: function onclick(e, ctrl) {
        if (ctrl.id == 'run') {
            if (!sound.isRunning) {
                ctrl.setValue('Stop');
                sound.start();
            } else {
                ctrl.setValue('Play');
                sound.stop();
            }
        }
    },
    //#endregion
};

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }
    Dbg.init('con');
    App.init();
}
