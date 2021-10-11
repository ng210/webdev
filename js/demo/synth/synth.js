include('/lib/glui/controls/textbox.js');
include('/lib/glui/glui-lib.js');
include('/lib/synth/synth.js');
include('/lib/player/player-lib.js');
include('/lib/ge/sound.js');
include('/lib/synth/synth-adapter.js');
include('/lib/webgl/webgl.js');
include('/lib/webgl/compute-shader.js');

(function() {

    const SAMPLE_RATE = 48000;
    const SCOPE_MAX_SIZE = 4096;
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
            scopewindow: { label: 'Scope win.', value: 0.2, min:0.1, max:1.0, step: 0.05, type: 'float', link: null }
        });
        //#region playback
        this.player = null;
        this.synthAdapter = null;
        this.synth = null;
        this.frame = 0;
        this.samplePerFrame = 0;
        this.isDone = false;
        //#endregion

        //#region scope
        this.scopeLength = 0;
        this.scopeBuffers = [
            new Float32Array(SCOPE_MAX_SIZE),
            new Float32Array(SCOPE_MAX_SIZE)
        ];
        this.scopeBufferIndex = 0;
        this.scopeReadPosition = 0;
        this.scopeWritePosition = 0;
        this.scopeSamplingStep = 0;
        this.isScopeVisible = true;
        this.postProcessing = null;
        //#endregion

        this.selectedSequence = 0;
        this.sequences = [];
        this.currentStep = 0;

        //#region rendering
        this.vbo = null;
        this.prg = null;
        this.uniforms = {
            'u_length': 0,
            'u_shade': 0.0
        };
        //#endregion
    };
    extend(Demo, Synth);

    //#region Demo implementation
    Synth.prototype.initialize = async function initialize() {
            this.samplePerFrame = SAMPLE_RATE*60/FRAMES_PER_BEAT/this.settings.bpm.value;

            Ps.Player.registerAdapter(Ps.Player);
            Ps.Player.registerAdapter(psynth.SynthAdapter);
            var data = await load('/demo/synth/data.json');
            if (data.error) throw new Error(data.error);
            this.player = this.createPlayer(data.data);
            // this.player = Ps.Player.create();
            // await this.player.load('/demo/synth/test-data.bin');
            this.synthAdapter = this.player.adapters[psynth.SynthAdapter.getInfo().id].adapter;
            this.synth = this.synthAdapter.devices[0];
            this.currentStep = 0;
            webGL.init(null, true);
            gl.canvas.style.zIndex = 1000;
            gl.canvas.style.background = 'transparent';
            this.vbo = webGL.createBuffer(gl.ARRAY_BUFFER, new Float32Array([ -1.0, -1.0,   1.0, -1.0,  -1.0, 1.0,  1.0, 1.0 ]), gl.STATIC_DRAW);
            var shaders = {};
            shaders[gl.VERTEX_SHADER] = 
               `#version 300 es
                in float a_position;
                uniform float u_length;

                void main(void) {
                    vec2 pos = vec2(2.*float(gl_VertexID)/u_length - 1.0, 2.0*a_position);
                    gl_Position = vec4(pos, 0., 1.);
                }`;
            shaders[gl.FRAGMENT_SHADER] =
               `#version 300 es
                precision highp float;
                uniform float u_shade;
                uniform sampler2D u_backbuffer;
                out vec4 color;

                void main(void) {
                    color = vec4(1.0);
                }`;
            this.prg = webGL.createProgram(shaders);
            // this.postProcessing = new webGL.ComputeShader([gl.canvas.width, gl.canvas.height], gl.RGBA32F);
            // await this.postProcessing.setShader(
            //    `#version 300 es
            //    precision highp float;
               
            //    in vec2 v_position;
            //    uniform sampler2D u_texture;
               
            //    out vec4 color;
               
            //    void main(void) {
            //        color = 2.*texture(u_texture, v_position);
            //    }`
            // );
            this.backBuffer = new Float32Array(4*gl.canvas.width*gl.canvas.height);
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
        if (this.isScopeVisible) {
            //this.renderScope(ctx);
            this.renderScopeWithWebGL();
        };
        this.renderSequencer();
        ctx.restore();
    };
    //#endregion
    
    //#region rendering
    Synth.prototype.renderSequencer = function renderSequencer() {
        this.sequencer.render();
    };
    Synth.prototype.renderScope = function renderScope(ctx) {
        // render scope as webgl linestrip
        // update vbo
        ctx.fillStyle = '#0e1028';
        ctx.globalAlpha = this.settings.alpha.value;
        ctx.fillRect(0, 0, glui.width, glui.height);
        var mj = 3;
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
    Synth.prototype.renderScopeWithWebGL = function renderScopeWithWebGL() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.scopeBuffers[1 - this.scopeBufferIndex], gl.STATIC_DRAW);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.clearColor(0, 0, 0, 0.2);
        webGL.useProgram(this.prg, this.uniforms);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.LINE_STRIP, 0, this.scopeLength);
        // postprocessing
        //this.postProcessing.compute();
        //gl.readPixels(0, 0, gl.canvas.width, gl.canvas.height, gl.RED, gl.FLOAT, this.backBuffer);
    };
    Synth.prototype.updateScope = function updateScope() {
        this.scopeWritePosition = 0;
        var smpCount = 0.1 * this.settings.scopewindow.value * SAMPLE_RATE;
        this.scopeBackBuffer = new Float32Array(gl.canvas.width*gl.canvas.height*4);
        if (smpCount < gl.canvas.width) {
            this.scopeSamplingStep = 1;
            this.scopeLength = Math.floor(smpCount);
        } else {
            this.scopeSamplingStep = smpCount/gl.canvas.width;
            this.scopeLength = gl.canvas.width;
        }
        this.uniforms.u_length = this.scopeLength;
    };
    //#endregion

    //#region event handlers
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
            this.synth.setControl(psynth.Synth.controls.flt1cut, 0.5*x/glui.canvas.clientWidth);
            this.synth.setControl(psynth.Synth.controls.flt1res, 0.98*(1-y/glui.canvas.clientHeight));
        }
    };
    Synth.prototype.ondragging = function ondragging(e, ctrl) {
        if (ctrl && ctrl.dataField == 'velocity') {
            this.setVelocity(ctrl.parent.index, ctrl.getValue());
        }
    };
    //#endregion

    //#region playback
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
            var adapter = player.adapters[psynth.SynthAdapter.getInfo().id].adapter;
            for (var i=0; i<adapter.devices.length; i++) {
                adapter.devices[i].run(left, right, start, end);
            }
            start = end;
            remains -= len;
        }

        if (this.isScopeVisible) {
            while (this.scopeReadPosition < bufferSize) {
                var pos = Math.floor(this.scopeReadPosition);
                this.scopeBuffers[this.scopeBufferIndex][this.scopeWritePosition++] = 0.5*(left[pos] + right[pos]);
                if (this.scopeWritePosition == this.scopeLength) {
                    this.scopeWritePosition = 0;
                    this.scopeBufferIndex = 1 - this.scopeBufferIndex;
                }
                this.scopeReadPosition += this.scopeSamplingStep;
            }
            this.scopeReadPosition -= bufferSize;
        }
    };
    Synth.prototype.run = function run(callback) {
        sound.init(SAMPLE_RATE,
            function fillBuffer(left, right, bufferSize, channel) {
                callback(left, right, bufferSize, channel);
            }
        );
    };
    Synth.prototype.setNote = function setNote(ix, note) {
        var frames = this.sequences[this.selectedSequence].frames;
        var cmd = frames[ix].commands.find( x => x.readUint8(0) == psynth.SynthAdapter.Commands.SETNOTE);
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
                    if (cmd.readUint8(0) == psynth.SynthAdapter.Commands.SETNOTE) {
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
            player.datablocks.push(stream);
        }
        // create, initialize adapters
        //player.adapters[player.getInfo().id] = player;
        player.prepareContext(player.datablocks[0]);
        for (var i=0; i<data.adapters.length; i+=2) {
            var adapterType = Object.values(Ps.Player.adapterTypes).find(x => x.name == data.adapters[i]);
            if (!adapterType) throw new Error('Unknown adapter: ' + adapterType);
            var blockId = data.adapters[i+1];
            var adapter = player.addAdapter(adapterType, blockId);
            adapter.prepareContext(player.datablocks[blockId]);
        }

        // create sequences
        for (var si=0; si<data.sequences.length; si++) {
            var seqData = data.sequences[si];
            var adapterType = Object.values(Ps.Player.adapterTypes).find(x => x.name == seqData.adapter);
            if (!adapterType) throw new Error('Unknown adapter: ' + adapterType);
            var adapter = player.adapters[adapterType.getInfo().id].adapter;
            var frames = [];
            for (var fi=0; fi<seqData.frames.length; fi++) {
                var frame = new Ps.Frame();
                frame.delta = seqData.frames[fi][0];
                var commands = seqData.frames[fi][1];
                for (var ci=0; ci<commands.length; ci++) {
                    var commandCopy = Array.from(commands[ci]);
                    var command = getObjectAt(commandCopy[0], Ps.Player.Commands);
                    if (!command) {
                        command = getObjectAt(commandCopy[0], adapterType.Commands);
                    }
                    commandCopy[0] = command;
                    if (adapterType == psynth.SynthAdapter) {
                        if (command == adapterType.Commands.SETNOTE) {
                            // decode note
                            var note = commandCopy[1].toUpperCase();
                            commandCopy[1] = ABCnames.indexOf(note.substr(0, 2)) + 12*parseInt(note.charAt(2)) + 1;
                        } else if (command >= adapterType.Commands.SETUINT8 && command <= adapterType.Commands.SETFLOAT) {
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
    //#endregion

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