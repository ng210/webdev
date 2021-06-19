include('/lib/base/dbg.js');
include('/lib/utils/syntax.js');
include('/lib/data/stream.js');
include('/lib/data/dictionary.js');
include('/lib/player/player-lib.js');
include('/lib/webgl/sprite/sprite-manager.js');

include('./compiler.js');
include('./grammar.js');

const MAX_SPRITE_COUNT = 100;

//self.DBGLVL = 2;

const spr_commands = {
    spr:        'SETSPRITE',
    spr_frm:    'SETFRAME',
    spr_pos:    'SETPOSITION',
    spr_scale:  'SETSCALE',
    spr_rotate: 'SETROTATION',
    spr_change: 'CHANGE'
};

var Game = {
    //#region Variables
    fileName: 'res/anim1.scr',
    outputName: 'res/anim1.asu',

    compiler: null,

    datablocks: null,
    adapters: null,
    sequences: null,

    player: null,

    sprMgr: null,

    time: 0,
    //#endregion

    init: async function init() {
        this.compiler = new Compiler(grammar, this, 0);
        Ps.Player.registerAdapter(Ps.Player);
        Ps.Player.registerAdapter(webGL.SpriteManager);
        webGL.SpriteManager.initWebGL();
        gl.canvas.width = 800;  //0.5*window.innerWidth;
        gl.canvas.height = 600; //0.5*window.innerHeight
        gl.canvas.style.width = '100vw';
        gl.canvas.style.height = '100vh';
        // gl.canvas.style.left = '0';
        // gl.canvas.style.top = '0px';
    },

    //#region COMPILER
    parseVariable: function parseVariable(term) {
        var v = this.compiler.parseVariable(term);
        var ix = this.datablocks.indexOf(v.value);
        if (ix == -1) {
            ix = this.sequences.indexOf(v.value);
            if (ix == -1) {
                ix = webGL.Sprite.Fields[v.value];
                if (ix == undefined) ix = -1;
            }
        }
        if (ix != -1) {
            v.value = ix;
            v.type = Compiler.schema.types.uint8;
        }
        return v;
    },
    compile: function compile(script) {
        var player = Ps.Player.create();

        // initialize player from script
        this.datablocks = new Dictionary();
        this.adapters = [];
        this.sequences = new Dictionary();
    
        this.compiler.reset();
        this.compiler.run(script);

        if (this.compiler.errors.length > 0) {
            Dbg.prln('Errors', 'hd');
            for (var i=0; i<this.compiler.errors.length; i++) {
                Dbg.prln(`${this.compiler.errors[i]}`, 'error');
            }
        } else {
            Dbg.prln('No errors!');
        }

        // create and initialize player
        // add datablocks
        player.datablocks = this.datablocks.values(x => {x.readPosition = 0; return x; });
        // add adapters
        for (var i=0; i<this.adapters.length; i++) {
            var adapterType = this.adapters[i].adapter;
            var datablockId = this.datablocks.indexOf(this.adapters[i].datablock);
            player.addAdapter(adapterType, datablockId);
        }
        // add sequences
        player.sequences = this.sequences.values(v => v.data = this.createSequence(v, player.adapters));

        Dbg.prln(`Processed ${this.compiler.lineNumber} lines.`);
        Dbg.prln('Variables', 'hd');
        for (var i in this.compiler.variables) {
            var v = this.compiler.variables[i];
            Dbg.prln(`&nbsp;<b>${v.type.name}</b> ${i} = ${JSON.stringify(v.value)};`);
        }

        Dbg.prln('Adapters', 'hd')
        for (var i=0; i<this.adapters.length; i++) {
            var ab = this.adapters[i];
            Dbg.prln(`&nbsp;${ab.adapter.info.name} ${ab.datablock} (#${this.datablocks.indexOf(ab.datablock)})`);
        }

        Dbg.prln('Datablocks', 'hd')
        for (var i=0; i<this.datablocks.length; i++) {
            var key = this.datablocks._keys[i];
            var db = this.datablocks.getAt(i);
            Dbg.prln(`${key}: ${db.hexdump()}`);
        }

        Dbg.prln('Sequences', 'hd')
        for (var i=0; i<this.sequences.length; i++) {
            var key = this.sequences._keys[i];
            var seq = this.sequences.get(key);
            Dbg.prln(`${key}: ${seq.adapter.getInfo().name}`);
            Dbg.prln(seq.data.stream.hexdump());
        }

        Dbg.prln('');

        return player;
    },

    //#region COMPILER ACTIONS
    adapter: function adapter(typeRef, datablockRef, cmd) {
        var lineNumber = cmd.data.lineNumber;
        var adapterType = this.compiler.parseVariable(typeRef).value;
        var datablockId = this.parseVariable(datablockRef).value;
        var adapter = null;
        for (var i in Ps.Player.adapterTypes) {
            var ad = Ps.Player.adapterTypes[i];
            if (ad.info.name == adapterType || ad.info.id == adapterType) {
                adapter = ad;
                break;
            }
        }
        if (adapter == null) {
            this.compiler.errors.push(`(${lineNumber}): Unknown adapter type '${adapterType}'!`);
        }
        
        // get data block
        var key = !isNaN(datablockId) ? this.datablocks._keys[datablockId] : datablockId;
        var datablock = this.datablocks.get(key);
        if (!datablock) {
            this.compiler.errors.push(`(${lineNumber}): Invalid datablock reference '${datablockRef}'!`);
        }
        if (adapter != null && datablock != null) {
            this.adapters.push({adapter:adapter, datablock:key});
        }
    },
    sequence: function sequence(nameRef, adapterRef, frames, cmd) {
        var lineNumber = arguments[arguments.length-1].data.lineNumber;
        var name = this.compiler.parseVariable(nameRef).value;
        var adapterName = this.compiler.parseVariable(adapterRef).value;
        if (this.sequences.get(name) != null) {
            this.compiler.errors.push(`(${lineNumber}): Sequence '${name}' already defined!`);
        }
        var aix = this.adapters.findIndex(x => x.adapter.info.name == adapterName);
        if (aix == -1) {
            this.compiler.errors.push(`(${lineNumber}): Invalid adapter reference '${adapterRef}'!`);
        } else {
            this.sequences.add(name, {adapter:this.adapters[aix].adapter, frames:frames})
        }
    },
    createSequence: function createSequence(seq, adapters) {
        var adapter = adapters.find(x => x.adapter.constructor == seq.adapter).adapter;
        var sequence = new Ps.Sequence(adapter);
        sequence.writeHeader();
        for (var i=0; i<seq.frames.args.length; i++)  {
            var frame = seq.frames.args[i];
            var delta = this.compiler.parseVariable(frame.args[0]).value;
            if (delta == null) {
                this.compiler.errors.push(`(${frame.lineNumber}): Invalid delta value '${frame.args[0]}'!`);
            }
            sequence.writeDelta(delta);
            for (var j=1; j<frame.args.length; j++) {
                var cmdData = frame.args[j];
                var args = [];
                var hasError = false;
                var hasEOF = false;
                var commandName = this.compiler.parseVariable(`"${cmdData.name}"`).value;
                if (commandName == null) {
                    this.compiler.errors.push(`(${frame.lineNumber}): Invalid command '${commandNname}'!`);
                    hasError = true;
                } else {
                    commandName = spr_commands[commandName] || commandName;
                    if (commandName == 'end') hasEOF = true;
                    args.push(commandName);
                    for (var k=0; k<cmdData.args.length; k++) {
                        var v = this.parseVariable(cmdData.args[k]).value;
                        if (v == null) {
                            this.compiler.errors.push(`(${frame.lineNumber}): Invalid value '${cmdData.args[k]}'!`);
                            hasError = true;
                            break;
                        } else args.push(v);
                    }
                    if (!hasError && !hasEOF) {
                        var command = adapter.makeCommand.apply(adapter, args);
                        sequence.stream.writeStream(command);
                    }
                }
            }
            if (!hasEOF && i < seq.frames.args.length-1) sequence.writeEOF();
        }
        sequence.writeEOS();
        return sequence;
    },
    datablock: function datablock(nameRef, cmd) {
        var name = this.compiler.parseVariable(nameRef).value;
        if (name == null) {
            this.compiler.errors.push(`(${cmd.lineNumber}): Invalid datablock name '${name}'!`);
        } else {
            if (this.datablocks.get(name) != null) {
                this.compiler.errors.push(`(${cmd.lineNumber}): Datablock '${name}' already defined!`);
            }
            var stream = new Stream(16);
            var v = new Compiler.Variable('tmp');
            for (var i=1; i<arguments.length-1; i++) {
                var v = this.parseVariable(arguments[i]);
                v.writeToStream(stream);
            }
            this.datablocks.add(name, stream);
        }
    },
    //#endregion

    //#endregion

    run: async function run(script) {
        Game.player = this.compile(script);
        Game.player.reset();
        // prepare context
        for (var i=0; i<Game.player.adapters.length; i++) {
            var ad = Game.player.adapters[i];
            if (ad.adapter.constructor == webGL.SpriteManager) Game.sprMgr = ad.adapter;
            var datablock = Game.player.datablocks[ad.datablock];
            datablock.readPosition = 0;
            await ad.adapter.prepareContext(datablock);
        }
        Game.time = new Date().getTime();
        Game.animate();
    },

    animate: function animate() {
        var now = new Date().getTime();
        var dt = now - Game.time;
        Game.player.run(0.1*dt);
        Game.sprMgr.update();
        Game.sprMgr.render();
        Game.time = now;
        requestAnimationFrame(Game.animate);
    }
};


async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }

    var dummy = 'true';
    console.log(dummy == true);

    Dbg.init('con');
    Game.init();

    var res = await load('./res/test.scr');
    if (!res.error) {
        Game.run(res.data);
    }
}