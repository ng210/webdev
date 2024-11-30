include('/lib/base/dbg.js');
include('sequencer.js');
include('gpu.js');
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
        var res = await load('res/visuals.fs');
        if (!res.error) {
            Dbg.prln('Initialize gpu...');
            await this.gpu.init(8192);
            var description = null;
            var code = (await load('./res/sound.fs')).data;
            await this.gpu.setCode(code, res.data);
            Dbg.prln('<button onclick="App.start()">Start sound playback</button>');
            sound.init(48000, App.renderSamples);
        } else {
            Dbg.prln(res.error);
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