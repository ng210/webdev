include('player-lib.js');

(function(){

    function TestAdapter() {

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
                device.style.width = '20em'; device.style.height = '2em';
                device.style.border = 'solid 2px yellow';
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
            '#0000ff', '#4080ff', '#80ffff', '#c080ff', '#ff00ff'
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

    var App = {
        stream: null,
        player: null,
        channel: null,
        sequence: null,
        timer: null,

        sequences: null,

        createSequences: function createSequences() {
            this.sequences = [];

            // MASTER sequence
            var sequence = new Ps.Sequence(Ps.Player.adapters[Ps.Player.getInfo().id]);
            // Frame #1
            sequence.writeDelta(0);
            sequence.writeCommand(Ps.Player.ASSIGN); sequence.writeUint8(1); sequence.writeUint8(1); sequence.writeUint8(0);
            sequence.writeEOF();
            // Frame #2
            sequence.writeDelta(96);
            sequence.writeEOS();
            this.sequences.push(sequence);

            // Sequence #1
            sequence = new Ps.Sequence(Ps.Player.adapters[TestAdapter.getInfo().id]);
            // Frame #1
            sequence.writeDelta(16);
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
            this.sequences.push(sequence);
    
            // Sequence #2
            sequence = new Ps.Sequence(Ps.Player.adapters[TestAdapter.getInfo().id]);
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
            this.sequences.push(sequence);
    
            // Sequence #3
            sequence = new Ps.Sequence(Ps.Player.adapters[TestAdapter.getInfo().id]);
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
            this.sequences.push(sequence);
            return this.sequences;
        },

        createDataBlocks: function createDataBlocks() {
            var dataBlocks = [
                new Stream([1, Ps.Player.Device.CHANNEL]),
                new Stream(16).writeUint8(1).writeUint8(TestAdapter.DIV).writeUint16(120).writeUint16(200),
                new Stream(16).writeString('Hello world!')
            ];
            return dataBlocks;
        }
    };

    function test_sequence_toFrames() {
        message('Test Sequence.toFrames', 1);

        Ps.Player.addAdapter(Ps.Player);
        Ps.Player.addAdapter(TestAdapter);
        var sequence = App.createSequences()[1];
        var frames = sequence.toFrames();

        test('Frame count should be 6', ctx => {
            ctx.assert(frames.length, '=', 6);
        });

        var fi = 0;
        for (; fi<5; fi++) {
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

        Ps.Player.addAdapter(Ps.Player);
        var adapter = Ps.Player.addAdapter(TestAdapter);
        var sequence1 = App.createSequences()[1];
        var frames = sequence1.toFrames();
        var sequence2 = Ps.Sequence.fromFrames(frames, adapter);
        Dbg.prln('Input:\n' + sequence1.stream.dump(32));
        Dbg.prln('Output:\n' + sequence2.stream.dump(32));
        test('Sequence should be created from frames successfully', ctx => {
            ctx.assert(sequence1, ':=', sequence2);
        });
    }

    function test_binary() {
        test('Binary data should contain 1 adapter, 4 sequences and 3 data block', ctx => {
            var offset = App.stream.readUint16(2);              // offset to adapter list
            ctx.assert(offset, '=', 8);
            ctx.assert(App.stream.readUint8(offset), '=', 1);   // adapter count should be 1
            offset = App.stream.readUint16(4);                  // offset to sequence table
            ctx.assert(offset, '=', 11);
            ctx.assert(App.stream.readUint16(offset), '=', 4);  // sequence count
            offset = App.stream.readUint16(6);                  // offset to data block table
            ctx.assert(offset, '=', 17);
            ctx.assert(App.stream.readUint16(offset), '=', 3);  // data block count
        });
        test('Adapter should be TestAdapter with init data block id #0', ctx => {
            ctx.assert(App.stream.readUint8(9), '=', TestAdapter.getInfo().id);
            ctx.assert(App.stream.readUint8(11), '=', 0);
        });
        test('Sequence #1 should consist of 6 frames with 2 commands each', ctx => {
            var offset = App.stream.readUint16(13);
            ctx.assert(offset, '=', 27);
            var length = App.stream.readUint16(15);
            ctx.assert(length, '=', 48);
            var sequence = Ps.Sequence.fromStream(App.stream, offset, length);
            var frames = sequence.toFrames();
            ctx.assert(frames.length,'=', 2);
            ctx.assert(frames[0].commands.length, '=', 2);
            ctx.assert(frames[1].commands.length, '=', 2);
        });

    }

    function test_create_binary() {
        message('Should create binary data', 1);
        Ps.Player.addAdapter(Ps.Player);
        Ps.Player.addAdapter(TestAdapter);
        App.stream = Ps.Player.createBinaryData(
            () => [
                    [1, 0]      // test adapter with 1st data block for initialization
            ],
            App.createSequences
            // function createSequences01() {
            //     var sequences = [];
            //     var sequence = new Ps.Sequence(TestAdapter);
            //     sequence.writeHeader();
            //     // Frame #1
            //     sequence.writeDelta(16);    // 2
            //     sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.1 - Hello World!');  // 1+22
            //     sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(1);  // 1+1
            //     sequence.writeEOF();    // 1 => 28
            //     // Frame #2
            //     sequence.writeDelta(16);    // 2
            //     sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.2 - End'); // 1+13
            //     sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(3);  // 1+1
            //     sequence.writeEOS();    // 1 => 19
            //     sequences.push(sequence);   // 19+28=47
            //     return sequences;
            // }
            ,
            App.createDataBlocks
            // function createDataBlocks01() {
            //     var dataBlocks = [];
            //     var dataBlock = new Stream(16);
            //     dataBlock.writeString('Hello world!');
            //     dataBlocks.push(dataBlock);
            //     return dataBlocks;
            // }
        );
        test_binary();
        // App.stream.toFile('test-data.bin', 'application/octet-stream');
    }

    async function test_load_binary() {
        message('Should load binary data', 1);
        Ps.Player.addAdapter(Ps.Player);
        Ps.Player.addAdapter(TestAdapter);
        App.stream = await Stream.fromFile('player/test-data.bin');
        test_binary();
    }

    function test_create_channel() {
        message('Test create channel', 1);

        Ps.Player.addAdapter(Ps.Player);
        var adapter = Ps.Player.addAdapter(TestAdapter);
        var dataBlock = new Stream(16); dataBlock.writeUint16(120); dataBlock.writeUint16(100);
        var device = adapter.createDevice(TestAdapter.DIV, dataBlock);
        var sequence = App.createSequences()[1];
        var channel = new Ps.Channel('testChannel');
        channel.assign(0, sequence);

        test('Channel should use TestAdapter', ctx => {
            ctx.assert(channel.adapter, '=', adapter);
        });
        test('Channel should use device #0', ctx => {
            ctx.assert(channel.device, '=', device);
        });
    }

    async function test_run_channel() {
        message('Test run channel', 1);

        Ps.Player.addAdapter(Ps.Player);
        var adapter = Ps.Player.addAdapter(TestAdapter);
        var dataBlock = new Stream(16); dataBlock.writeUint16(120); dataBlock.writeUint16(100);
        var device = adapter.createDevice(TestAdapter.DIV, dataBlock);
        var sequence = App.createSequences()[1];
        var channel = new Ps.Channel('testChannel');
        channel.assign(0, sequence);
        channel.loopCount = 1;
        channel.isActive = true;

        var timer = -1;
        await (function runChannel()
        {
            function loop(resolve) {
                clearTimeout(timer);
                if (channel.run(1)) {
                    timer = setTimeout(loop, 20, resolve);
                } else {
                    resolve(1);
                }
            }

            return new Promise(resolve => loop(resolve));
        })();
        test('Playback should terminate as expected', async function(ctx) {
            ctx.assert(device.innerHTML, '=', 'End');
        });
    }

    async function test_run_player() {
        message('Test run player', 1);

        var player = Ps.Player.addAdapter(Ps.Player);
        var testAdapter = Ps.Player.addAdapter(TestAdapter);
        var sequences = App.createSequences();
        var testAdapterInit = new Stream(16);
        testAdapterInit.writeUint8(1); testAdapterInit.writeUint8(TestAdapter.DIV);
        testAdapterInit.writeUint16(120); testAdapterInit.writeUint16(200);
        var dataBlocks = [
            new Stream([1, Ps.Player.Device.CHANNEL]),
            testAdapterInit
        ];
        // set up player
        // 1. Add itself as 1st device
        player.devices.push(player);
        // 2. Create master channel
        var masterChannel = player.createDevice(Ps.Player.Device.CHANNEL, null);
        masterChannel.id = 'master';
        masterChannel.loopCount = 1;
        masterChannel.isActive = true;
        // 3. Initialize player: create channels
        player.prepareContext(dataBlocks[0]);
        var masterSequence = sequences[0];
        player.sequences = sequences;
        
        test('Player should create 1 channel device', ctx => {
            ctx.assert(player.devices[1].constructor, '=', Ps.Channel);
        });

        // set up master channel
        masterChannel.assign(0, masterSequence);

        test('Master channel assigns main player as device', ctx => {
            ctx.assert(masterChannel.device, '=', player);
        });

        testAdapter.prepareContext(dataBlocks[1]);
        var device = testAdapter.getDevice(0);

        test('TestAdapter has 1 <i>DIV</i> device', ctx => {
            ctx.assert(testAdapter.devices[0].tagName, '=', 'DIV');
        });

        var timer = -1;
        await (function runPlayer()
        {
            function loop(resolve) {
                clearTimeout(timer);
                if (player.runChannels(1)) {
                    timer = setTimeout(loop, 20, resolve);
                } else {
                    resolve(1);
                }
            }

            return new Promise(resolve => loop(resolve));
        })();

        test('Playback should terminate as expected', async function(ctx) {
            ctx.assert(device.innerHTML, '=', 'End');
        });
    }

    function test_channel_toFrames() {
        var channel = setup();
        channel.toFrames();

        return [
            'Test Channel.toFrames',
            test('Frame count should be 5', () => {
                if (channel.frames.length != 6) return ['Frame count is not 5!'];
            }),
            test('Sequence should be ok', () => {
                var errors = [];
                for (var fi=0; fi<5; fi++) {
                    var frame = channel.frames[fi];
                    if (frame.delta != 16) errors.push(`Frame #${fi+1} delta is not 16!`);
                    if (frame.commands.length != 2) errors.push(`Frame #${fi+1} does not have exactly 2 commands!`);
                    if (frame.commands[0].readUint8(0) != TestAdapter.SETTEXT) errors.push(`Frame #${fi+1} command is not SETTEXT!`);
                }
                return errors;
            }),
            test('Frame #6 should be ok', () => {
                var errors = [];
                var frame = channel.frames[5];
                if (frame.delta != 16) errors.push(`Frame #6 delta is not 16!`);
                if (frame.commands.length != 1) errors.push(`Frame #6 does not have exactly 1 commands!`);
                if (frame.commands[0].readUint8(0) != TestAdapter.SETINK) errors.push(`Frame #6 command is not SETINK!`);
                return errors;
            }),
        ];
    }

    function test_channel_toSequence() {
        var channel = setup();
        channel.toFrames();
        var sequence = channel.sequence;
        channel.toSequence();
        return [
            'Test Channel.toSequence',
            test('Converted stream should match input stream', () => {
                var pos = 0;
                for (var i=0; i<channel.sequence.cursor; i++) {
                    if (sequence.cursor <= i || sequence.getUint8(i) != channel.sequence.getUint8(i)) {
                        return [`Stream does not match at ${pos}`];
                    }
                }
            })
        ];
    }

    function test_channel_insertFrame() {
        var channel = setup();
        channel.toFrames();
        var adapter = channel.adapter;
        var frame = new Ps.Frame();
        frame.delta = 8;
        frame.commands.push(adapter.makeCommand(TestAdapter.SETTEXT, 'New'));
        frame.commands.push(adapter.makeCommand(TestAdapter.SETINK, 4));
        channel.frames.splice(1, 0, frame);
        channel.toSequence();
        //channel.reset();
        channel.loopCount = 1;
        channel.isActive = true;

        return [
            'Test insert frame',
            test('Playback should be correct', () => {
                return startPlayBack(channel);
            })
        ];
    }

    var tests = () => [
        test_sequence_fromFrames,
        test_sequence_toFrames,
        test_create_binary,
        test_load_binary,
        // test_create_channel,
        // test_run_channel,
        // test_run_player,
        // test_complete_player,
        // test_insert_frame,
        // test_remove_frame,
    ];

    public(tests, 'Player tests');
})();
