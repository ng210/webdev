(function() {
    include('data/graph.js');

    var rs = r => `${r.priority} ${r.input}(${r.in.join('.')})=>${r.output}(${r.out})`

    // A grammar consists of a list of node prototypes and rules.
    //
    // 1. Node prototypes used by the grammar
    // The prototypes are stored in a container object and describe the building blocks of a language.
    // - the keys are the keywords of the language
    // - the prototypes define
    //   - a symbol used in the grammatic rules
    //   - an optional action to execute
    // - words not identified are literals

    // 2. Rules
    // Rules replace sequences of the input nodes with a single node either returned by the rule's action or defined by the rule.
    // The whole input is scanned from left to right to find a matching rule.
    // Rules can be expressed as r(I*, O, P, A) where
    //  I*: sequence of input symbols
    //  O: an output symbol, null means no output
    //  P: priority
    //  A: action
    // Rules are sorted by priority and input sequence (longest first), thus
    // - rules with higher priority are matched and executed first
    // - rules with longer matching input sequence are executed first
    // To improve performance, a list of symbols defined by the prototypes and used by the rules is created.
    // The indices into the list is used in the rules instead of the symbols. This also allows to use strings with special characters as symbols.

    // 3. Parser
    // The parser creates an Expression, that stores instances of node prototypes extracted from the input.
    // - identify the next term as the keyword of a node prototype
    // - unidentified sequences are interpreted as literal nodes
    // - create a new instance of the prototype and store the term within it
    // - store the instance in the Expression
    // The nodes of the Expression are later used to construct the tree of dependency during the resolution.

    // 4. Resolution
    // The resolve method of the Expression accepts a 'context' argument and follows the steps below:
    // - tries to apply the rules on the input starting with the rule of the highest priority and with the longest input sequence
    // - applying a rule means executing the rule's action if defined and merging the input nodes if possible
    //    - the merge works on 2 and only 2 nodes
    //    - a literal node is always merged into the other node
    //    - a node without action is never merged into the other node, as such nodes should represent syntax elements only
    // - the merge adds a node to another node as a child node defining an edge in the tree that represents the dependency of the 2 nodes

    // 5. Evaluate
    // Last step is to evaluate the nodes of the tree in the proper order using a context passed by the user.
    // The nodes are visited by traversing the dependency tree using DFS and the operator/function actions are executed in post order.
    // The starting node of the DFS is the node processed as last during the rule application and merge phase.

    function Node(code, type, term) {
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
        this.tree = new Graph();
        this.syntax = syntax;
        this.expression = '';
        this.lastNode = null;
    }
    Expression.prototype.resolve = function(context) {
        this.lastNode = null;
        var nodes = Array.from(this.tree.vertices);
        if (this.syntax.isDebug) console.log(`input: ${nodes.map(x => `${this.syntax.symbols[x.data.code]}['${x.data.term}']`)}`);
        // try to apply rules as long as there are nodes
        while (nodes.length > 0) {
            for (var r=0; r<this.syntax.ruleMap.length;) {
                var hasMatch = false;
                var rule = this.syntax.ruleMap[r];
                // apply the rule on the input as many times as possible
                for (var n=0; n<nodes.length;) {
                    var i = 0;
                    // rule's input is shorter than the rest of the input
                    if (rule.in.length <= nodes.length - n) {
                        while (i<rule.in.length && (rule.in[i] == nodes[n+i].data.code)) i++;
                    } else {
                        // skip to next rule (iteration with r)
                        break;
                    }
                    if (i == rule.in.length) {
                        // match found, replace input by output
                        if (this.syntax.isDebug) console.log(`match: ${rs(rule)}`);
                        // extract rule's input
                        var args = nodes.slice(n, n+i);
                        var output = null;
                        if (typeof rule.action === 'function') {
                            // rule has an action, it can return the output
                            output = rule.action.apply(context, args);
                        }
                        if (rule.out && output) {
                            // overwrite the output code returned by the rule's action with the output defined be the rule
                            output.data.code = rule.out;
                            // replace the input by the output
                            nodes.splice(n, i, output);
                        } else if (rule.out && !output) {
                            // merge nodes: parent node depends on child node
                            // parent node returned as output
                            output = this.mergeNodes(args);
                            output.data.code = rule.out;
                            // replace the input by the output
                            nodes.splice(n, i, output);
                        } else if (!rule.out && !output) {
                            // remove the input (no output)
                            nodes.slice(n, i);
                        } else if (!rule.out && output) {
                            // replace the input by the output returned by the rule's action
                            nodes.splice(n, i, output);
                        } else {
                            throw new Error('Error!');
                        }
                        if (output) {
                            this.lastNode = output;
                        }
                        hasMatch = true;
                        if (this.syntax.isDebug) console.log(`result: ${nodes.map(x => `${this.syntax.symbols[x.data.code]}['${x.data.term}']`)}`);
                        break;
                    } else n++;
                }
                r = hasMatch ? 0 : r + 1;
            }
            break;
        }
        return this;
    };
    Expression.prototype.evaluate = function(context) {
        this.tree.DFS(this.lastNode, null, n => {
            // node handler calls action with the input nodes as arguments
            if (typeof n.data.type.action === 'function') {
                var args = n.edges.map(x => x.to);
                // action returns a (calculated) value of the node
                args.push(n);
                n.data.value = n.data.type.action.apply(context, args);
            }
        });
        return this.lastNode.data.value;
    };
    Expression.prototype.mergeNodes = function(nodes) {
        if (this.syntax.isDebug) console.log('merge in' + nodes.map(n => `{${this.nodeToString(n)}}`).join('  '));
        // merge b into a if
        // - a has an action attribute or has an edge
        // - b is a literal
        // - b has an action attribute or has an edge
        var aix = 0;
        if (nodes.length == 2) {
            // b is a literal
            var bix = nodes.findIndex(x => x.data.code == this.syntax.literalCode);
            if (bix == -1) {
                var an = nodes[0].data.type.action != null || nodes[0].edges.length > 0;
                var bn = nodes[1].data.type.action != null || nodes[1].edges.length > 0;
            //  an  bn => 0  1
            //  an !bn => 0 -1
            // !an !bn => 0 -1
            // !an  bn => 1 -1
                aix = !an && bn ? 1 : 0;
                bix = an && bn ? 1 : -1;
            } else {
                aix = 1 - bix;
            }
            if (aix != -1 && bix != -1) {
                this.tree.addEdge(nodes[aix], nodes[bix]);
            }
        } else {
            if (nodes.length > 2) {
                throw new Error('More than 2 nodes passed.');
            }
        }
        if (this.syntax.isDebug) console.log('merge out ' + this.nodeToString(nodes[aix]));
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
        return this.tree.createVertex(node);
    };

     function Syntax(grammar, debug) {
        this.isDebug = debug;
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

        //for (var i=0; i<this.symbols.length; i++)//console.log(`${i} => '${this.symbols[i]}'`);

        // sort rules by priority and input
        this.ruleMap = this.grammar.rules.sort( (a,b) => 1000*(b.priority - a.priority) + b.input.localeCompare(a.input) );

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

    Syntax.prototype.createExpression = function createExpression() {
        return new Expression(this);
    };
    Syntax.prototype.parse = function(expr, ignoreCase) {
        var expression = this.createExpression();
        expression.expression = expr;
        if (!expr || typeof expr !== 'string') {
            if (expr == '') {
                throw new Error('Empty expression!');
            } else {
                throw new Error(`Invalid expression!(${expr})`);
            }
        }
        var start = 0, i = 0;
        while (i<expr.length) {
            var hasMatch = false;
            var matched = expr.substring(i);
            if (ignoreCase) matched = matched.toLowerCase();
            for (var nk in this.grammar.prototypes) {
                if (matched.startsWith(nk)) {
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
                    break;
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
        //console.log('Nodes: ' + expression.tree.nodes.map(x => `${expression.nodeToString(x, true)}`).join('  '));
        return expression;
    };
    Syntax.Expression = Expression;

    publish(Syntax, 'Syntax');
})();
