include('ge/player/player.js');
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
            'gray', 'lightgray', 'purple', 'yellow', 'brown', 'blue', 'red', 'white'
        ];
        switch (command) {
            case 0: // SETTEXT
                var text = '', c = null;
                while ((c = String.fromCharCode(sequence.getUint8(cursor++))) != '\0') text += c;
                target.innerHTML = text;
                break;
            case 1: // SETINK
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
            case 0: // SETTEXT
                do { commandSize++ } while (String.fromCharCode(sequence.getUint8(cursor++)) != '\0');
                break;
            case 1: // SETINK
                commandSize++;
                break;
        }
        return commandSize;
    };

    function createPlayer() {
        var testAdapter = new TestAdapter();
        var player = new Player();
        player.adapters.push(testAdapter);
        testAdapter.createTargets(player.targets, null);
        return player;
    }

    function writeString(str, view, offs) {
        for (var i=0; i<str.length; i++) {
            view.setInt8(offs++, str.charCodeAt(i))
        }
        return offs;
    }

    function createTestSequence() {
        var stream = new ArrayBuffer(128);
        var view = new DataView(stream);
        var offs = 0;
        view.setInt8(offs++, 1+1);              // header size
        view.setInt8(offs++, 0);                // adapter type 0
        // Sequence #1
        // Frame #1
        view.setInt16(offs, 16); offs += 2;      // delta 16
        view.setInt8(offs, 2); offs++;          // SETTEXT
        offs = writeString('Hello World!', view, offs);
        view.setInt8(offs++, 0);
        view.setInt8(offs++, 0);                // EOF - end of frame

        // Frame #2
        view.setInt16(offs, 16); offs += 2;     // delta 16
        view.setInt8(offs++, 3);                // SETINK
        view.setInt8(offs++, 3);                // color #3
        view.setInt8(offs++, 0);                // EOF

        // Frame #3
        view.setInt16(offs, 16); offs += 2;     // delta 16
        view.setInt8(offs++, 2);                // SETTEXT
        offs = writeString('Player test', view, offs);
        view.setInt8(offs++, 0);
        view.setInt8(offs++, 3);                // SETINK
        view.setInt8(offs++, 6);                // color #6
        view.setInt8(offs++, 0);                // EOF

        // Frame #4
        view.setInt16(offs, 16); offs += 2;     // delta 16
        view.setInt8(offs++, 2);                // SETTEXT
        view.setInt16(offs++, 0);
        view.setInt8(offs++, 0);                // EOF

        // Frame #5
        view.setInt16(offs, 8); offs += 2;      // delta 8
        view.setInt8(offs++, 1);                // EOS marks end of sequence

        return Player.Sequence.fromStream(stream);
    }

    async function startPlayBack(channel) {
        function loop(resolve) {
            clearTimeout(timer);
            if (channel.run(1)) {
                timer = setTimeout(loop, 40, resolve);
            } else {
                var text = channel.player.targets[0].innerHTML == '' ? 'Test successful' : 'Test failed';
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
        if (channel.frames.length != 5) errors.push('Frame count is not 5!');
        // check frame #1
        var frame = channel.frames[0];
        if (frame.delta != 16) errors.push('Frame #1 delta is not 16!');
        if (frame.commands.length != 1) errors.push('Frame #1 does not have exactly 1 command!');
        if (frame.commands[0].getUint8(0) != 2) errors.push('Frame #1 command is not SETTEXT!');
        // check frame #2
        frame = channel.frames[1];
        if (frame.delta != 16) errors.push('Frame #2 delta is not 16!');
        if (frame.commands.length != 1) errors.push('Frame #2 does not have exactly 1 command!');
        if (frame.commands[0].getUint8(0) != 3) errors.push('Frame #2 command is not SETINK!');
        // check frame #3
        frame = channel.frames[2];
        if (frame.delta != 16) errors.push('Frame #3 delta is not 16!');
        if (frame.commands.length != 2) errors.push('Frame #3 does not have exactly 2 command!');
        if (frame.commands[0].getUint8(0) != 2) errors.push('Frame #3 command #1 is not SETTEXT!');
        if (frame.commands[1].getUint8(0) != 3) errors.push('Frame #3 command #2 is not SETINK!');
        // check frame #4
        frame = channel.frames[3];
        if (frame.delta != 16) errors.push('Frame #4 delta is not 16!');
        if (frame.commands.length != 1) errors.push('Frame #4 does not have exactly 1 command!');
        if (frame.commands[0].getUint8(0) != 2) errors.push('Frame #4 command is not SETTEXT!');
        // check frame #5
        frame = channel.frames[4];
        if (frame.delta != 8) errors.push('Frame #5 delta is not 8!');
        if (frame.commands.length != 1) errors.push('Frame #5 does not have exactly 1 command!');
        if (frame.commands[0].getUint8(0) != 1) errors.push('Frame #5 command is not EOS!');

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
        Dbg.prln(await test_channel_insertFrame());
        //Dbg.prln(test_channel_deleteFrames());
        return 0;
    };
    public(tests, 'Player tests');
})();
