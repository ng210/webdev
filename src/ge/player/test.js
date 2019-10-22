include('/ge/player/player.js');
(function(){

    function TestAdapter() {

    }
    TestAdapter.prototype = new Player.IAdapter;
    TestAdapter.prototype.info = {name: 'TestAdapter'};
    TestAdapter.prototype.getInfo = function() { return TestAdapter.info; };
    //TestAdapter.prototype.registerCommands = function(registry) { throw new Error('Not implemented!'); };
    TestAdapter.prototype.prepareContext = function(data) { Dbg.prln('Prepare context'); };
    TestAdapter.prototype.createTargets = function(targets, data) {
        var el = document.createElement('div');
        el.id = 'testTarget';
        el.style.position = 'absolute';
        el.style.left = '100px'; el.style.top = '100px';
        el.style.width = '20em'; el.style.height = '2em';
        el.style.border = 'solid 2px yellow';
        el.style.color = 'cyan';
        el.style.zIndex = 1000;
        el.style.backgroundColor = 'silver';
        document.body.appendChild(el);
        targets.push(el);
    };
    TestAdapter.prototype.processCommand = function(target, command, sequence, cursor) {
        var colors = [
            'black', 'white', 'green', 'blue', 'red'
        ];
        switch (command) {
            case TestAdapter.SETTEXT:
                var text = '', c = null;
                while ((c = String.fromCharCode(sequence.getUint8(cursor++))) != '\0') text += c;
                target.innerHTML = text;
                break;
            case TestAdapter.SETINK:
                var c = sequence.getUint8(cursor++);
                target.style.color = colors[c % colors.length];
                break;
        }
        return cursor;
    };
    TestAdapter.prototype.updateRefreshRate = function(target, command) { throw new Error('Not implemented!'); };
    TestAdapter.prototype.getCommandSize = function(command, sequence, cursor) {
        var commandSize = 1;
        switch (command) {
            case TestAdapter.SETTEXT:
                do { commandSize++ } while (String.fromCharCode(sequence.getUint8(cursor++)) != '\0');
                break;
            case TestAdapter.SETINK:
                commandSize++;
                break;
        }
        return commandSize;
    };
    TestAdapter.ID = 0;
    TestAdapter.SETTEXT = 0;
    TestAdapter.SETINK = 1;

    function createPlayer() {
        var testAdapter = new TestAdapter();
        var player = new Player();
        player.adapters.push(testAdapter);
        testAdapter.createTargets(player.targets, null);
        return player;
    }

    function createTestSequence() {
        var sequence = new Player.Sequence(TestAdapter.ID);
        sequence.writeHeader();
        // Frame #1
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('#1');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(0);
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('#2');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(1);
        sequence.writeEOF();
        // Frame #3
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('#3');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(2);
        sequence.writeEOF();
        // Frame #4
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('#4');
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
        return sequence;
    }

    async function startPlayBack(channel) {
        function loop(resolve) {
            clearTimeout(timer);
            if (channel.run(1)) {
                timer = setTimeout(loop, 40, resolve);
            } else {
                var text = channel.player.targets[0].innerHTML == 'End' ? 'Test successful' : 'Test failed';
                resolve(text);
            }
        }
        var timer = null;
        return new Promise(resolve => {
            loop(resolve);
        });
    }

    async function test_channel_run() {
        Dbg.prln('Test Channel.run');
        var player = createPlayer();
        var sequence = createTestSequence();
        var channel = new Player.Channel('test01', player);
        channel.assign(player.targets[0], sequence);
        channel.loopCount = 1;
        channel.isActive = true;
        return startPlayBack(channel);
    }

    function test_channel_toFrames() {
        var errors = [];
        Dbg.prln('Test Channel.toFrames');
        var player = createPlayer();
        var sequence = createTestSequence();
        var channel = new Player.Channel('test01', player);
        channel.assign(player.targets[0], sequence);
        channel.toFrames();
        // check frames
        if (channel.frames.length != 6) errors.push('Frame count is not 5!');
        for (var i=0; i<5; i++) {
            var frame = channel.frames[i];
            if (frame.delta != 16) errors.push(`Frame #${i+1} delta is not 16!`);
            if (frame.commands.length != 2) errors.push(`Frame #${i+1} does not have exactly 2 commands!`);
            if (frame.commands[0].getUint8(0) != 2+TestAdapter.SETTEXT) errors.push(`Frame #${i+1} command is not SETTEXT!`);
        }
        var frame = channel.frames[5];
        if (frame.delta != 16) errors.push(`Frame #5 delta is not 16!`);
        if (frame.commands.length != 1) errors.push('Frame #5 does not have exactly 1 commands!');
        if (frame.commands[0].getUint8(0) != 2+TestAdapter.SETINK) errors.push('Frame #5 command is not SETINK!');
        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';
    }

    function test_channel_insertFrame() {
        Dbg.prln('Test insert frame');
        var player = createPlayer();
        var sequence = createTestSequence();
        var channel = new Player.Channel('test01', player);
        channel.assign(player.targets[0], sequence);
        channel.isActive = true;
        channel.toFrames();
        var frame = new Player.Frame();
        frame.delta = 4;
        var view = new DataView(new ArrayBuffer(7));
        view.setUint8(0, 2);
        writeString('Start', view, 1);
        frame.commands.push(view);
        channel.frames.splice(0, 0, frame);
        channel.toStream();
        return startPlayBack(channel);
    }

    var tests = async function() {
        //Dbg.prln(await test_channel_run());
        Dbg.prln(test_channel_toFrames());
        // Dbg.prln(await test_channel_insertFrame());
        //Dbg.prln(test_channel_deleteFrames());
        return 0;
    };
    public(tests, 'Player tests');
})();
