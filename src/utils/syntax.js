(function() {
    include('/ge/tree.js');

    // rule.toString()
    var rs = r => `${r.priority} ${r.input}(${r.in.join('.')})=>${r.output}(${r.out})`

    // A grammar consists of a list of node prototypes and rules.
    //
    // 1. Node prototypes used by the grammar
    // The prototypes are stored in a container object and describe the building blocks of a language.
    // - the keys are the keywords of the language
    // - the prototypes define
    //   - a symbol used in the grammatic rules
    //   - an optional binding
    //   - an optional action to execute
    // - words not identified are literals

    // 2. Rules
    // Rules replace sequences of the input nodes with a single node either returned by the rule's action or defined by the rule.
    // The input is scanned from left to right to find a matching rule.
    // Rules can be expressed as r(I*, O*, P), where
    //  I*: sequence of input symbol, □ means ignore input
    //  O*: sequence of output symbol, □ means no output
    //  P: priority
    // Rules are sorted by priority and input sequence, thus
    // - rules with higher priority are matched and executed first
    // - rules with longer matching input sequence are executed first
    // To improve performance, the symbols defined by the prototypes and used by the rules are replaced by integers, the ordinal number of their defining prototype.

    // 3. Parser
    // Creates instances of the node prototypes by processing the input.
    // - identify the next term as the keyword of a node prototype
    // - create a new instance of the prototype and store the term
    // - store the instance

    // 4. Analyzer
    // Applies the rules on the input if possible. The process is successful if and only if the whole input was processed.
    // As a "side-effect" the rule actions can be used to transform, compile the input.

    function Node(code, type, term) {
        // // unique id of the node
        // this.id = id;
        // // parent node
        // this.parent = null;
        // // child nodes
        // this.children = [];
        // interpreted value (parsed or calculated)
        this.value = parseFloat(term) || term;
        // prototype defined in the grammar
        this.type = type;
        // code used in the transformed grammatic rules
        this.code = code;
        // input term associated with the node
        this.term = term;
    };
    Node.prototype.addChild = function(node) {
        this.children.push(node);
        node.parent = this;
    };

    function Expression(syntax) {
        this.tree = new Tree();
        this.syntax = syntax;
        this.expression = '';
    }
    Expression.prototype.resolve = function(context) {
        var lastNode = null;
        var nodes = this.tree.nodes;
        while (nodes.length > 0) {
            for (var r=0; r<this.syntax.ruleMap.length;) {
                //console.log('Input: (', nodes.map(x => this.symbols[x.data.code]).join(' '), ')');
                var hasMatch = false;
                var rule = this.syntax.ruleMap[r];
                //console.log(`Matching ${rs(rule)} against ${nodes.map(x => x.data.type.symbol)}`);
                for (var n=0; n<nodes.length;) {
                    var i = 0;
                    if (rule.in.length <= nodes.length - n) {
                        while (i<rule.in.length && (rule.in[i] == nodes[n+i].data.code)) {
                            //console.log(rule.in[i] + ' ? ' + nodes[n+i].data.code);
                            i++;
                        }
                    } else {
                        break;
                    }
                    if (i == rule.in.length) {
                        // match found, replace input by output
                        console.log('Matched: ' + rs(rule));
                        var args = nodes.slice(n, n+i);
                        //console.log(args.length);
                        var output = null;
                        if (typeof rule.action === 'function') {
                            output = rule.action.apply(context, args);
                        }
                        if (rule.out && output) {
                            output.data.code = rule.out;
                            nodes.splice(n, i, output);
                        } else if (rule.out && !output) {
                            output = this.mergeNodes(args);
                            output.data.code = rule.out;
                            //console.log(`Merge: ${args.map(x => this.nodeToString(x, true)).join(' ')} => ${this.nodeToString(output, true)}`);
                            nodes.splice(n, i, output);
                        } else if (!rule.out && !output) {
                            nodes.slice(n, i);
                        } else if (!rule.out && output) {
                            nodes.splice(n, i, output);
                        } else {
                            throw new Error('Error!');
                        }
                        if (output) {
                            lastNode = output;
                        }
                        //console.log(` - match at ${n}: (${args.map(x => this.nodeToString(x, true)).join(' ')}) : (${nodes.map(x => this.nodeToString(x, true)).join(' ')})`);
                        hasMatch = true;
                        break;
                    } else n++;
                }
                r = hasMatch ? 0 : r + 1;
            }
            break;
        }
        this.tree.DFS(lastNode, null, n => {
            //console.log(n.data.type.symbol);
            if (typeof n.data.type.action === 'function') {
                var args = n.edges.map(x => x.to.data.value);
                n.data.value = n.data.type.action.apply(context, args);
                //console.log(`${n.data.term}(${args.join(',')}) = ${n.data.value}`);
            }
        });
        return lastNode.data.value;
    };
    Expression.prototype.mergeNodes = function(nodes) {
        console.log('merge in' + nodes.map(n => `{${this.nodeToString(n)}}`).join('  '));
        // merge b into a if
        // - a has an action
        // - b is a literal
        // - b has an action but has less children than a
        var aix = 0;
        var merge = true;
        if (nodes.length == 2) {
            var bix = nodes.findIndex(x => x.data.code == this.syntax.literalCode);
            if (bix == -1) {
                bix = nodes.findIndex(x => typeof x.data.type.action !== 'function');
                if (bix != -1) {
                    aix = 1-bix;
                    merge = false;
                }
            }
            aix = 1 - bix;
            if (merge) {
                console.log(`${this.nodeToString(nodes[aix])} => ${this.nodeToString(nodes[bix])}`);
                this.tree.addEdge(nodes[aix], nodes[bix]);
            }
        } else {
            if (nodes.length > 2) {
                throw new Error('More than 2 nodes passed.');
            }
        }
        //console.log('merge out ' + this.nodeToString(nodes[aix]));
        return nodes[aix];
    };
    Expression.prototype.nodeToString = function(node, simple) {
        var text = `#${node.id}:'${node.data.term}'(${this.syntax.symbols[node.data.code]}:${node.data.type.symbol})`;
        if (!simple) {
            text += `${node.edges.map( x => ` [${this.nodeToString(x.to, true)}]`)}`;
        }
        return text;
    };
    Expression.prototype.createNode = function(code, type, term) {
        var node = new Node(code, this.syntax.grammar.prototypes[type], term);
        return this.tree.createNode(node);
    };

    var Syntax = function(grammar) {
        this.grammar = grammar;

        // add the literal symbol for non-keyword terms
        this.literal = '_L';
        this.literalType = { 'symbol': 'L'}
        this.grammar.prototypes[this.literal] = this.literalType;

        // build list of symbols
        this.symbols = [];
        for (var term in this.grammar.prototypes) {
            var symbol = this.grammar.prototypes[term].symbol;
            if (this.symbols.indexOf(symbol) == -1) {
                this.symbols.push(symbol);
            }
        }
        this.literalCode = this.symbols.length - 1;

        //for (var i=0; i<this.symbols.length; i++) console.log(`${i} => '${this.symbols[i]}'`);

        // sort rules by priority and input
        this.ruleMap = this.grammar.rules.sort( (a,b) => 100*(b.priority - a.priority) + b.input.localeCompare(a.input) );

        // transform rules to use indices in the symbols array instead of symbols
        for (var rk=0; rk<this.ruleMap.length; rk++) {
            var rule = this.ruleMap[rk];
            var key = [];
            for (var i=0; i<rule.input.length; ) {
                var candidate = -1, ci = 0;
                for (var ni=0; ni<this.symbols.length; ni++) {
                    var symbol = this.symbols[ni];
                    if (symbol.length > 0 && rule.input.substring(i).startsWith(symbol) && symbol.length > ci) {
                        candidate = ni;
                        ci = symbol.length;
                    }
                 }
                 if (candidate > 0) {
                     key.push(candidate);
                     i += ci;
                 } else {
                    throw new Error(`Could not transform symbol '${rule.input.substring(i)}'!`);
                }
            }
            var value = this.symbols.indexOf(rule.output);
            rule.in = key;
            rule.out = value;
        }
        //console.log(this.ruleMap.map(r => rs(r)).join('\n'));
    };

    Syntax.prototype.parse = function(expr) {
        var expression = new Expression(this);
        if (!expr || typeof expr !== 'string') {
            throw new Error(`Invalid expression!(${expr})`);
        }
        var start = 0, i = 0;
        while (i<expr.length) {
            var hasMatch = false;
            for (var nk in this.grammar.prototypes) {
                if (expr.substring(i).startsWith(nk)) {
                    if (start < i) {
                        var term = expr.substring(start, i);
                        var code = this.symbols.indexOf(this.grammar.prototypes[this.literal].symbol);
                        expression.createNode(code, this.literal, term);
                    }
                    if (this.grammar.prototypes[nk].symbol) {
                        var code = this.symbols.indexOf(this.grammar.prototypes[nk].symbol);
                        expression.createNode(code, nk, nk);
                    }
                    i += nk.length;
                    start = i;
                    hasMatch = true;
                }
            }
            if (!hasMatch) {
                i++;
            }
        }
        if (start < i) {
            var term = expr.substring(start, i);
            var code = this.symbols.indexOf(this.grammar.prototypes[this.literal].symbol);
            expression.createNode(code, this.literal, term);
            //nodes.push(this.createNode(code, this.literal, term));
        }
        console.log('Nodes: ' + expression.tree.nodes.map(x => `${expression.nodeToString(x, true)}`).join('  '));
        return expression;
    };

    public(Syntax, 'Syntax');
})();