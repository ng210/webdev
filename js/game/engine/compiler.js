include('/lib/data/stream.js');
include('/lib/utils/syntax.js');
include('/lib/utils/schema.js');
(function(){
    function Variable(name, value, type) {
        this.name = name;
        this.type = type || null;
        this.value = value || null;
    }

    Variable.prototype.parseValue = function parseValue(term) {
        var type = null;
        var start = 0, length = term.length;
        this.value = null;
        var isNumeric = false;
        // detect type from term
        // 1. "string" => string
        if (term.startsWith('"')) {
            if (term.endsWith('"'))  {
                type = Compiler.schema.types.string;
                start = 1;
                length -= 2;
            }
        } else {
            // 1.3          => float
            // 23           => uint8
            // b:213        => uint8 (byte)
            // w:2313       => uint16 (word)
            // d:1073741824 => uint32 (dword)
            // f:1.3        => float
            start = 2;
            switch (term.charAt(0)) {
                case 'b': type = Compiler.schema.types.uint8; break;
                case 'w': type = Compiler.schema.types.uint16; break;
                case 'd': type = Compiler.schema.types.uint32; break;
                case 'f': type = Compiler.schema.types.float; break;
                default:
                    type = term.indexOf('.') == -1 ? Compiler.schema.types.uint8 : Compiler.schema.types.float;
                    start = 0;
                    break;
            }
            isNumeric = true;
            
        }
        if (type) {
            this.type = type;
            var value = type.parse(term.substr(start, length));
            if (isNumeric && isNaN(value)) value = null;
            this.value = value;
        }
        
        return this.value;
    };

    Variable.prototype.writeToStream = function writeToStream(stream) {
        switch (this.type) {
            case Compiler.schema.types.uint8:
                stream.writeUint8(this.value);
                break;
            case Compiler.schema.types.uint16:
                stream.writeUint16(this.value);
                 break;
            case Compiler.schema.types.uint32:
                stream.writeUint32(this.value);
                 break;
            case Compiler.schema.types.float:
                stream.writeFloat32(this.value);
                 break;
            case Compiler.schema.types.string:
                stream.writeString(this.value);
                break;
        }
    };

    function Compiler(grammar, context, debug) {
        this.syntax = new Syntax(grammar, debug);
        this.context = context;
        this.values = null;
        this.errors = null;
        this.commands = [];
        this.lineNumber = 0;
        // add types
        Compiler.schema.buildType({'name':'uint8', 'type':'int', 'min':0, 'max':255 });
        Compiler.schema.buildType({'name':'uint16','type':'int', 'min':0, 'max':65535 });
        Compiler.schema.buildType({'name':'uint32','type':'int', 'min':0, 'max':4294967295 });
    }
    Compiler.schema = new Schema();

    Compiler.prototype.reset = function reset() {
        this.lineNumber = 1;
        this.values = new Stream(256);
        this.variables = {};
        this.errors = [];
    };

    Compiler.prototype.run = function run(script) {
        var expr = this.syntax.parse(script + '\r');
        this.lineNumber = 1;
        expr.resolve(this);
        for (var i=0; i<this.commands.length; i++) {
            var cmd = this.commands[i];
            cmd.method.apply(cmd.context, cmd.args);
        }
        // var exprCode = this.syntax.symbols.findIndex(x => x == 'E');
        // for (var i=0; i<expr.tree.vertices.length; i++) {
        //     var vertex = expr.tree.vertices[i];
        //     if (vertex.data.code == exprCode) {
        //         expr.lastNode = vertex;
        //         expr.evaluate(this);
        //     }
        // }
    };

    Compiler.prototype.set = function set(name, value, cmd) {
        var lineNumber = cmd.data.lineNumber;
        // first parameter has to be a valid name
        // - starts with letter
        // - includes letters, digits and _ [a-zA-Z0-9_]
        var re = /^[A-Za-z_]\w*$/g
        if (name.match(re) == null) {
            this.errors.push(`(${lineNumber}): Invalid variable name: '${name}'!`);
        } else {
            if (this.variables[name] != undefined) {
                this.errors.push(`(${lineNumber}): Variable '${name}' already exists!`);
            } else {
                var isValid = false;
                var v = new Variable(name);
                if (v.parseValue(value) != null) {;
                    var errors = v.type.validate(v.value);
                    if (errors.length == 0) {
                        this.variables[name] = v;
                        isValid = true;
                    }
                }
                if (!isValid) {
                    this.errors.push(`(${lineNumber}): Invalid value received: '${value}'!`);
                }
                
            }
        }
    };

    Compiler.prototype.getArguments = function getArguments(node) {
        var value = null;
        if (node.edges.length == 0) {
            value = node.data.term;
        } else {
            value = {
                name: node.data.term,
                args: null
            };
            value.args = node.edges.map(x => this.getArguments(x.to));
        }
        return value;
    };

    Compiler.prototype.command = function command(cmd, t) {
        cmd.data.lineNumber = t.data.lineNumber;
        var methodName = cmd.data.term;
        var context = methodName != 'set' ? this.context : this;
        var args = cmd.edges.map(x => this.getArguments(x.to));
        args.push(cmd);
        var method = context[methodName];
        if (typeof method === 'function') {
            this.commands.push({ method:method, context:context, args:args });
        } else {
            this.errors.push(`(${cmd.data.lineNumber}): Illegal command: '${methodName}'!`);
        }
    };

    Compiler.prototype.createSub = function createSub(node, name) {
        node.graph.addVertex(node, new Syntax.Node(this.syntax.literalCode, this.syntax.literal, name));
    };
    Compiler.prototype.addParameter = function addParameter(node, l) {
        var cmdNode = node.edges.tail().to;
        if (l != null) {
            l.lineNumber = this.lineNumber;
            cmdNode.graph.addEdge(cmdNode, l);
        } else {
            l = node.graph.addVertex(cmdNode, new Syntax.Node(-1, null, '0'));
        }        
        return node;
    };

    Compiler.prototype.parseVariable = function parseVariable(term) {
        // term can be a variable
        var v = this.variables[term];
        var value = null;
        if (v != null) {
            value = v.value;
        } else {
            // term can be a value
            v = new Variable('tmp');
            v.parseValue(term);
        }
        return v;
    };

    Compiler.Variable = Variable;
    publish(Compiler, 'Compiler');
})();