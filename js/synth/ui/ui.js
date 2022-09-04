include('/lib/glui/glui-lib.js');
//include('/lib/synth/score-control.js');

(function() {

    function Ui() {
        this.menu = null;
        this.main = null;
        this.controls = null;
        this.synths = null;
        this.sequences = null;

        this.synthTemplate = null;

        this.dialogs = {
            load: null,
            save: null,
            settings: null
        };
        
    }

    const resources = {
        'menu':             './ui/res/menu.json',
        // templates
        'main-template':    './ui/res/templates/main.json',
        'menu-template':    './ui/res/templates/menu.json',
        'controls-template':'./ui/res/templates/controls.json',
        'synth-template':   './ui/res/templates/synth-h.json',
        // dialogs

        // preload images
        'synth-png':        './ui/res/images/synth-h-template.png',
        'control-bg':       './ui/res/images/control-bg.png',
        //'': './res/images/bg.png',
        'knob-bg-png':      './ui/res/images/knob-bg.png'
    };

    Ui.prototype.loadResources = async function loadResources() {
        var res = await load(Object.values(resources));
        var loadErrors = res.select(x => x.error).map(x => x.error);
        if (loadErrors.length > 0) throw new Error(loadErrors);
        this.resources = {};
        var keys = Object.keys(resources);
        for (var i=0; i<res.length; i++) {
            this.resources[keys[i]] = res[i].data;
        }        
    };

    Ui.prototype.openDialog = function openDialog(name) {
        console.log(`Open dialog '${name}'`);
        //await glui.OpenSaveDialog({'title': 'Open image...', 'filters': ['*.png', '*.jpg'], 'init': function() { this.move(100, 100);} });
    };

    Ui.prototype.createSynthUi = function createSynthUi(synth) {
        var synthUi = glui.create('Sy', this.resources['synth-template'], this.main, this);
        //var dataSource = new Datalink(synth);
        // assign knobs to synth controls
        for (var i=0; i<synthUi.items.length; i++) {
            var knob = synthUi.items[i];
            var controlId = psynth.Synth.controls[knob.id];
            if (controlId != undefined) {
                knob.label = true;
                knob.setLook(glui.Textbox.Look.Knob);
                knob.style['background-image'] = './ui/res/images/knob-bg.png';
                knob.style['background-repeat'] = 'repeat-x repeat-y';
                knob.style['border'] = '#4060f0 0px outset';
                knob.style['font'] = 'consolas 8 normal';
                knob.style['width'] = '24px';
                knob.style['height'] = "14px";
                knob.style['align'] = 'center middle';
                knob.style['padding'] = '2px';
                knob.renderer.initialize();

                var controlId = psynth.Synth.controls[knob.id];
                var control = synth.getControl(controlId);
                knob.dataBind(control, 'value');
            }
        }
        synthUi.move(0, this.controls.height);
        //pSynth.Synth.controls
    };

    //#region event handlers
    Ui.prototype.onmousedown = function onmousedown(e, ctrl) {
        switch (ctrl.id) {
            case 'restart':
            case 'start':
            case 'pause':
            case 'stop':
                ctrl.renderer.border.style = 'inset';
                ctrl.render();
                break;
        }
    };
    Ui.prototype.onmouseup = function onmouseup(e, ctrl) {
        switch (ctrl.id) {
            case 'restart':
            case 'start':
            case 'pause':
            case 'stop':
                ctrl.renderer.border.style = 'outset';
                ctrl.render();
                break;
        }
    };
    Ui.prototype.onclick = function onclick(e, ctrl) {
    };
    Ui.prototype.onresize = function onresize(e) {
        this.controls.move(this.menu.width, 0);
        glui.repaint();
    };
    //#endregion

    Ui.initialize = async function initialize(app) {
        app.ui = new Ui();
        app.ui.context = app;

        await app.ui.loadResources();
        // load templates and images
        glui.scale.x = 0.75;
        glui.scale.y = 0.75;
        await glui.initialize(app, true);

        var r = app.ui.resources;
        app.ui.main = glui.create('main', r['main-template'], null, app);
        app.ui.controls = glui.create('main-controls', r['controls-template'], app.ui.main, app.ui);
        app.ui.menu = glui.create('main-menu', r['menu-template'], app.ui.main, app); await app.ui.menu.build(r['menu']);

        app.ui.onresize();
        glui.animate();

        console.log('Ui initialized');
    };

    publish(Ui, 'Ui', SynthApp);
})();

/*

    var loadErrors = res.select(x => x.error).map(x => x.error);
    if (loadErrors.length > 0) {
        errors.push(...loadErrors);
    } else {
        // create main layout
        var template = res[0].data;
        for (var i=0; i<template.items.length; i++) {
            if (template.items[i] == '<Menu>') template.items[i] = res[1].data;
            if (template.items[i] == '<Controls>') template.items[i] = res[3].data;
        }
        this.main = await glui.create('main', template, null, app);

        // add menu
        this.menu = this.main.items.find(x => x.id == 'Menu');
        await this.menu.build(res[2].data);
        // commands = this.menu.codes

        //#region add controls
        this.controls = this.main.items.find(x => x.id == 'ControlPanel');
        // this.controls.onclick = app.onclick;
        // this.controls.onchange = app.onchange;
        await this.controls.build();
        //ui.controlPanel.getControlById('tck').dataBind(App.ticks, 'value');

        this.controls.getControlById('bpm').dataBind(app, 'bpm');
        this.sequences = this.controls.getControlById('seq');
        this.sequences.dataBind(app, 'selectedSequence');
        //#endregion

        this.synths = this.main.items.find(x => x.id == 'SynthPanel');
        this.synthTemplate = res[4].data;
    }

    this.resize();
};

Ui.prototype.resize = function resize() {
    this.main.renderer.initialize();
    var top = 0;

    this.menu.move(0, 0, glui.Control.order.TOP);
    top += this.menu.height;

    // await this.controlPanel.renderer.initialize();
    this.controls.move(0, top);
    top += this.controls.height;
    this.synths.move(0, top);

    this.main.render();
};

Ui.prototype.removeSynthPanels = function removeSynthPanels() {
    for (var i=0; i<this.synths.items.length; i++) {
        this.synths.items[i].destroy();
    }
};

Ui.prototype.addSynthPanel = async function addSynthPanel(synth, app) {
    // create Synth ui
    var si = this.synths.items.length;
    // create and add to synths panel
    var synthUi = await glui.create('synth' + (si < 10 ? '0'+si : si), this.synthTemplate, this.synths, app);
    await synthUi.build(synth, 'controls');
    synthUi.move(0, si * (synthUi.height + 2));
    //this.synths.size(this.synthTemplate.style.width, this.synths.height + synthUi.height + 2);
};

*/