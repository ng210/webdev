include('/lib/ge/sound.js');
include('/lib/synth/synth.js');
include('/lib/synth/synth-adapter.js');
include('/lib/player/player-lib.js');
include('/lib/webgl/webgl.js');
include('/lib/webgl/compute-shader.js');

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

function writeTokenToStream(namespace, token, stream) {

    var writeMethods = {
        'b:': Stream.prototype.writeUint8,
        'w:': Stream.prototype.writeUint16,
        'd:': Stream.prototype.writeUint32,
        'f:': Stream.prototype.writeFloat32,
    };
   

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

function SynthApp() {
    this.settings = {
        'bpm':          101,
        'scopewindow':  0.3
    };

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

    //#region rendering
    this.vbo = null;
    this.prg = null;
    this.uniforms = {
        'u_length': 0,
        'u_shade': 0.0
    };
    //#endregion
}

SynthApp.prototype.createPlayer = function createPlayer(data) {
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

SynthApp.prototype.updateScope = function updateScope() {
    this.scopeWritePosition = 0;
    var smpCount = 0.1 * this.settings.scopewindow * SAMPLE_RATE;
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

SynthApp.prototype.initialize = async function initialize() {
    // init sound and playback
    this.samplePerFrame = SAMPLE_RATE*60/FRAMES_PER_BEAT/this.settings.bpm;
    Ps.Player.registerAdapter(Ps.Player);
    Ps.Player.registerAdapter(psynth.SynthAdapter);
    var data = await load('./data.json');
    if (data.error) throw new Error(data.error);
    this.player = this.createPlayer(data.data);
    this.synthAdapter = this.player.adapters[psynth.SynthAdapter.getInfo().id].adapter;
    this.synth = this.synthAdapter.devices[0];
    //this.createSequences();

    // init gfx
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
    //#region post-processing
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
    //#endregion
    this.updateScope();
};

SynthApp.prototype.playerBasedFillBuffer = function playerBasedFillBuffer(left, right, bufferSize, player) {
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
SynthApp.prototype.run = function run(callback) {
    sound.init(SAMPLE_RATE,
        function fillBuffer(left, right, bufferSize, channel) {
            callback(left, right, bufferSize, channel);
        }
    );
};

// SynthApp.prototype.resize = function resize(e) {
//     this.updateScope();
// };

SynthApp.prototype.renderScope = function renderScope() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.ref);
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

function startStop() {
    if (sound.isRunning) {
        btn_.style.textShadow = '';
        btn_.style.color = '#0020a0';
        sound.stop();
    } else {
        sound.start();
        btn_.style.color = '#4080ff';
        btn_.style.textShadow = '0px 0px 6px rgba(160, 240, 255, 1)';
    }
}

function render() {
    app_.renderScope();
    requestAnimationFrame(render);
};

var app_ = null;
var btn_ = null;

async function onpageload(e) {
    if (e.length > 0) {
        alert(e.join('\n'));
    } else {
        app_ = new SynthApp();
        await app_.initialize();
        app_.run((left, right, bufferSize) => app_.playerBasedFillBuffer(left, right, bufferSize, app_.player));
        btn_ = document.getElementById('start');
        btn_.addEventListener('click', startStop);
        render();
    }
}