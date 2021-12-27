/* UI subsystem
 *
 *
 * 
 * 
 */
include('/lib/glui/glui-lib.js');
include('/lib/synth/score-control.js');

function Ui() {
    this.menu = null;
    this.main = null;
    this.controls = null;
    this.synths = null;
    this.sequences = null;

    this.synthTemplate = null;

    this.dialogs = {
        open: null,
        save: null,
        settings: null
    };
    
}

function ui_controls_onclick(e, ctrl) {
    switch (ctrl.id) {
        case 'run':
            if (!sound.isRunning) {
                ctrl.setValue('׀׀');
                sound.start();
            } else {
                ctrl.setValue('►');
                sound.stop();
            }
            break;
        case 'rwd':
            break;
        case 'fwd':
            break;
        case 'stp':
            break;
    }
}

Ui.prototype.initialize = async function initialize(app, settings, errors) {
    // load templates and images
    var res = await load([
        './res/main-layout.json',
        './res/menu-layout.json',
        './res/menu.json',
        './res/controls-layout.json',

        './res/synth-layout.json',
        './res/synth-template.png',
        './res/control-bg.png'
    
        //'./res/bg.png',
        //'/res/knob-bg.png',
    ]);
    glui.scale.x = 0.75;
    glui.scale.y = 0.75;
    glui.initialize(app, true);
    glui.animate();

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
        this.main = await glui.create('main', template, null, App);

        // add menu
        this.menu = this.main.items.find(x => x.id == 'Menu');
        await this.menu.build(res[2].data);
        // commands = this.menu.codes

        //#region Add controls
        this.controls = this.main.items.find(x => x.id == 'ControlPanel');
        this.controls.onclick = ui_controls_onclick;
        await this.controls.build();
        //ui.controlPanel.getControlById('tck').dataBind(App.ticks, 'value');

        this.controls.getControlById('bpm').dataBind(app, 'bpm');
        this.sequences = this.controls.getControlById('seq');
        this.sequences.dataBind(app, 'selectedSequence');
        this.sequences.dataLink.addHandler('value', app.selectSequence, this);
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
    var synthUi = await glui.create('synth' + (si < 10 ? '0'+si : si), this.synthTemplate, this.synths, app);
    await synthUi.build(synth, 'controls');
    // add to synths panel
    this.synths.add(synthUi);
    synthUi.move(0, si * (synthUi.height + 2));
    this.synths.size(this.synthTemplate.style.width, this.synths.height + synthUi.height + 2);
};