include('glui/controls/textbox.js');
include('glui/glui-lib.js');
include('/synth/synth.js');
include('/player/player-lib.js');
include('/ge/sound.js');
include('/synth/synth-adapter.js');

(function() {

    const SAMPLE_RATE = 48000;
    const SCOPE_SIZE = 0.1*SAMPLE_RATE;
    const FRAMES_PER_BEAT = 16;

    const ABCnames = [
        'C-', 'C#',
        'D-', 'D#',
        'E-',
        'F-', 'F#',
        'G-', 'G#',
        'A-', 'A#',
        'H-'
    ];
    const ValidKeys = 'cdefgah -#012345678';
    function NoteInput(id, template, parent, context) {
        template.isMultiline = false;
        NoteInput.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Textbox, NoteInput);

    NoteInput.prototype.onkeydown = function onkeydown(e) {
        var char = e.which;
        var key = e.key;
        var grid = this.parent.parent;
        switch (char) {
            case 13:
                NoteInput.base.onkeydown.call(this, e);
                break;
            case 38:    // ARROW UP
                var ix = this.parent.index - 1;
                if (ix < 0) ix = grid.rowCount - 1;
                grid.rows[ix].cells[this.column.name].click();
                break;
            case 40:    // ARROW DOWN
                var ix = this.parent.index + 1;
                if (ix == grid.rowCount) ix = 0;
debugger
                grid.rows[ix].cells[this.column.name].click();
                break;
            default:
                if (key >= 'a' && key <= 'g') {
                    this.lines[0] = key.toUpperCase() + this.lines[0].substr(1);
                } else if (key >= '0' && key <= '8') {
                    this.lines[0] = this.lines[0].substr(0, 2) + key;
                } else switch (key) {
                    case '#':
                    case '-':
                        this.lines[0] = this.lines[0].charAt(0) + key + this.lines[0].charAt(2);
                        break;
                }
                break;
        }
    };
    NoteInput.prototype.onchange = function onkeydown(e) {
        this.parent.parent.context.setNote(this.parent.index, this.getValue());
    };

    function Synth() {
        Demo.call(this, 'Synth', {
            bpm: { label: 'BPM', value: 101, min:60, max:180, step: 0.5, type: 'float', link: null },
            alpha: { label: 'Alpha', value: 0.5, min:0, max:1, step: 0.01, type: 'float', link: null },
            scopewindow: { label: 'Scope win.', value: 0.02, min:0.01, max:0.1, step: 0.002, type: 'float', link: null }
        });
        // custom variables
        this.player = null;
        this.synthAdapter = null;
        this.synth = null;
        this.frame = 0;
        this.samplePerFrame = 0;
        this.isDone = false;
        this.scope = new Float32Array(SCOPE_SIZE);
        this.scopeLength = 0;
        this.scopeWritePosition = 0;
        this.scopeSamplingStep = 0;
        this.scopeRenderingStep = 0;
        this.isScopeVisible = true;
        this.selectedSequence = 0;
        this.sequences = [];
        this.currentStep = 0;
    };
    extend(Demo, Synth);

    Synth.prototype.initialize = async function initialize() {
            this.samplePerFrame = SAMPLE_RATE*60/FRAMES_PER_BEAT/this.settings.bpm.value;

            Ps.Player.registerAdapter(Ps.Player);
            Ps.Player.registerAdapter(psynth.SynthAdapter);
            var data = await load('/demo/synth/data.json');
            if (data.error) throw new Error(data.error);
            this.player = this.createPlayer(data.data);
            // this.player = Ps.Player.create();
            // await this.player.load('/demo/synth/test-data.bin');
            this.synthAdapter = this.player.adapters[psynth.SynthAdapter.getInfo().id];
            this.synth = this.synthAdapter.devices[0];
            this.currentStep = 0;

            this.updateScope();
            this.createSequences();

            // 00 C-5 1 001
            this.sequencer = await glui.create('sequence', {
                'type': 'Table',
                'style': {
                    'left': '40em', 'top': '2em',
                    'font': 'Arial 12',
                    'width':'28em',
                    'align':'center middle',
                    'border':'#406080 1px inset',
                    'background-color': '#c0e0ff',
                    'color':'#101820',
                    'cell': {
                        'height': '1.5em'
                    },
                    'title': {
                        'font': 'Arial 18', 'height':'1.8em',
                        'align':'center middle',
                        'border':'#406080 1px inset',
                        'background-color': '#a0c0ff'
                    }
                },
                'title': 'Sequence',
                'row-template': {
                    'no': { 'type': 'Label', 'style': {
                        'width':'2em', 'background-color': '#406080', 'border':'#406080 1px outset'
                    } },
                    'note1': { 'type': 'NoteInput', 'look': 'textbox', 'data-type': 'string', 'data-field':'note', 'style': {
                        'width':'5em', 'background-color': '#d0e0f0', 'border':'#80a890 1px inset'
                    } },
                    'velocity1': { 'type': 'Textbox', 'look': 'potmeter', 'data-type': 'int', 'data-field':'velocity', 'min': 0, 'max': 255,
                        'style': { 'width':'8em', 'background-color': '#d0e0f0', 'border':'#80a890 1px inset' }
                    }
                }
            }, null, this);
            this.sequencer.dataBind(this.sequences[this.selectedSequence], 'sequence');
            //this.sequencer.
            await this.sequencer.build();

            this.run((left, right, bufferSize) => this.playerBasedFillBuffer(left, right, bufferSize, this.player));
    };
    Synth.prototype.destroy = function destroy() {
        sound.stop();
        glui.screen.remove(this.sequencer);
    };
    Synth.prototype.resize = function resize(e) {
        this.updateScope();
    },
    Synth.prototype.update = function update(frame, dt) {
        for (var i=0; i<this.sequencer.rowCount; i++) this.sequencer.rows[i].highlit = false;
        this.sequencer.rows[(this.currentStep>>1)%32].highlit = true;
    };
    Synth.prototype.render = function render(frame, dt) {
        var ctx = glui.renderingContext2d;
        ctx.save();
        if (this.isScopeVisible) this.renderScope(ctx);
        this.renderSequencer();
        ctx.restore();
    };
    Synth.prototype.renderSequencer = function renderSequencer() {
        this.sequencer.render();
    };
    Synth.prototype.renderScope = function renderScope(ctx) {
        ctx.fillStyle = '#0e1028';
        ctx.globalAlpha = this.settings.alpha.value;
        ctx.fillRect(0, 0, glui.width, glui.height);
        var mj = 5;
        ctx.strokeStyle = '#a0c0ff';
        for (var j=0; j<=mj; j++) {
            ctx.beginPath();
            var x = j/mj;
            var x2 = x*x;
            var mx = (1.1 - x);
            var mx2 = mx*mx;
            ctx.lineWidth = 20*mx2;
            ctx.globalAlpha = 0.01 + 0.95*x2;
            ctx.moveTo(0, 0.5*glui.height*(1 + this.scope[0]));
            var cx = this.scopeRenderingStep;
            for (var i=1; i<this.scope.length; i++) {
                ctx.lineTo(cx, 0.5*glui.height*(1 + this.scope[i]));
                cx += this.scopeRenderingStep;
            }
            ctx.stroke();
        }
    };
    Synth.prototype.onclick = function onclick(x, y, e) {
        if (typeof x === 'number') {
            this.isScopeVisible = !this.isScopeVisible;
        }
    };
    Synth.prototype.onchange = function onchange(e, setting) {
        switch (setting.parent.id) {
            case 'bpm':
                this.samplePerFrame = SAMPLE_RATE*60/FRAMES_PER_BEAT/this.settings.bpm.value;
                break;
            case 'scopewindow':
                this.updateScope();
                break;
            default:
                if (setting.parent.parent == this.sequencer) {
                    if (setting.dataField == "velocity") {
                        this.setVelocity(setting.parent.index, setting.value);
                    }
                }
        }
    };
    Synth.prototype.onstartstop = function onstartstop() {
        if (!sound.isRunning) {
            sound.start();
        } else {
            sound.stop();
        }
    };
    Synth.prototype.onmousemove = function onmousemove(x, y, e) {
        if (typeof x === 'number') {
            this.synth.setControl(psynth.Synth.controls.flt1cut, x);
            this.synth.setControl(psynth.Synth.controls.flt1res, 0.98*(1-y));
        }
    };
    Synth.prototype.ondragging = function ondragging(e, ctrl) {
        if (ctrl && ctrl.dataField == 'velocity') {
            this.setVelocity(ctrl.parent.index, ctrl.getValue());
        }
    };
    // custom functions
    Synth.prototype.playerBasedFillBuffer = function playerBasedFillBuffer(left, right, bufferSize, player) {
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
                this.currentStep++;
                if (!player.run(1)) {
                    player.reset();
                    player.run(0)
                    this.currentStep = 0;
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

        if (this.isScopeVisible) {
            for (var i=0; i<bufferSize; i++) {
                this.scope[this.scopeWritePosition++] = 0.5*(left[i] + right[i]);
                if (this.scopeWritePosition > this.scopeLength) {
                    this.scopeWritePosition -= this.scopeLength;
                }
            }
        }
    };
    Synth.prototype.run = function run(callback) {
        sound.init(SAMPLE_RATE,
            function fillBuffer(left, right, bufferSize, channel) {
                callback(left, right, bufferSize, channel);
            }
        );
    };
    Synth.prototype.updateScope = function updateScope() {
        this.scopeLength = Math.floor(SAMPLE_RATE * this.settings.scopewindow.value);
        this.scopeSamplingStep = Math.round(this.settings.scopewindow.value / SAMPLE_RATE);
        this.scopeRenderingStep = glui.width/this.scopeLength;
    };
    Synth.prototype.setNote = function setNote(ix, note) {
        var frames = this.sequences[this.selectedSequence].frames;
        var cmd = frames[ix].commands.find( x => x.readUint8(0) == psynth.SynthAdapter.SETNOTE);
        if (cmd) {
            var noteValue = ABCnames.indexOf(note.substr(0, 2)) + 12*parseInt(note.charAt(2)) + 1;
            cmd.writePosition = 1;
            cmd.writeUint8(noteValue);
            this.createStreamFromSequence();
        }
        
    };
    Synth.prototype.setVelocity = function setVelocity(ix, velocity) {
        var frames = this.sequences[this.selectedSequence].frames;
        var cmd = frames[ix].commands.find( x => x.readUint8(0) == psynth.SynthAdapter.SETNOTE);
        if (cmd) {
            cmd.writePosition = 2;
            cmd.writeUint8(velocity);
            this.createStreamFromSequence();
        }
    };
    Synth.prototype.createSequences = function createSequences() {
        for (var i=1; i<this.player.sequences.length; i++) {
            var frames = this.player.sequences[i].toFrames();
            var sequence = [];
            // CONVERT: DELTA => STEP
            var fi = frames[0].delta / 4;
            while (fi < frames.length) {
                var fr = frames[fi];
                // get SynthAdapter.SETNOTE command
                for (var ci=0; ci < fr.commands.length; ci++) {
                    var cmd = fr.commands[ci];
                    if (cmd.readUint8(0) == psynth.SynthAdapter.SETNOTE) {
                        var note = cmd.readUint8() - 1;
                        var noteText = `${ABCnames[note%12]}${Math.floor(note/12)}`;
                        var velocity = cmd.readUint8();
                        sequence.push({'no': fi, 'note':noteText, 'velocity':velocity});
                    }
                }
                fi++;
            }
            this.sequences.push({'frames':frames, 'sequence': sequence});
        }
    };
    Synth.prototype.createStreamFromSequence = function createStreamFromSequence() {
        var frames = this.sequences[this.selectedSequence].frames;
        this.player.sequences[1 + this.selectedSequence] = Ps.Sequence.fromFrames(frames, this.synthAdapter);
    };
    Synth.prototype.createPlayer = function createPlayer(data) {
        var player = Ps.Player.create();
        // create data blocks
        for (var i=0; i<data['data-blocks'].length; i++) {
            var block = data['data-blocks'][i];
            var stream = new Stream(128);
            var namespace = block.namespace || '';
            for (var j=0; j<block.data.length; j++) {
                writeTokenToStream(namespace, block.data[j], stream);
            }
            stream.buffer = stream.buffer.slice(0, stream.length);
            player.dataBlocks.push(stream);
        }

        // create, initialize adapters
        player.adapters[player.getInfo().id] = player;
        player.prepareContext(player.dataBlocks[0]);
        for (var i=0; i<data.adapters.length; i+=2) {
            var adapterType = Object.values(Ps.Player.adapterTypes).find(x => x.name == data.adapters[i]);
            if (!adapterType) throw new Error('Unknown adapter: ' + adapterType);
            var adapter = player.addAdapter(adapterType);
            adapter.prepareContext(player.dataBlocks[data.adapters[i+1]]);
        }

        // create sequences
        for (var si=0; si<data.sequences.length; si++) {
            var seqData = data.sequences[si];
            var adapterType = Object.values(Ps.Player.adapterTypes).find(x => x.name == seqData.adapter);
            if (!adapterType) throw new Error('Unknown adapter: ' + adapterType);
            var adapter = player.adapters[adapterType.getInfo().id];
            var frames = [];
            for (var fi=0; fi<seqData.frames.length; fi++) {
                var frame = new Ps.Frame();
                frame.delta = seqData.frames[fi][0];
                var commands = seqData.frames[fi][1];
                for (var ci=0; ci<commands.length; ci++) {
                    var commandCopy = Array.from(commands[ci]);
                    var command = getObjectAt(commandCopy[0], Ps.Player);
                    if (!command) {
                        command = getObjectAt(commandCopy[0], adapterType);
                    }
                    commandCopy[0] = command;
                    if (adapterType == psynth.SynthAdapter) {
                        if (command == adapterType.SETNOTE) {
                            // decode note
                            var note = commandCopy[1].toUpperCase();
                            commandCopy[1] = ABCnames.indexOf(note.substr(0, 2)) + 12*parseInt(note.charAt(2)) + 1;
                        } else if (command >= adapterType.SETUINT8 && command <= adapterType.SETFLOAT) {
                            // decode synth controller id
                            commandCopy[1] = psynth.Synth.controls[commandCopy[1]];
                        }
                    }
                    frame.commands.push(adapter.makeCommand.apply(adapter, commandCopy));
                }                

                frames.push(frame);
            }
            player.sequences.push(Ps.Sequence.fromFrames(frames, adapter));
        }

        player.masterChannel.assign(0, player.sequences[0]);
        return player;
    };


    var writeMethods = {
        'b:': Stream.prototype.writeUint8,
        'w:': Stream.prototype.writeUint16,
        'd:': Stream.prototype.writeUint32,
        'f:': Stream.prototype.writeFloat32,
    };
    function writeTokenToStream(namespace, token, stream) {
        // default token is uint8
        if (typeof token === 'number') {
            stream.writeUint8(token);
            return true;
        } else if (typeof token === 'string') {
            // token can start with a size reference
            var writeMethod = writeMethods[token.substr(0, 2)];
            var ref = token;
            if (writeMethod) {
                ref = token.substr(2);
            } else {
                writeMethod = writeMethods['b:'];
            }
            // token can be a number
            var value = parseFloat(ref);
            if (!isNaN(value)) {
                writeMethod.call(stream, value);
                return true;
            }
            // token can be a reference
            var resolved = getObjectAt(namespace + '.' + ref);
            if (resolved != null) {
                writeMethod.call(stream, resolved);
            } else {
                resolved = getObjectAt(ref);
                if (resolved != null) {
                    writeMethod.call(stream, resolved);
                } else {
                    stream.writeString(token);
                }
            }
        } else {
            throw new Error('Invalid token ' + token);
        }
    }

    publish(NoteInput, 'NoteInput', glui);
    publish(new Synth(), 'Synth');
})();