include('/ui/pot.js');
include('/ui/select.js');
include('/ui/label.js');
include('/ui/slider.js');

(function() {
    function Synth(id, tmpl, parent) {
        Ui.Board.call(this, id, tmpl, parent);
        this.modules = {};
    }
    extend(Ui.Board, Synth);

    Ui.Control.Types['Synth'] = { ctor: Ui.Synth, tag: 'DIV' };

    Synth.prototype.getTemplate = function() {
        var template = Synth.base.getTemplate();
        template.type = 'Synth';
        return template;
    };

    Synth.prototype.dataBind = function(synth) {
        // create items from synth's configuration
        var mdlTypes = ['synth', 'env', 'lfo', 'osc', 'flt'];
        var selectTypes = ['wave', 'mode'];
        var inputs = [{path:[this.id], ctrl:synth.controls, module:this}];
        while (inputs.length > 0) {
            var item = inputs.pop();
            if (item.ctrl instanceof psynth.Pot) {
                if (item.ctrl == synth.getControl(psynth.Ctrl.amp)) {
                    var control = new Ui.Slider(item.path.join('#'), {numeric:true, 'data-type':Ui.Control.DataTypes.Float, min:0, max:100, step:1}, this);
                    this.add(control, 'amp');
                    control.dataBind(item.ctrl, 'value');
                } else {
                    var type = item.path[item.path.length-1];
                    var control = null;
                    if (selectTypes.indexOf(type) == -1) {
                        control = new Ui.Pot(item.path.join('#'), {'numeric': true}, this)
                        control.css.push('pot');
                    } else {
                        control = new Ui.Select(item.path.join('#'), {titlebar:false, flag:true}, this);
                        control.css.push('select');
                        if (type == 'wave') {
                            for (var i in psynth.WaveForms) {
                                if (i == 'None') continue;
                                var key = i.toLowerCase();
                                control.addOption(new Ui.Label(`${control.id}#${key}`, {numeric:true,value:psynth.WaveForms[i]}), key);
                            }
                        } else if (type == 'mode') {
                            for (var i in psynth.FilterModes) {
                                var key = i.toLowerCase();
                                control.addOption(new Ui.Label(`${control.id}#${key}`, {numeric:true,value:psynth.FilterModes[i]}), key);
                            }
                        }
                    }                
                    var id = item.path.slice(-2);
                    control.dataBind(item.ctrl, 'value');
                    item.module.add(control, id[1]);
                }
            } else {
                for (var i in item.ctrl) {
                    var ctrl = item.ctrl[i];
                    var mdl = item.module;
                    var path = [...item.path, i];
                    if (!(ctrl instanceof psynth.Pot)) {
                        mdl = new Ui.Board(path.join('#'), {titlebar:false}, this);
                        var css = mdlTypes.find(x => i.startsWith(x));
                        mdl.css.push(css);
                        this.add(mdl, i);
                    }
                    inputs.unshift({path: path, ctrl: item.ctrl[i], module: mdl});
                }
            }
        }

    };

    Synth.prototype.render = function(ctx) {
        Synth.base.render.call(this, ctx);
        // //var synth = new psynth.Synth(48000, voiceCount);
        // voiceCount = synth.voices.length;
        // _synths.push(synth);
        // var synthElem = document.createElement('DIV');
        // synthElem.id = lbl;
        // synthElem.className = 'synth';
        // synthElem.innerHTML = _template.synth1.innerHTML.replace(/{{id}}/g, lbl);
        // synthElem.synth = synth;
        // synth.element = synthElem;

        // // set potmeters
        // var pots = synthElem.getElementsByClassName('pot');
        // for (var i=0; i<pots.length; i++) {
        //     Pot.bind(pots[i], synth);
        // }
        // // set waveform toggles
        // var toggles = synthElem.querySelectorAll('toggle');
        // for (var i=0; i<toggles.length; i++) {
        //     var toggle = toggles[i];
        //     toggle.bar = document.createElement('div');
        //     toggle.bar.className = 'toggle bar';
        //     toggle.appendChild(toggle.bar);
        //     toggle.onclick = toggleWaveform;
        //     toggle.value = psynth[toggle.getAttribute('value')];
        //     toggle.state = false;
        //     toggle.pot = synth.getControl(psynth.Ctrl[toggle.getAttribute('bind')]);
        // }

        // var select = synthElem.querySelector('select.preset');
        // getPresets(select);
        // select.onchange = selectPreset;
        // synthElem.querySelector('.preset.save').onclick = savePreset;
        // synthElem.querySelector('.preset.remove').onclick = removePreset;
        // // todo: store and reload preset from local storage
        // select.selectedIndex = 0;
        // selectPreset({target:select});
        // //synth.setup(_presets.default);

        // var pot = synth.getControl(psynth.Ctrl.lfo2amp);
        // pot.element.scale = 10;
        // pot.max = 10;
        // pot.element.innerHTML = pot.value * pot.element.scale;

        // // create voices LEDs
        // synth.voiceLeds = [];
        // var tbl = synthElem.querySelector('#voiceLEDs') || document.createElement('table');
        // tbl.id = lbl + 'VoiceLEDs';
        // var tr =  document.createElement('tr');
        // tbl.appendChild(tr);
        // for (var i=0; i<voiceCount; i++) {
        //     var td = document.createElement('td');
        //     td.className = 'led';
        //     var led = document.createElement('div');
        //     led.className = 'led';
        //     synth.voiceLeds.push(led);
        //     td.appendChild(led);
        //     tr.appendChild(td);
        // }
        // synthElem.querySelector('div.voiceLEDs').appendChild(tbl);
        // return synthElem;
    }
    Ui.Synth = Synth;
})();
