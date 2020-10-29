include('glui/glui-lib.js');
include('/synth/synth.js');
include('/player/player-lib.js');
include('/ge/sound.js');
include('/synth/synth-adapter.js');
include('/utils/syntax.js');
include('/synth/grammar.js');

(function() {

    const SAMPLE_RATE = 48000;

    var Synth = {
        name: 'Synth',
        settings: {
            bpm: { label: 'BPM', value: 120, min:60, max:180, step: 0.5, type: 'float', link: null },
            alpha: { label: 'Alpha', value: 0.5, min:0, max:1, step: 0.01, type: 'float', link: null },
            width: { label: 'Width', value: 0.0005, min:0.0001, max:0.001, step: 0.0001, normalized:true, type: 'float', link: null }
        },
        // custom variables
        player: null,
        synth: null,
        frame: 0,
        samplePerFrame: 0,
        isDone: false,
        scope: new Float32Array(2400),
        scopeDx: 0,
        scopeWritePos: 0,
    
        initialize: async function initialize() {
            Ps.Player.registerAdapter(Ps.Player);
            Ps.Player.registerAdapter(psynth.SynthAdapter);
            player = Ps.Player.create();
            this.samplePerFrame = SAMPLE_RATE*3.75/this.settings.bpm.value;
            await player.load('/demo/synth/test-data.bin');
            var synthAdapter = player.adapters[psynth.SynthAdapter.getInfo().id];
            this.synth = synthAdapter.devices[0];
            this.run((left, right, bufferSize) => Synth.playerBasedFillBuffer(left, right, bufferSize, player));
        },
        destroy: function destroy() {
            sound.stop();
        },
        resize: function resize(e) {
        },
        update: function update(frame, dt) {
        },
        render: function render(frame, dt) {
            var ctx = glui.renderingContext2d;
            ctx.save();
            ctx.fillStyle = '#0e1028';
            ctx.globalAlpha = this.settings.alpha.value;
            ctx.fillRect(0, 0, glui.width, glui.height);
            ctx.globalAlpha = 1;
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#204060';
            ctx.moveTo(0, 0.5*glui.height);
            var dx = glui.width/this.scope.length;
            for (var i=0; i<this.scope.length; i++) {
                ctx.lineTo(dx + i*dx, 0.5*glui.height*(1 + this.scope[i]));
            }
            ctx.stroke();

            ctx.restore();
        },

        onchange: function onchange(e, setting) {
			switch (setting.parent.id) {
                case 'bpm':
                    this.samplePerFrame = SAMPLE_RATE*3.75/setting.value;
                    break;
            }
        },

        onstartstop: function onstartstop() {
            if (!sound.isRunning) {
                sound.start();
            } else {
                sound.stop();
            }
        },

        onmousemove: function onmousemove(x, y, e) {
            if (typeof x === 'number') {
                this.synth.setControl(psynth.Synth.controls.flt1cut, x);
                this.synth.setControl(psynth.Synth.controls.flt1res, 0.98*(1-y));
            }
        },

        // custom functions
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
                    if (!player.run(1)) {
                        player.reset();
                        player.run(0)
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
            var dx = bufferSize*this.settings.width.value;

            for (var j=0; j<bufferSize; j+=dx) {
                var i = Math.floor(j);
                this.scope[this.scopeWritePos] = 0.5*(left[i] + right[i]);
                this.scopeWritePos = (this.scopeWritePos + 1) % this.scope.length;
            }
        },
        run: function run(callback) {
            sound.init(SAMPLE_RATE,
                function fillBuffer(left, right, bufferSize, channel) {
                    callback(left, right, bufferSize, channel);
                }
            );
        }

    };

    publish(Synth, 'Synth');
})();