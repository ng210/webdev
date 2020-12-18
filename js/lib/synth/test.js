include('/player/player-lib.js');
include('/ge/sound.js');
include('glui/glui-lib.js');
include('synth.js');
include('synth-adapter.js');
include('panel-control.js');
include('score-control.js');
// include('/synth/synth-adapter-ext.js');
// include('/utils/syntax.js');
// include('/synth/grammar.js');

(function(){

    const SAMPLE_RATE = 48000;
    const MEASURE = false;

    async function loadPreset(synth, url) {
        var preset = await load(url);
        var data = Object.values(preset.data)[0];
        for (var i in data) {
            var ctrl = getObjectAt(i, synth.controls);
            ctrl.set(data[i]);
        }
    }

    async function test_freqTable() {
        message('Check frequency table', 1);
        test('A0 should be 27,5Hz', ctx => ctx.assert(psynth.freqTable[70-48], '=', 27.5));
        test('A1 should be 55Hz', ctx => ctx.assert(psynth.freqTable[70-36], '=', 55));
        test('A2 should be 110Hz', ctx => ctx.assert(psynth.freqTable[70-24], '=', 110));
        test('A3 should be 220Hz', ctx => ctx.assert(psynth.freqTable[70-12], '=', 220));
        test('A4 should be 440Hz', ctx => ctx.assert(psynth.freqTable[70], '=', 440));

        if (MEASURE) {
            await measure('psynth.p2f(rnd) x1M', i => psynth.p2f(Math.random()*127), 1000000);
            await measure('psynth.p2f_(rnd) x1M', i => psynth.p2f_(Math.random()*127), 1000000);
        }
    }

    function test_control_labels() {
        message('Test control labels', 1);
        var errors = [];
        var synth = new psynth.Synth(SAMPLE_RATE, 1);
        psynth.Synth.controls.dummy = 240;
        psynth.Synth.controls.lfo1dummy = 250;
        var keys = Object.keys(psynth.Synth.controls);
        while (keys.length > 0) {
            var key = keys.pop();
            var isValid = false;
            for (var j in synth.controls) {
                if (typeof synth.controls[j] === 'object') {
                    if (key == j) {
                        isValid = true;
                        break;
                    }
                    if (key.startsWith(j)) {
                        key = key.substring(j.length)
                        isValid = true;
                        if (!(synth.controls[j][key] instanceof psynth.Pot)) {
                            errors.push(`${j}.${key} does not exist!`);
                        }
                        break;
                    }
                }
            }
            if (!isValid) {
                errors.push(`${key} is not valid!`);
            }
        }
        test('All but 2 (dummy) synth control const names and paths should match', ctx => {
            ctx.assert(errors, ':=', ['lfo1.dummy does not exist!', 'dummy is not valid!']);
        });
        delete psynth.Synth.controls.dummy;
        delete psynth.Synth.controls.lfo1dummy;
    }

    function test_create_synth() {
        message('Test should create a synth', 1);
        var synth = new psynth.Synth(SAMPLE_RATE, 6);
        var errors = [];
        for (var i in psynth.Synth.controls) {
            var ctrl = synth.getControl(psynth.Synth.controls[i]);
            if (!(ctrl instanceof psynth.Pot) && i != 'osc1note' && i != 'osc2note') {
                errors.push(`<span style="color:#ff4040">'${i}' missing</span>`);
            }
        }
        test('Synth should have all controls', ctx => ctx.assert(errors.length, '=', 0));
        if (errors.length > 0) {
            _indent++;
            for (var i=0; i<errors.length; i++) {
                message(errors[i]);
            }
            _indent--;
        }

        test('Synth should have 6 voices', ctx => ctx.assert(synth.voices.length, '=', 6));

        var voice = synth.voices[0];
        test('Synth voice should have all components', ctx => {
            ctx.assert(voice.envelopes[0] instanceof psynth.Env, 'true');
            ctx.assert(voice.envelopes[1] instanceof psynth.Env, 'true');
            ctx.assert(voice.envelopes[2] instanceof psynth.Env, 'true');

            ctx.assert(voice.lfos[0] instanceof psynth.Osc, 'true');
            ctx.assert(voice.lfos[1] instanceof psynth.Osc, 'true');

            ctx.assert(voice.oscillators[0] instanceof psynth.Osc, 'true');
            ctx.assert(voice.oscillators[1] instanceof psynth.Osc, 'true');

            ctx.assert(voice.filter instanceof psynth.Filter, 'true');
        });
    }

    function test_run_env() {
        message('Test envelope run', 1);
        var synth = new psynth.Synth(SAMPLE_RATE, 6);
        var sample = 0.0;
        var env = synth.voices[0].envelopes[0];
        env.amp.set(0.5); env.dc.set(0.5);
        env.atk.set(1.0); env.dec.set(1.0);
        env.sus.set(0.5); env.rel.set(1.0);

        sample = env.run(1.0);
        test('Envelope should be in IDLE phase', ctx => {
            ctx.assert(sample, '=', 0.5)
            ctx.assert(env.phase, '=', psynth.Env.phase.IDLE)
        });

        // trigger: slope up
        env.setGate(1.0);
        test('Envelope should enter UP phase (slope up)', ctx => ctx.assert(env.phase, '=', psynth.Env.phase.UP));

        // forward 4 seconds
        for (var i=0; i<=4*SAMPLE_RATE; i++) sample = env.run(1.0);
        test('Envelope should switch to DEC phase after 4 seconds', ctx => {
            ctx.assert(sample, '=', 1.0);
            ctx.assert(env.phase, '=', psynth.Env.phase.DEC);
        });

        // forward 2 secs
        for (var i=0; i<=2*SAMPLE_RATE+1; i++) sample = env.run(1.0);
        test('Envelope should switch to SUS phase after 2 seconds', ctx => {
            ctx.assert(sample, '=', 0.75);
            ctx.assert(env.phase, '=', psynth.Env.phase.SUS);
        });

        // forward 10 secs
        for (var i=0; i<=20*SAMPLE_RATE+1; i++) sample = env.run(1.0);
        test('Envelope should remain in SUS phase until slope down', ctx => {
            ctx.assert(sample, '=', 0.75);
            ctx.assert(env.phase, '=', psynth.Env.phase.SUS);
        });

        // trigger: slope down
        env.setGate(0.0);
        test('Envelope should switch to DOWN phase', ctx => {
            ctx.assert(sample, '=', 0.75);
            ctx.assert(env.phase, '=', psynth.Env.phase.DOWN);
        });
        for (var i=0; i<=10*SAMPLE_RATE+1; i++) sample = env.run(1.0);
        test('Envelope should switch to IDLE phase after 10 seconds', ctx => {
            ctx.assert(sample, '=', 0.5);
            ctx.assert(env.phase, '=', psynth.Env.phase.IDLE);
        });
    }

    function test_osc_run() {
        message('Test oscillator run', 1);
        var synth = new psynth.Synth(SAMPLE_RATE, 6);
        var voice = synth.voices[0];
        voice.velocity.set(1.0);
        voice.note.set(0);
        var osc = voice.oscillators[0];
        osc.amp.value = 1.0;
        osc.fre.value = 480.0;
        osc.note = voice.note;
        osc.tune.set(0.0);
        osc.psw.set(0.5);

        osc.wave.set(psynth.Osc.waveforms.SINUS);
        // generate 1 sec of sample
        var expected = { 0: 0, 25: 1, 50: 0, 75: -1 };
        var errors = [];
        for (var i=0; i<SAMPLE_RATE/100; i++) {
            var sample = osc.run(1.0, 0.0, 0.0);
            var j = i%100;
            if (expected[j] != undefined && !approx(expected[j], sample, 1/65536/65536))
                errors.push(`Sample at ${i} is ${sample}, expected ${expected[j]}`);
        }
        test('Osc should generate a 480Hz sinus', ctx => ctx.assert(errors, 'empty'));

        osc.reset();
        osc.wave.set(psynth.Osc.waveforms.TRIANGLE);
        // generate 1 sec of sample
        expected = { 0: -1, 25: 0, 50: 1, 75: 0 };
        errors = [];
        for (var i=0; i<SAMPLE_RATE/100; i++) {
            var sample = osc.run(1.0, 0.0, 0.0);
            var j = i%100;
            if (expected[j] != undefined && !approx(expected[j], sample, 1/65536/65536))
                errors.push(`Sample at ${i} is ${sample}, expected ${expected[j]}`);
        }
        test('Osc should generate a 480Hz triangle', ctx => ctx.assert(errors, 'empty'));

        osc.reset();
        osc.wave.set(psynth.Osc.waveforms.SAW);
        osc.psw.set(0.5);
        // generate 1 sec of sample
        expected = { 0: -1, 25: 0, 50: -1, 75: -1 };
        errors = [];
        for (var i=0; i<SAMPLE_RATE/100; i++) {
            var sample = osc.run(1.0, 0.0, 0.0);
            var j = i%100;
            if (expected[j] != undefined && !approx(expected[j], sample, 1/65536/65536))
                errors.push(`Sample at ${i} is ${sample}, expected ${expected[j]}`);
        }
        test('Osc should generate a 480Hz saw', ctx => ctx.assert(errors, 'empty'));

        osc.reset();
        osc.wave.set(psynth.Osc.waveforms.PULSE);
        // generate 1 sec of sample
        expected = { 0: 1, 25: 1, 50: -1, 75: -1 };
        errors = [];
        for (var i=0; i<SAMPLE_RATE/100; i++) {
            var sample = osc.run(1.0, 0.0, 0.0);
            var j = i%100;
            if (expected[j] != undefined && !approx(expected[j], sample, 1/65536/65536))
                errors.push(`Sample at ${i} is ${sample}, expected ${expected[j]}`);
        }
        test('Osc should generate a 480Hz pulse', ctx => ctx.assert(errors, 'empty'));
    }

    var _isDone = false;
    async function run(callback) {
        _isDone = false;
        sound.init(SAMPLE_RATE,
            function fillBuffer(left, right, bufferSize, channel) {
                _isDone = !callback(left, right, bufferSize, channel);
            }
        );

        var button = addButton('Start', function() {
            if (!sound.isRunning) {
                this.innerHTML = 'Stop';
                sound.start();
            } else {
                _isDone = true;
            }
        });

        await poll( () => _isDone, 10);
        sound.stop();
        button.innerHTML = 'Done';
    }

    async function test_generate_sound_simple() {
        message('Test generate sound', 1);
        var synth = new psynth.Synth(SAMPLE_RATE, 1);
        loadPreset(synth, 'synth/preset.json');
        synth.isActive = true;
        synth.setNote(36, 1.0);
        await run((left, right, bufferSize) => {
            for (var i=0; i<bufferSize; i++) left[i] = right[i] = 0.0;
            synth.run(left, right, 0, bufferSize)
            return true;
        });
    }

    function createFrames(adapter) {
        var list = [];
        var frames = [];
        {
            // frame #1-on
            var frame = new Ps.Frame(); frame.delta = 0;
            //frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETPROGRAM, 0));
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 240));
            frames.push(frame);
            // frame #1-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);
            // frame #2-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 200));
            frames.push(frame);
            // frame #2-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);
            // frame #3-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 48, 200));
            frames.push(frame);
            // frame #3-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 48, 0));
            frames.push(frame);
            // frame #4-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 200));
            frames.push(frame);
            // frame #4-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);

            // frame #5-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 240));
            frames.push(frame);
            // frame #5-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);
            // frame #6-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 43, 200));
            frames.push(frame);
            // frame #6-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 43, 0));
            frames.push(frame);
            // frame #7-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 200));
            frames.push(frame);
            // frame #7-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);
            // frame #8-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 200));
            frames.push(frame);
            // frame #8-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);

            // frame #9-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 46, 240));
            frames.push(frame);
            // frame #9-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 46, 0));
            frames.push(frame);
            // frame #10-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 200));
            frames.push(frame);
            // frame #10-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);
            // frame #11-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 200));
            frames.push(frame);
            // frame #11-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);
            // frame #12-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 45, 200));
            frames.push(frame);
            // frame #12-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 45, 0));
            frames.push(frame);

            // frame #13-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 240));
            frames.push(frame);
            // frame #13-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);
            // frame #14-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 200));
            frames.push(frame);
            // frame #14-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 36, 0));
            frames.push(frame);
            // frame #15-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 43, 200));
            frames.push(frame);
            // frame #15-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 43, 0));
            frames.push(frame);
            // frame #16-on
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 41, 200));
            frames.push(frame);
            // frame #16-off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 41, 0));
            frames.push(frame);
            // frame #17-end
            frame = new Ps.Frame(); frame.delta = 2;
            frames.push(frame);

            list.push(frames);
        }

        {
            frames = [];
            var frame = new Ps.Frame(); frame.delta = 0;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 0, 240));
            frames.push(frame);
            frame = new Ps.Frame(); frame.delta = 8;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 0, 0));
            frames.push(frame);

            frame = new Ps.Frame(); frame.delta = 8;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 0, 240));
            frames.push(frame);
            frame = new Ps.Frame(); frame.delta = 8;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 0, 0));
            frames.push(frame);

            frame = new Ps.Frame(); frame.delta = 8;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 0, 240));
            frames.push(frame);
            frame = new Ps.Frame(); frame.delta = 12;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 0, 0));
            frames.push(frame);

            frame = new Ps.Frame(); frame.delta = 4;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 0, 240));
            frames.push(frame);
            frame = new Ps.Frame(); frame.delta = 8;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 0, 0));
            frames.push(frame);

            frame = new Ps.Frame(); frame.delta = 8;
            frame.commands.push(adapter.makeCommand(Ps.Player, Ps.Player.EOS));
            frames.push(frame);

            list.push(frames);
        }
        
        return list;
    }

    function createSequences(player) {
        var sequences = [];
        // MASTER sequence
        var sequence = new Ps.Sequence(player.adapters[Ps.Player.getInfo().id]);
        // Frame #1
        sequence.writeDelta(0);
        sequence.stream.writeStream(player.makeCommand(Ps.Player.ASSIGN, 1, 1, 0, 4));
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(4*64);
        sequence.writeEOS();
        sequences.push(sequence);

        var adapter = player.addAdapter(psynth.SynthAdapter);
        var frameList = createFrames(adapter);
        sequence = Ps.Sequence.fromFrames(frameList[0], adapter);
        sequences.push(sequence);
        sequence = Ps.Sequence.fromFrames(frameList[1], adapter);
        sequences.push(sequence);

        return sequences;
    }

    async function createDataBlocks(adapter) {
        var playerAdapterInit = new Stream([1, Ps.Player.Device.CHANNEL]);

        var synthAdapterInit = new Stream(128)
            .writeUint16(SAMPLE_RATE)
            .writeUint8(1)      // 1 device
                .writeUint8(psynth.SynthAdapter.Device.SYNTH)
                .writeUint8(1)  // voice count
                .writeUint8(2); // preset in data block #2

        // create preset in data block #2
        var synthPreset = new Stream(128);
        var preset = await load('synth/preset.json');
        var instrumentKeys = Object.keys(preset.data);
        // HEADER
        //  00 instrument count        (1)
        //  01 1st instrument's name  (14)
        //  15 1st instrument's offset (2)
        //  ...
        synthPreset.writeUint8(instrumentKeys.length);
        var offset = 1 + (14+2)*instrumentKeys.length;
        var instrumentData = new Stream(128);
        for (var ii=0; ii<instrumentKeys.length; ii++) {
            var name = instrumentKeys[ii]
            synthPreset.writeString(name.substring(0, 13));
            if (name.length < 13) synthPreset.writeBytes(0, 13-name.length);
            synthPreset.writeUint16(offset);
            var instrument = preset.data[name];
            var controlkeys = Object.keys(instrument);
            // control count
            instrumentData.writeUint8(controlkeys.length);
            offset++;
            for (var ki=0; ki<controlkeys.length; ki++) {
                var key = controlkeys[ki];
                var controlId = psynth.Synth.controls[key.replace('.', '')];
                instrumentData.writeUint8(controlId);
                offset++;
                var command = adapter.makeSetCommandForController(controlId, instrument[key]);
                instrumentData.writeStream(command, 2);
                offset += command.length - 2;
            }
        }
        synthPreset.writeStream(instrumentData);

        return [
            playerAdapterInit,
            synthAdapterInit,
            synthPreset
        ];
    }

    async function createPlayer() {
        var player = Ps.Player.create();
        var adapter = player.addAdapter(psynth.SynthAdapter);
        player.sequences = createSequences(player);
        player.dataBlocks = await createDataBlocks(adapter);
        return player;
    }

    function test_synthAdapter_makeSetCommandForContoller() {
        message('Test SynthAdapter.makeSetCommandForContoller', 1);
        var adapter = new psynth.SynthAdapter();
        var command;

        command = adapter.makeSetCommandForController(psynth.Synth.controls.lfo1wave, 123.5);
        var expected = new Stream(16).writeUint8(psynth.SynthAdapter.SETUINT8).writeUint8(psynth.Synth.controls.lfo1wave).writeUint8(123);
        test("Command for 'lfo1wave' should be correct", ctx => ctx.assert(command, ':=', expected));

        command = adapter.makeSetCommandForController(psynth.Synth.controls.env1atk, 123.5/256);
        var expected = new Stream(16).writeUint8(psynth.SynthAdapter.SETFLOAT8).writeUint8(psynth.Synth.controls.env1atk).writeUint8(123);
        test("Command for 'env1atk' should be correct", ctx => ctx.assert(command, ':=', expected));

        command = adapter.makeSetCommandForController(psynth.Synth.controls.lfo1dc, 123.5);
        var expected = new Stream(16).writeUint8(psynth.SynthAdapter.SETFLOAT).writeUint8(psynth.Synth.controls.lfo1dc).writeFloat32(123.5);
        test("Command for 'lfo1dc' should be correct", ctx => ctx.assert(command, ':=', expected));
    }

    async function test_synthAdapter_prepareContext() {
        message('Test SynthAdapter prepareContext', 1);
        var player = Ps.Player.create();
        var adapter = player.addAdapter(psynth.SynthAdapter);
        player.dataBlocks = await createDataBlocks(adapter);
        adapter.prepareContext(player.dataBlocks[1]);

        var synth = adapter.devices[0];
        test('A synth should have been created', ctx => ctx.assert(synth instanceof psynth.Synth, 'true'));
        test('Synth should have 1 voice', ctx => ctx.assert(synth.voices.length, '=', 1));
        test('Synth\'s sound bank should be data block #2', ctx => ctx.assert(synth.soundBank, '=', player.dataBlocks[2]));
    }

    async function test_synthAdapter_makeCommands() {
        message('Test SynthAdapter make commands', 1);
        var player = Ps.Player.create();
        var adapter = player.addAdapter(psynth.SynthAdapter);
        var frames = createFrames(adapter);
        test('Sequence should contain 33 frames', ctx => ctx.assert(frames.length, '=', 33));
        for (var i=1; i<32; i++) {
            test(`Frame #${i} should contain a SETNOTE command`, ctx => {
                ctx.assert(frames[i].commands.length, '=', 1);
                ctx.assert(frames[i].commands[0].readUint8(), '=', psynth.SynthAdapter.SETNOTE);
            });
        }
    }

    var _frame = 0;
    var _bpm = 72;
    var _samplePerFrame = 0;

    function setBpm(bpm) {
        _bpm = bpm;
        _samplePerFrame = SAMPLE_RATE*3.75/_bpm;
    }

    function channelBasedFillBuffer(left, right, bufferSize, channel) {
        var start = 0;
        var end = 0;
        var remains = bufferSize;
        for (var i=0; i<bufferSize; i++) {
            left[i] = .0;
            right[i] = .0;
        }
        while (remains) {
            var frameInt = Math.floor(_frame);
            if (frameInt == 0) {
                if (!channel.run(1)) {
                    // reset
                    channel.loopCount = 2;
                    channel.reset();
                    channel.run(1)
                }
                _frame += _samplePerFrame;
            }
            var len = _frame < remains ? frameInt : remains;
            end = start + len;
            _frame -= len;
            var adapter = channel.adapter;
            for (var i=0; i<adapter.devices.length; i++) {
                adapter.devices[i].run(left, right, start, end);
            }
            start = end;
            remains -= len;
        }
        return channel.isActive;
    }

    function playerBasedFillBuffer(left, right, bufferSize, player) {
        var start = 0;
        var end = 0;
        var remains = bufferSize;
        for (var i=0; i<bufferSize; i++) {
            left[i] = .0;
            right[i] = .0;
        }
        while (remains) {
            var frameInt = Math.floor(_frame);
            if (frameInt == 0) {
                if (!player.run(1)) {
                    //player.reset();
                }
                _frame += _samplePerFrame;
            }
            var len = _frame < remains ? frameInt : remains;
            end = start + len;
            _frame -= len;
            var adapter = player.adapters[psynth.SynthAdapter.getInfo().id];
            for (var i=0; i<adapter.devices.length; i++) {
                adapter.devices[i].run(left, right, start, end);
            }
            start = end;
            remains -= len;
        }
        return player.isActive;
    }

    async function test_run_channel() {
        message('Test run channelwith SynthAdapter', 1);
        var player = await createPlayer();
        var adapter = player.adapters[psynth.SynthAdapter.getInfo().id];
        //player.dataBlocks = await createDataBlocks(_adapter);
        adapter.prepareContext(player.dataBlocks[1]);
        var synth = adapter.devices[0];
        loadPreset(synth, 'synth/preset.json');
        synth.isActive = true;

        // create test channel
        var channel = player.createDevice(Ps.Player.Device.CHANNEL, null);
        channel.assign(0, player.sequences[1]);
        channel.loopCount = 16;

        // var stream = Ps.Player.createBinaryData(
        //     player,
        //     () => [ [psynth.SynthAdapter.getInfo().id, 1] ]
        // );
        // stream.toFile('test-data.bin', 'application/octet-stream');
        await run((left, right, bufferSize) => channelBasedFillBuffer(left, right, bufferSize, channel));
    }

    async function test_complete_player() {
        message('Test complete player', 1);
        // register adapter types
        Ps.Player.registerAdapter(Ps.Player);
        Ps.Player.registerAdapter(psynth.SynthAdapter);
        // create player
        var player = Ps.Player.create();
        // load binary data, prepare adapters
        await player.load('synth/test-data.bin');
        test('Player should have 2 adapters: playerAdapter and synthAdapter', ctx => {
            ctx.assert(Object.keys(player.adapters).length, '=', 2);
            ctx.assert(Object.values(player.adapters)[0] instanceof Ps.Player, 'true');
            ctx.assert(Object.values(player.adapters)[1] instanceof psynth.SynthAdapter, 'true');
        });
        test('Player should have 2 channels', ctx => {
            ctx.assert(player.channels.length, '=', 2);
        });
        test('Player adapter should have 3 devices: 1 player, 2 channels', ctx => {
            ctx.assert(player.devices.length, '=', 3);
            ctx.assert(player.devices[0], '=', player);
            ctx.assert(player.devices[1].constructor, '=', Ps.Channel);
            ctx.assert(player.devices[2].constructor, '=', Ps.Channel);
        });
        var synthAdapter = player.adapters[psynth.SynthAdapter.getInfo().id];
        test('Synth adapter should have 1 device: Synth', ctx => {
            ctx.assert(synthAdapter.devices.length, '=', 1);
            ctx.assert(synthAdapter.devices[0] instanceof psynth.Synth, 'true');
        });

        await run((left, right, bufferSize) => playerBasedFillBuffer(left, right, bufferSize, player));

        // player.start();
        // await poll( () => !player.isActive, 100);
    }
    
    var App = {
        bpm: 60,
        channel: null,

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

        fillBuffer: function fillBuffer(left, right, bufferSize, ch) {
            _isDone = !channelBasedFillBuffer(left, right, bufferSize, App.channel);
        }
    };

    setBpm(App.bpm);

    async function test_synth_control() {
        message('Test synth ui', 1);

        //#region init glui
        glui.scale.x = 0.8;
        glui.scale.y = 0.8;

        glui.initialize(App, true);
        await glui.setRenderingMode(glui.Render2d);
        glui.buildUI(App);
        //#endregion

        //#region create synth, sound playback
        var player = Ps.Player.create();
        var adapter = player.addAdapter(psynth.SynthAdapter);
        sound.init(48000, this.fillSoundBuffer);
        // create dummy sequence
        var frames = [];
        var delta = 0;
        for (var i=0; i<16; i+=2) {
            // frame on
            var frame = new Ps.Frame(); frame.delta = delta; delta = 6;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 24, 240));
            frames.push(frame);
            // frame off
            frame = new Ps.Frame(); frame.delta = 2;
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, 24, 0));
            frames.push(frame);
        }
        // EOS
        var frame = new Ps.Frame(); frame.delta = delta;
        frames.push(frame);
        var adapter = player.adapters[psynth.SynthAdapter.getInfo().id];
        var sequence = Ps.Sequence.fromFrames(frames, adapter);
        var sequences = [sequence];
        player.sequences = sequences;

        var synth = new psynth.Synth(sound.smpRate, 6);
        adapter.devices.push(synth);
        loadPreset(synth, 'synth/preset.json');
        synth.isActive = true;

        // create test channel
        App.channel = player.createDevice(Ps.Player.Device.CHANNEL, null);
        App.channel.assign(0, player.sequences[0]);
        App.channel.loopCount = 16;
        //#endregion

        //#region create playback controls
        res = await load('synth/ui/controls.layout.json');
        if (res.error) throw res.error;
        var template = res.data;
        template.type = 'Panel';
        var controls = await glui.create('controls', template, null, App);
        await controls.build();
        controls.move(10, 60);
        controls.getControlById('bpm').dataBind(App, 'bpm');
        controls.render();
        // #endregion

        //#region create synth UI
        var res = await load('synth/ui/synth.layout.json');
        if (res.error) throw res.error;
        var template = res.data;
        template.type = 'Panel';
        var synthUi = await glui.create('synth1', template, null, null);
        await synthUi.build(synth);
        synthUi.move(10, controls.top + controls.height + 4);
        synthUi.render();
        //#endregion

        //#region create Score-Control
        var score = await glui.create('score', {
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
        }, null, null);
        score.unitX = 4;
        score.scaleX = synthUi.width / 64;
        var width = Math.floor(score.scaleX*score.unitX)*16;
        var bw = synthUi.width - width;
        score.style.border = `#000000 ${bw/2}px solid`;
        score.style.width = width + bw;
        score.unitY = 12;
        score.style.height = score.unitY*36;
        score.renderer.initialize(score, glui.renderingContext);
        score.scaleRangeX[0] = score.scaleRangeX[1] = score.scaleX;
        score.scaleY = 1.5;
        score.setScale();
        score.scrollTop = score.stepY * 24;
        score.move(10, synthUi.top + synthUi.height + 4);
        score.assignChannel(App.channel);
        score.render();
        //#endregion

        test('Should create and bind all UI controls', ctx => {
            for (var i in psynth.Synth.controls) {
                var ctrl = synth.getControl(psynth.Synth.controls[i]);
                var ui = synthUi.items.find(x => x.id == i);
                if (!ui) {
                    var grp = synthUi.items.find(x => i.startsWith(x.id));
                    ui = grp.items.find(x => i.endsWith(x.id));
                }
                if (!ui) continue;
                ctx.assert(ui && ui.dataSource instanceof DataLink && ui.dataSource.obj == ctrl && ui.dataField == 'value', 'true');
            }
        });

        glui.animate();

        sound.init(SAMPLE_RATE, App.fillBuffer);

        _isDone = false;
        var button = addButton('End', () => _isDone = true);
        await poll( () => _isDone, 10);
        sound.stop();
        button.innerHTML = 'Done';

        glui.shutdown();
    }

    var tests = () => [
        // test_freqTable,
        // test_control_labels,
        // test_create_synth,
        // test_run_env,
        // test_osc_run,
        // test_generate_sound_simple,
        // //test_synthAdapter_makeSetCommandForContoller,
        // test_synthAdapter_prepareContext,
        // test_synthAdapter_makeCommands,
        // test_run_channel,
        // test_complete_player,
        // test_synthAdapterToDataSeries/*, test_synthAdapterFromDataSeries, test_synth_Ui_binding, test_synth_fromPreset*/

        test_synth_control
    ];

    publish(tests, 'Synth tests');
})();