include('/lib/player/player-lib.js');
include('/lib/player/player-adapter-ext.js');
include('/lib/ge/sound.js');
//include('/lib/glui/glui-lib.js');
include('./synth.js');
//include('./score-control.js');
include('/lib/synth/synth-adapter-ext.js');

(function(){

    const SAMPLE_RATE = 48000;
    const MEASURE = false;

    async function loadPreset(url, synth) {
        var res = await load(url);
        if (res.error instanceof Error) throw new Error(res.error);
        var data = Object.values(res.data)[0];
        if (synth) {
            for (var i in data) {
                var ctrl = getObjectAt(i, synth.controls);
                ctrl.set(data[i]);
            }
        } else {
            return res.data;
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
                //if (synth.controls[j] === 'object') {
                    if (key == j) {
                        isValid = synth.controls[j] instanceof psynth.PotBase;
                        break;
                    }
                    if (key.startsWith(j)) {
                        var subkey = key.substring(j.length)
                        isValid = isValid = synth.controls[j][subkey] instanceof psynth.PotBase;
                        break;
                    }
                //}
            }
            if (!isValid) {
                errors.push(key);
            }
        }
        test('All but 2 (dummy) synth control const names and paths should match', ctx => {
            ctx.assert(errors, ':=', ['lfo1dummy', 'dummy']);
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
            if (!(ctrl instanceof psynth.PotBase) && i != 'osc1note' && i != 'osc2note') {
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
        env.atk.set(255); env.dec.set(255);
        env.sus.set(0.5); env.rel.set(255);

        sample = env.run(1.0);
        test('Envelope should be in IDLE phase', ctx => {
            ctx.assert(sample, '=', 0.5)
            ctx.assert(env.phase, '=', psynth.Env.phase.IDLE)
        });

        // trigger: slope up
        env.setGate(1.0);
        test('Envelope should enter UP phase (slope up)', ctx => ctx.assert(env.phase, '=', psynth.Env.phase.UP));

        // forward 1 seconds
        for (var i=0; i<SAMPLE_RATE; i++) sample = env.run(1.0);
        test('Envelope should switch to DEC phase after 1 second', ctx => {
            ctx.assert(sample.toPrecision(4), '=', '1.000');
            ctx.assert(env.phase, '=', psynth.Env.phase.DEC);
        });

        // forward 0.5 secs
        var susLvl = env.amp.value*env.sus.value + env.dc.value;
        for (var i=0; i<SAMPLE_RATE; i++) sample = env.run(1.0);
        test('Envelope should reach SUS level after 1.5 seconds', ctx => {
            ctx.assert(sample, '=', susLvl);
            ctx.assert(env.phase, '=', psynth.Env.phase.SUS);
        });

        // forward 10 secs
        for (var i=0; i<=10*SAMPLE_RATE+1; i++) sample = env.run(1.0);
        test('Envelope should remain in SUS phase until slope down', ctx => {
            ctx.assert(sample, '=', susLvl);
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
    var _isStopped = false;
    async function run(callback) {
        _isDone = false;
        _isStopped = false;
        sound.init(SAMPLE_RATE,
            function fillBuffer(left, right, bufferSize, channel) {
                _isDone = !callback(left, right, bufferSize, channel);
            }
        );
        await button('Start');
        sound.start();
        addButton('Stop', e => _isStopped = true);
        await poll( () => _isDone || _isStopped);
        sound.stop();
    }

    async function test_generate_sound_simple() {
        message('Test generate sound', 1);
        var synth = new psynth.Synth(SAMPLE_RATE, 1);
        await loadPreset('./res/preset.json', synth);
        synth.isActive = true;
        synth.setNote(16, 1.0);

        await run((left, right, bufferSize) => {
            for (var i=0; i<bufferSize; i++) left[i] = right[i] = 0.0;
            synth.run(left, right, 0, bufferSize)
            return true;
        });
    }

    function createFrames(adapter) {
        var list = [], frames = null;
        //#region sequence #1
        frames = [];
        frames.push(new Ps.Frame().setDelta( 0).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 24, 240)));
        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 24,   0)));

        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 12, 120)));
        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 12,   0)));

        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 27, 160)));
        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 27,   0)));

        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 15, 200)));
        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 15,   0)));

        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 24, 140)));
        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 24,   0)));

        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 12, 200)));
        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 12,   0)));

        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 22, 140)));
        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 22,   0)));

        frames.push(new Ps.Frame().setDelta( 2).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 12, 120)));
        frames.push(new Ps.Frame().setDelta( 1).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 12,   0)));

        frames.push(new Ps.Frame().setDelta( 1).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 15, 150)));
        frames.push(new Ps.Frame().setDelta( 1).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 15,   0)));

        frames.push(new Ps.Frame().setDelta( 1).addCommand(adapter.makeCommand(Ps.PlayerAdapter.EOS)));

        list.push(frames);
        //#endregion

        //#region sequence #2
        frames = [];
        frames.push(new Ps.Frame().setDelta( 0).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 36, 240)));
        frames.push(new Ps.Frame().setDelta( 4).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 36,   0)));

        frames.push(new Ps.Frame().setDelta( 4).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 48, 240)));
        frames.push(new Ps.Frame().setDelta( 4).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 48,   0)));

        frames.push(new Ps.Frame().setDelta( 4).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 48, 240)));
        frames.push(new Ps.Frame().setDelta( 4).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 48,   0)));

        frames.push(new Ps.Frame().setDelta( 4).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 48, 240)));
        frames.push(new Ps.Frame().setDelta( 4).addCommand(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, 48,   0)));

        frames.push(new Ps.Frame().setDelta( 4).addCommand(adapter.makeCommand(Ps.PlayerAdapter.EOS)));

        list.push(frames);
        //#endregion
        
        return list;
    }

    function createSequences(player) {
        var sequences = [];
        // MASTER sequence
        var sequence = new Ps.Sequence(player.adapters[Ps.PlayerAdapter.info.id].adapter);
        sequence.writeHeader();
        // Frame #1
        sequence.writeDelta(0);
        sequence.stream.writeStream(player.adapter.makeCommand(Ps.PlayerAdapter.Commands.Assign, 1, 1, 0, 4));
        //sequence.stream.writeStream(player.makeCommand(Ps.PlayerAdapter.Commands.Tempo, 4*120/60));
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(2*32);
        sequence.writeEOS();
        sequences.push(sequence);
        var adapter = player.adapters[psynth.SynthAdapter.getInfo().id].adapter;
        var frameList = createFrames(adapter);
        sequence = Ps.Sequence.fromFrames(frameList[0], adapter);
        sequences.push(sequence);
        sequence = Ps.Sequence.fromFrames(frameList[1], adapter);
        sequences.push(sequence);

        return sequences;
    }

    async function createDatablocks(adapter) {
        var playerAdapterInit = new Stream([1, Ps.PlayerAdapter.Device.CHANNEL]);

        var synthAdapterInit = new Stream(128)
            .writeUint16(SAMPLE_RATE)
            .writeUint8(1)      // 1 device
                .writeUint8(psynth.SynthAdapter.Device.SYNTH)
                .writeUint8(1)  // voice count
                .writeUint8(2)  // preset in data block #2
                .writeUint8(0); // initial program

        // create preset in data block #2
        var synthPreset = new Stream(128);
        var preset = await loadPreset('./res/preset.json');
        var instrumentKeys = Object.keys(preset);
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
            var instrument = preset[name];
            var controlkeys = Object.keys(instrument);
            // control count
            instrumentData.writeUint8(controlkeys.length);
            offset++;
            for (var ki=0; ki<controlkeys.length; ki++) {
                var key = controlkeys[ki];
                var controlId = psynth.Synth.controls[key.replace('.', '')];
                // instrumentData.writeUint8(controlId);
                // offset++;
                var command = adapter.makeSetCommandForController(controlId, instrument[key]);
                instrumentData.writeStream(command, 1);
                offset += command.length - 1;
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
        player.datablocks = await createDatablocks(adapter);
        player.adapters[1].datablock = 1;
        return player;
    }

    function test_synthAdapter_makeSetCommandForContoller() {
        message('Test SynthAdapter.makeSetCommandForContoller', 1);
        var adapter = new psynth.SynthAdapter();
        var command = null;
        var testData = [
            { ctrlId: 'osc1wave', cmd: 'SetUint8', write: 'writeUint8', in: 123.5, out: 123 },
            { ctrlId: 'osc2fre', cmd: 'SetFloat', write: 'writeFloat32', in: 12.35, out: 12.35 },
            { ctrlId: 'env1atk', cmd: 'SetFloat8', write: 'writeUint8', in: 123.5/256, out: 123 }
        ];

        for (var i=0; i<testData.length; i++) {
            var data = testData[i];
            var command = adapter.makeSetCommandForController(psynth.Synth.controls[data.ctrlId], data.in);
            var expected = new Stream(16).writeUint8(psynth.SynthAdapter.Commands[data.cmd]).writeUint8(psynth.Synth.controls[data.ctrlId])[data.write](data.out);
            test(`Command for '${data.ctrlId}' should be correct`, ctx => ctx.assert(command, ':=', expected));
        }
    }

    async function test_synthAdapter_prepareContext() {
        message('Test SynthAdapter prepareContext', 1);
        var player = Ps.Player.create();
        var adapter = player.addAdapter(psynth.SynthAdapter);
        player.datablocks = await createDatablocks(adapter);
        adapter.prepareContext(player.datablocks[1]);

        var synth = adapter.devices[0];
        test('A synth should have been created', ctx => ctx.assert(synth instanceof psynth.Synth, 'true'));
        test('Synth should have 1 voice', ctx => ctx.assert(synth.voices.length, '=', 1));
        test('Synth\'s sound bank should be data block #2', ctx => ctx.assert(synth.soundBankStream, '=', player.datablocks[2]));
    }

    async function test_synthAdapter_makeCommands() {
        message('Test SynthAdapter make commands', 1);
        var player = Ps.Player.create();
        var adapter = player.addAdapter(psynth.SynthAdapter);
        var frames = createFrames(adapter);
        test('Sequence #0 should contain 19 frames', ctx => ctx.assert(frames[0].length, '=', 19));
        for (var i=1; i<18; i++) {
            test(`Frame #${i} should contain a SetNote command`, ctx => {
                ctx.assert(frames[0][i].commands.length, '=', 1);
                ctx.assert(frames[0][i].commands[0].readUint8(), '=', psynth.SynthAdapter.Commands.SetNote);
            });
        }
    }

    var _frame = 0;
    var _bpm =  82;
    var _samplePerFrame = SAMPLE_RATE*3.75/_bpm;

    function setBpm(bpm) {
        _bpm = bpm;
        // samplingRate / (bpm/60*16) = samplingRate * 60/16 / bpm = samplingRate * 3,75 / bpm
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
                Dbg.pr('.');
                if (!channel.run(1)) break;
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
                Dbg.pr('.');
                if (!player.run(1)) {
                    player.reset();
                    player.run(0)
                    this.currentStep = 0;
                    //break;
                }
                _frame += _samplePerFrame;
            }
            var len = _frame < remains ? frameInt : remains;
            end = start + len;
            _frame -= len;
            var adapter = player.adapters[psynth.SynthAdapter.getInfo().id].adapter;
            for (var i=0; i<adapter.devices.length; i++) {
                adapter.devices[i].run(left, right, start, end);
            }
            start = end;
            remains -= len;
        }
        return player.isActive;
    }

    async function test_run_channel() {
        message('Test run channel with SynthAdapter', 1);
        var player = await createPlayer();
        var adapterInfo = player.adapters[psynth.SynthAdapter.getInfo().id];
        var adapter = adapterInfo.adapter;
        setBpm(86);
        //player.datablocks = await createDatablocks(_adapter);
        adapter.prepareContext(player.datablocks[adapterInfo.datablock]);
        var synth = adapter.devices[0];
        await loadPreset('./res/preset.json', synth);
        synth.isActive = true;

        // create test channel
        var channel = player.adapter.createDevice(Ps.PlayerAdapter.Device.CHANNEL, null);
        channel.assign(0, player.sequences[1]);
        channel.loopCount = 4;

        var stream = Ps.Player.createBinaryData(player);
        // .toFile('test-data.bin', 'application/octet-stream');

        await run((left, right, bufferSize) => channelBasedFillBuffer(left, right, bufferSize, channel));
    }

    async function test_complete_player() {
        message('Test complete player', 1);
        // register adapter types
        Ps.Player.registerAdapter(Ps.PlayerAdapter);
        Ps.Player.registerAdapter(psynth.SynthAdapter);
        // create player
        var player = Ps.Player.create();
        // load binary data, prepare adapters
        await player.load('./res/test-data.bin');
        test('Player should have 2 adapters: playerAdapter and synthAdapter', ctx => {
            ctx.assert(Object.keys(player.adapters).length, '=', 2);
            ctx.assert(Object.values(player.adapters)[0].adapter instanceof Ps.PlayerAdapter, 'true');
            ctx.assert(Object.values(player.adapters)[1].adapter instanceof psynth.SynthAdapter, 'true');
        });
        test('Player should have 2 channels', ctx => {
            ctx.assert(player.adapter.channels.length, '=', 2);
        });
        test('Player adapter should have 3 devices: 1 player, 2 channels', ctx => {
            ctx.assert(player.adapter.devices.length, '=', 3);
            ctx.assert(player.adapter.devices[0], '=', player);
            ctx.assert(player.adapter.devices[1].constructor, '=', Ps.Channel);
            ctx.assert(player.adapter.devices[2].constructor, '=', Ps.Channel);
        });
        var synthAdapter = player.adapters[psynth.SynthAdapter.getInfo().id].adapter;
        test('Synth adapter should have 1 device: Synth', ctx => {
            ctx.assert(synthAdapter.devices.length, '=', 1);
            ctx.assert(synthAdapter.devices[0] instanceof psynth.Synth, 'true');
        });

        _isStopped = false;
        await button('Start');
        sound.start();
        addButton('Stop', e => _isStopped = true);
        await poll( () => !player.isActive || _isStopped);
        sound.stop();


        //await run((left, right, bufferSize) => playerBasedFillBuffer(left, right, bufferSize, player));

        // player.start();
        // await poll( () => !player.isActive, 100);
    }

    async function test_synthAdapter_importscript() {
        header('Test import script');
        Ps.Player.registerAdapter(Ps.PlayerAdapter);
        Ps.Player.registerAdapter(psynth.SynthAdapter);
        //var res = await load('./res/test-script.txt')
        var res = await load('./res/drums1.ssng')
        setBpm(121);
        if (res.error) throw res.error;
        var player = Ps.Player.create();
        var results = null;
        Stream.isLittleEndian = true;
        await measure('import script', async function() { results = await player.adapter.importScript(res.data) }, 1);
        test('Should load script successfully', ctx => {
            ctx.assert(results, 'empty');
            for (var i=0; i<results.length; i++) {
                message(results[i]);
            }
            ctx.assert(player.adapters.length, '=', 2);
            ctx.assert(player.sequences.length, '=', 8);
            ctx.assert(player.datablocks.length, '=', 3);
        });
        var stream = Ps.Player.createBinaryData(player, true);
        //stream.toFile('drums1.bin', 'application/octet-stream');

        _isStopped = false;
        await button('Start');
        sound.start();
        addButton('Stop', e => _isStopped = true);
        await poll( () => !player.isActive || _isStopped);
        sound.stop();
    }
    
    // var App = {
    //     bpm: 60,
    //     channel: null,
    //     synthAdapter: null,

    //     onchange: function onchange(e, ctrl) {
    //         if (ctrl.id == 'bpm') {
    //             setBpm(ctrl.getValue());
    //         } else if (ctrl.id == 'score') {
    //             App.channel.cursor = 0;
    //             // release every voice
    //             var dev = App.channel.device;
    //             for (var i=0; i<dev.voices.length; i++) {
    //                 var voice = dev.voices[i];
    //                 voice.setNote(0, 0);
    //             }
    //             App.channel.sequence = ctrl.getAsSequence(App.synthAdapter);
    //         }
    //     },
    //     onclick: function onclick(e, ctrl) {
    //         if (ctrl.id == 'run') {
    //             if (!sound.isRunning) {
    //                 ctrl.setValue('Stop');
    //                 sound.start();
    //             } else {
    //                 ctrl.setValue('Play');
    //                 sound.stop();
    //             }
    //         }
    //     },

    //     fillBuffer: function fillBuffer(left, right, bufferSize, ch) {
    //         _isDone = !channelBasedFillBuffer(left, right, bufferSize, App.channel);
    //     }
    // };

    // setBpm(App.bpm);

    // async function test_synth_ui() {
    //     message('Test synth ui', 1);

    //     //#region init glui
    //     glui.scale.x = 0.8;
    //     glui.scale.y = 0.8;

    //     glui.initialize(App, true);
    //     await glui.setRenderingMode(glui.Render2d);
    //     glui.buildUI(App);
    //     //#endregion

    //     //#region create synth, sound playback
    //     var player = Ps.Player.create();
    //     var adapter = player.addAdapter(psynth.SynthAdapter.create(player));
    //     sound.init(48000, this.fillSoundBuffer);
    //     // create dummy sequence
    //     var frames = [];
    //     var delta = 0;
    //     var pattern1 = [
    //         0,-1,24,12,  0,-1,12,-1, 0,10,-1,12, 0,15,0,-1
    //     ];
    //     for (var i=0; i<pattern1.length; i++) {
    //         var note = pattern1[i] + 12;
    //         if (pattern1[i] != -1) {
    //             // frame on
    //             var frame = new Ps.Frame(); frame.delta = delta;
    //             frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, note, 240));
    //             frames.push(frame);
    //             // frame off
    //             frame = new Ps.Frame(); frame.delta = 2;
    //             delta = 2;
    //             frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.Commands.SetNote, note, 0));
    //             frames.push(frame);
    //         } else {
    //             delta = 6;
    //         }
    //     }
    //     // EOS
    //     var frame = new Ps.Frame(); frame.delta = delta;
    //     frames.push(frame);
    //     App.synthAdapter = player.adapters[psynth.SynthAdapter.getInfo().id].adapter;
    //     var sequence = Ps.Sequence.fromFrames(frames, App.synthAdapter);
    //     var sequences = [sequence];
    //     player.sequences = sequences;

    //     var synth = new psynth.Synth(sound.smpRate, 6);
    //     App.synthAdapter.devices.push(synth);
    //     await loadPreset('./res/preset.json', synth);
    //     synth.isActive = true;

    //     // create test channel
    //     App.channel = player.createDevice(Ps.Player.Device.CHANNEL, null);
    //     App.channel.assign(0, player.sequences[0]);
    //     App.channel.loopCount = 16;
    //     //#endregion

    //     //#region create playback controls
    //     res = await load('./ui/controls.layout.json');
    //     if (res.error) throw res.error;
    //     var template = res.data;
    //     template.type = 'Panel';
    //     var controls = await glui.create('controls', template, null, App);
    //     await controls.build();
    //     controls.move(10, 60);
    //     controls.getControlById('bpm').dataBind(App, 'bpm');
    //     controls.render();
    //     // #endregion

    //     //#region create synth UI
    //     var res = await load('./ui/synth1.layout.json');
    //     if (res.error) throw res.error;
    //     var template = res.data;
    //     template.type = 'Panel';
    //     var synthUi = await glui.create('synth1', template, null, null);
    //     await synthUi.build(synth);
    //     var polyCtrl = synthUi.items.find(x => x.id == 'poly');
    //     polyCtrl.setValue(synth.voices.length);
    //     polyCtrl.addHandler('change', synthUi,
    //         function(e, ctrl) {
    //             this.boundObject.setVoiceCount(ctrl.getValue());
    //         }
    //     );
    //     synthUi.move(10, controls.top + controls.height + 4);
    //     synthUi.render();
    //     //#endregion

    //     //#region create Score-Control
    //     var score = await glui.create('score', {
    //         'type': 'Score',
    //         'style': {
    //             'color': '#ffd080',
    //             'background-color': '#102040'
    //         },
    //         'scroll-x-min': 0,
    //         'scroll-x-max': 0,
    //         'scroll-y-min': 0,
    //         'scroll-y-max': 48,

    //         'scale-x-min': 0,
    //         'scale-x-max': 0,
    //         'scale-y-min': 0.5,
    //         'scale-y-max': 4,

    //         'insert-mode': 'x-bound',
    //         'drag-mode': 'free',
    //         'curve-mode': 'line'
    //     }, null, null);
    //     score.unitX = 4;
    //     score.scaleX = synthUi.width / 64;
    //     var width = Math.floor(score.scaleX*score.unitX)*16;
    //     var bw = synthUi.width - width;
    //     score.style.border = `#000000 ${bw/2}px solid`;
    //     score.style.width = width + bw;
    //     score.unitY = 12;
    //     score.scaleY = 1.5;
    //     score.style.height = (score.scaleY*score.unitY)*36;
    //     score.renderer.initialize(score, glui.renderingContext);
    //     score.scaleRangeX[0] = score.scaleRangeX[1] = score.scaleX;
    //     score.setScale();
    //     score.scrollTop = score.stepY * 12;
    //     score.move(10, synthUi.top + synthUi.height + 4);
    //     score.setFromSequence(player.sequences[0]);
    //     score.render();
    //     //#endregion

    //     test('Should create and bind all UI controls', ctx => {
    //         for (var i in psynth.Synth.controls) {
    //             var ctrl = synth.getControl(psynth.Synth.controls[i]);
    //             var ui = synthUi.items.find(x => x.id == i);
    //             if (!ui) {
    //                 var grp = synthUi.items.find(x => i.startsWith(x.id));
    //                 if (grp) {
    //                     ui = grp.items.find(x => i.endsWith(x.id));
    //                 }
    //             }
    //             if (!ui) continue;
    //             ctx.assert(ui && ui.dataSource instanceof DataLink && ui.dataSource.obj == ctrl && ui.dataField == 'value', 'true');
    //         }
    //     });

    //     glui.animate();

    //     sound.init(SAMPLE_RATE, App.fillBuffer);

    //     _isDone = false;
    //     var button = addButton('End', () => _isDone = true);
    //     await poll( () => _isDone, 10);
    //     sound.stop();
    //     button.innerHTML = 'Done';

    //     glui.shutdown();
    // }

    var tests = () => [
        test_freqTable,
        test_control_labels,
        test_create_synth,
        test_run_env,
        test_osc_run,
        test_generate_sound_simple,
        test_synthAdapter_makeSetCommandForContoller,
        test_synthAdapter_prepareContext,
        test_synthAdapter_makeCommands,
        test_run_channel,
        test_complete_player,
        test_synthAdapter_importscript,
        // test_synthAdapterToDataSeries/*, test_synthAdapterFromDataSeries, test_synth_Ui_binding, test_synth_fromPreset*/
        // test_synth_ui
    ];

    publish(tests, 'Synth tests');
})();