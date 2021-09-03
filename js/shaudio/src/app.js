include('/lib/base/dbg.js');
include('sequencer.js');
include('gpu.js');
//include('gui.js');
include('/lib/ge/sound.js');

//include('/lib/utils/syntax.js');
//include('./compiler.js');
//include('./grammar.js');


//self.DBGLVL = 2;

(function() {

    var App = {
        state: {},

        gpu: Gpu,

        time: 0.0,
        offset: 0,

        buffer: new Float32Array(2*48000)
    };

    App.init = async function init() {
        //this.gui = await Gui.create(this);
        Dbg.prln('Loading resources...');
        var res = await load(['res/visuals.fs', 'res/sound.fs']);
        var errors = res.select(x => x.error);
        if (errors.length == 0) {
            Dbg.prln('Initialize gpu...');
            await this.gpu.init(8192);
            await this.gpu.setCode(res[1].data, res[0].data);
            Dbg.prln('Start sound playback.');
            sound.init(48000, App.renderSamples);
        } else {
            Dbg.prln(errors.map(x => x.error).join('\n'));
        }
    };

    App.start = function start() {
        sound.start();
    };

    App.stop = function stop() {
        sound.stop();
    };

    App.renderSamples = function renderSamples(left, right, length) {
        var samples = App.gpu.compute(length);
        var j = 0;
        for (var i=0; i<length; i++) {
            left[i] = samples[j++];
            right[i] = samples[j++];
        }
    };

    publish(App, 'App');
})();