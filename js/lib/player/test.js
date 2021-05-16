include('./player-lib.js');

(function(){

    function TestAdapter(player) {
        TestAdapter.base.constructor.call(this, player);
    };
    extend(Ps.IAdapter, TestAdapter);

    TestAdapter.info = {name: '_TestAdapter', id: 1};
    TestAdapter.getInfo = () => TestAdapter.info;
    //TestAdapter.prototype.prepareContext = function(data, dataBlocks) { Dbg.prln('Prepare context'); };
    TestAdapter.prototype.createDeviceImpl = function createDeviceImpl(deviceType, initData) {
        var device = null;
        switch (deviceType) {
            case TestAdapter.DIV:
                device = document.getElementById('testTarget') || document.createElement('div');
                device.id = 'testTarget';
                device.style.position = 'absolute';
                device.style.left = initData.readUint16()+'px'; device.style.top = initData.readUint16()+'px';
                device.style.textAlign = 'center';
                device.style.width = '4em'; device.style.height = '1.5em';
                device.style.border = 'solid 2px yellow';
                device.style.fontFamily = 'Verdana';
                device.style.fontSize = '24pt';
                device.style.fontWeight = 'bold';
                device.style.color = 'cyan';
                device.style.zIndex = 1000;
                device.style.backgroundColor = 'silver';
                document.body.appendChild(device);
                break;
        }
        return device;
    };
    TestAdapter.prototype.processCommand = function(device, command, sequence, cursor) {
        var colors = [
            '#000080', '#0000ff', '#0080ff', '#80ffff', '#ffffff'
        ];
        switch (command) {
            case TestAdapter.SETTEXT:
                var text = '', c = null;
                while ((c = String.fromCharCode(sequence.getUint8(cursor++))) != '\0') text += c;
                device.innerHTML = text;
                break;
            case TestAdapter.SETINK:
                var c = sequence.getUint8(cursor++);
                device.style.color = colors[c % colors.length];
                break;
        }
        return cursor;
    };
    TestAdapter.prototype.updateRefreshRate = function(device, command) { throw new Error('Not implemented!'); };

    TestAdapter.prototype.makeCommand = function(command)  {
        var stream = new Stream(128);
        stream.writeUint8(command);
        var inputStream = null;
        if (arguments[1] instanceof Ps.Sequence) inputStream = arguments[1].stream;
        else if (arguments[1] instanceof Stream) inputStream = arguments[1];
        switch (command) {
            case TestAdapter.SETTEXT:
                if (inputStream) {
                    stream.writeString(inputStream.readString(arguments[2]));
                } else {
                    stream.writeString(arguments[1]);
                }
                break;
            case TestAdapter.SETINK:
                if (inputStream) {
                    stream.writeUint8(inputStream.readUint8(arguments[2]));
                } else {
                    stream.writeUint8(arguments[1]);
                }
                break;
        }
        return new Stream(stream);
    };
    TestAdapter.SETTEXT = 2;
    TestAdapter.SETINK = 3;

    TestAdapter.DIV = 0;

    function createPlayer() {
        var player = Ps.Player.create();
        var adapter = player.addAdapter(TestAdapter);
        adapter.label = 'TestAdapter01';
        player.sequences = createSequences(player);
        player.dataBlocks = createDataBlocks();
        return player;
    }

    function createTestChannel(player, id) {
        var channel = player.createDevice(Ps.Player.Device.CHANNEL, null);
        channel.id = id;
        channel.assign(0, player.sequences[1]);
        channel.loopCount = 0;
        channel.isActive = true;
        return channel;
    }

    function createSequences(player) {
        var sequences = [];

        // MASTER sequence
        var sequence = new Ps.Sequence(player.adapters[Ps.Player.getInfo().id]);
        // Frame #1
        sequence.writeDelta(0);
        sequence.writeCommand(Ps.Player.ASSIGN); sequence.writeUint8(1); sequence.writeUint8(1); sequence.writeUint8(0);
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(96);
        sequence.writeEOS();
        sequences.push(sequence);

        // Sequence #1
        sequence = new Ps.Sequence(player.adapters[TestAdapter.getInfo().id]);
        // Frame #1
        sequence.writeDelta(0);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.1');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(0);
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.2');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(1);
        sequence.writeEOF();
        // Frame #3
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.3');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(2);
        sequence.writeEOF();
        // Frame #4
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.4');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(3);
        sequence.writeEOF();
        // Frame #5
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('End');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(4);
        sequence.writeEOF();
        // Frame #6
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(0);
        sequence.writeEOS();
        sequences.push(sequence);

        // Sequence #2
        sequence = new Ps.Sequence(player.adapters[TestAdapter.getInfo().id]);
        // Frame #1
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq2.1');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(4);
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq2.2 - End');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(2);
        sequence.writeEOS();
        sequences.push(sequence);

        // Sequence #3
        sequence = new Ps.Sequence(player.adapters[TestAdapter.getInfo().id]);
        // Frame #1
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq3.1');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(1);
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq3.2 - End');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(3);
        sequence.writeEOS();
        sequences.push(sequence);
        return sequences;
    }

    function createDataBlocks() {
        return [
            new Stream([1, Ps.Player.Device.CHANNEL]),
            new Stream(16).writeUint8(1).writeUint8(TestAdapter.DIV).writeUint16(120).writeUint16(200),
            new Stream(16).writeString('Hello world!')
        ];
    }

    async function run(callback, timeout) {
        var timer = -1;
        function loop(resolve) {
            clearTimeout(timer);
            if (callback()) {
                timer = setTimeout(loop, timeout, resolve);
            } else {
                resolve(1);
            }
        }
        return new Promise(resolve => loop(resolve));
    }

    function test_create_player() {
        var player = Ps.Player.create();
        test('Player should have 1 adapter and 2 devices', ctx => {
            ctx.assert(Object.keys(player.adapters).length, '=', 1);
            ctx.assert(player.adapters[player.getInfo().id], '=', player);
            ctx.assert(player.devices.length, '=', 2);
            ctx.assert(player.devices[0], '=', player);
            ctx.assert(player.devices[1], '=', player.masterChannel);
        });
    }

    function test_sequence_toFrames() {
        message('Test Sequence.toFrames', 1);

        var player = Ps.Player.create();
        player.addAdapter(TestAdapter);
        var sequence = createSequences(player)[1];
        var frames = sequence.toFrames();

        test('Frame count should be 6', ctx => {
            ctx.assert(frames.length, '=', 6);
        });

        for (var fi=1; fi<5; fi++) {
            var frame = frames[fi];
            message('Check frame #'+fi, 1);
            test('Delta should be 16', ctx => ctx.assert(frame.delta, '=', 16));
            test('Frame should have 2 commands', ctx => ctx.assert(frame.commands.length, '=', 2));
            test('First command should be SetText', ctx => ctx.assert(frame.commands[0].readUint8(0), '=', TestAdapter.SETTEXT));
            _indent--;
        }

        message('Check frame #6', 1);
        var frame = frames[5];
        test('Delta should be 16', ctx => ctx.assert(frame.delta, '=', 16));
        test('Should have 1 command', ctx => ctx.assert(frame.commands.length, '=', 1));
        test('Command should be SetInk', ctx => ctx.assert(frame.commands[0].readUint8(0), '=',TestAdapter.SETINK));
    }

    function test_sequence_fromFrames() {
        message('Test Sequence.fromFrames', 1);
        var player = Ps.Player.create();
        var adapter = player.addAdapter(TestAdapter);
        var sequence1 = createSequences(player)[1];
        var frames = sequence1.toFrames();
        var sequence2 = Ps.Sequence.fromFrames(frames, adapter);
        Dbg.prln('Input:\n' + sequence1.stream.dump(32));
        Dbg.prln('Output:\n' + sequence2.stream.dump(32));
        test('Sequence should be created from frames successfully', ctx => ctx.assert(sequence1.stream, ':=', sequence2.stream));
    }

    function test_binary(stream, player) {
        test('Binary data should contain 1 adapter, 4 sequences and 3 data block', ctx => {
            var offset = stream.readUint16(2);              // offset to adapter list
            ctx.assert(offset, '=', 8);
            ctx.assert(stream.readUint8(offset), '=', 1);   // adapter count should be 1
            offset = stream.readUint16(4);                  // offset to sequence table
            ctx.assert(offset, '=', 11);
            ctx.assert(stream.readUint16(offset), '=', 4);  // sequence count
            offset = stream.readUint16(6);                  // offset to data block table
            ctx.assert(offset, '=', 29);
            ctx.assert(stream.readUint16(offset), '=', 3);  // data block count
        });
        test('Adapter should be TestAdapter with init data block id #0', ctx => {
            ctx.assert(stream.readUint8(9), '=', TestAdapter.getInfo().id);
            ctx.assert(stream.readUint8(11), '=', 0);
        });
        test('Sequence #1 should consist of 6 frames, frames #1-#5 with 2 commands each', ctx => {
            var offset = stream.readUint16(17);
            ctx.assert(offset, '=', 66);
            var length = stream.readUint16(19);
            ctx.assert(length, '=', 68);
            var sequence = player.createSequence(stream, offset, length);
            var frames = sequence.toFrames();
            ctx.assert(frames.length,'=', 6);
            ctx.assert(frames[0].commands.length, '=', 2);
            ctx.assert(frames[1].commands.length, '=', 2);
            ctx.assert(frames[2].commands.length, '=', 2);
            ctx.assert(frames[3].commands.length, '=', 2);
            ctx.assert(frames[4].commands.length, '=', 2);
        });
    }

    function test_create_binary() {
        message('Should create binary data', 1);
        var player = createPlayer();
        var stream = Ps.Player.createBinaryData(
            player,
            () => [ [TestAdapter.getInfo().id, 1] ]        // test adapter with data block #1 for initialization
        );
        test_binary(stream, player);
        // stream.toFile('test-data.bin', 'application/octet-stream');
    }

    async function test_load_binary() {
        message('Should load binary data', 1);
        stream = await Stream.fromFile('/lib/player/test-data.bin');
        test_binary(stream, createPlayer());
    }

    function test_create_channel() {
        message('Test create channel', 1);
        var player = createPlayer();
        var adapter = player.adapters[TestAdapter.getInfo().id];
        var channel = createTestChannel(player, 'testChannel');
        test('Channel should use TestAdapter', ctx => {
            ctx.assert(channel.adapter, '=', adapter);
        });
        test('Channel should use device #0', ctx => {
            ctx.assert(channel.device, '=', adapter.devices[0]);
        });
    }

    async function test_run_channel() {
        message('Test run channel', 1);
        var player = createPlayer();
        player.adapters[TestAdapter.getInfo().id].prepareContext(player.dataBlocks[1]);
        var channel = createTestChannel(player, 'testChannel');
        channel.loopCount = 1;
        await run(() => channel.run(1) , 40);
        test('Playback should terminate as expected', async function(ctx) {
            ctx.assert(channel.device.innerHTML, '=', 'End');
        });
    }

    async function test_run_player() {
        message('Test run player', 1);
        var player = createPlayer();
        var adapter = player.adapters[TestAdapter.getInfo().id];
        // init adapters
        player.prepareContext(player.dataBlocks[0]);
        adapter.prepareContext(player.dataBlocks[1]);

        test('Player should have 2 channels', ctx => {
            ctx.assert(player.channels.length, '=', 2);
        });
        test('TestAdapter should have 1 device', ctx => {
            ctx.assert(adapter.devices.length, '=', 1);
        });

        player.masterChannel.assign(0, player.sequences[0]);
        test('Player should assign itself to its master channel as device', ctx => {
            ctx.assert(player.masterChannel.device, '=', player);
        });

        await run(() => player.run(1), 20);
        test('Playback should terminate as expected', async function(ctx) {
            ctx.assert(adapter.devices[0].innerHTML, '=', 'End');
        });
    }

    async function test_complete_player() {
        message('Test complete player', 1);
        // register adapter types
        Ps.Player.registerAdapter(Ps.Player);
        Ps.Player.registerAdapter(TestAdapter);
        // create player
        var player = Ps.Player.create();
        // load binary data, prepare adapters
        await player.load('player/test-data.bin');

        test('Player should have 2 adapters', ctx => {
            ctx.assert(Object.keys(player.adapters).length, '=', 2);
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

        await run(() => player.run(1), 20);
        test('Playback should terminate as expected', async function(ctx) {
            ctx.assert(player.channels[1].device.innerHTML, '=', 'End');
        });
    }

    var tests = () => [
        test_create_player,
        test_sequence_toFrames,
        test_sequence_fromFrames,
        test_create_binary,
        test_load_binary,
        test_create_channel,
        test_run_channel,
        test_run_player,
        test_complete_player
    ];

    publish(tests, 'Player tests');
})();
