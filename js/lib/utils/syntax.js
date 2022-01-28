(function() {
    include('/lib/data/dictionary.js');
    include('/lib/data/graph.js');

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
    // - applying a rule means executing the rule's action if defined and eventually merging the input nodes if the left side of the rule contains more symbols than the right side.
    //    - if the left side contains more than 2 symbols the node with the symbol missing on the right side is merge into the leftmost node
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
    Node.prototype.getValue = function getValue() {
        var value = null;
        if (this.vertex.edges.length > 0) {
            value = [];
            this.value != undefined ? value.push(this.value) : value.push(this.term);
            for (var i=0; i<this.vertex.edges.length; i++) {
                var n = this.vertex.edges[i].to.data;
                n.value != undefined ? value.push(n.value) : value.push(n.term);
            }
        } else {
            value = this.value != undefined ? this.value : this.term;
        }
        return value;
    };

    function Expression(syntax) {
        this.tree = new Graph();
        this.syntax = syntax;
        this.expression = '';
        this.lastNode = null;
    }
    Expression.prototype.createInOutMap = function createInOutMap(ruleIn, ruleOut, missing) {
        var inOutMap = new Dictionary();
        var arr = Array.from(ruleOut);
        for (var i=0; i<ruleIn.length; i++) {
            var found = false;
            for (var j = 0; j<arr.length; j++) {
                if (ruleIn[i] == arr[j] && arr[j] != this.syntax.literalCode) {
                    inOutMap.put(i, j);
                    arr[j] = null;
                    found = true;
                    break;
                }
            }
            if (!found) {
                missing.push(i);
            }
        }
        return inOutMap;
    };
    Expression.prototype.mergeNodes = function mergeNodes(nodes, inOutMap) {
        if (this.syntax.debug > 2) console.log('merge in: ' + nodes.map(n => `{${this.nodeToString(n)}}`).join('  '));
        var parents = nodes.map(() => 0);
        for (var i=0; i<nodes.length; i++) {
            var node = nodes[i];
            // candidate for parent:
            // - appears on both sides of the rule, strongest rule
            if (inOutMap.has(i)) parents[i] += 10;
            // - has an edge
            if (node.edges.length > 0) parents[i]++;
            // - has an action
            if (node.data.type.action != null) parents[i]++;
            // - non-literal node
            if (node.data.code == this.syntax.literalCode) parents[i] -= 8;
            // - is a start node
            if (node.data.type.start) parents[i]++;
            // - not ignored
            if (node.data.type.ignore) parents[i] -= 10;
        }
        // - leftmost node wins
        var pi = 0;
        for (var i=1; i<parents.length; i++) {
            if (parents[i] > parents[pi]) pi = i;
        }
        var parent = nodes[pi];
        var remains = [];
        var ci = nodes.length - inOutMap.size;
        for (var i=0; i<nodes.length; i++) {
            if (i == pi || inOutMap.has(i)) {
                remains.push(nodes[i]);
                continue;
            } else if (!nodes[i].data.type.ignore) {
                this.tree.addEdge(parent, nodes[i]);
                nodes[i] = null;
            }
            if (ci-- == 0) break;
        }
        if (this.syntax.debug > 2) console.log('merge out: ' + remains.map(n => `{${this.nodeToString(n)}}`).join('  '));
        return remains;
    };
    Expression.prototype.shuffleNodes = function shuffleNodes(nodes, inOutMap) {
        var arr = new Array(nodes.length);
        for (var j=0; j<nodes.length; j++) {
            var ix = inOutMap.has(j) ? inOutMap.get(j) : j;
            arr[ix] = nodes[j];
        }
        return arr;
    };
    Expression.prototype.applyRule = function applyRule(rule, nodes, n, context) {
        // match found, replace input by output
        var i = rule.in.length;
        if (this.syntax.debug > 1) console.log(`match: ${rs(rule)}`);
        // extract rule's input
        var inNodes = nodes.splice(n, i);
        // get output
        var ruleOut = rule.out;
        if (typeof rule.action === 'function') {
            var outNodes = rule.action.apply(context, inNodes);
            if (outNodes != null) {
                if (!Array.isArray(outNodes)) outNodes = [outNodes];
                ruleOut = outNodes.map(x => x.data.code);
            }
        }

        if (rule.in.length < ruleOut.length) {
            throw new Error('Invalid rule: output cannot be longer than input!');
        }
        var outNodes = [];
        if (!this.syntax.symbols.getAt(ruleOut[0]).empty) {
            var missing = [];
            outNodes = inNodes;
            // get mapping between in-out symbols and missing symbols
            var inOutMap = this.createInOutMap(rule.in, ruleOut, missing);
            if (rule.in.length > ruleOut.length) {
                // merge nodes
                outNodes = this.mergeNodes(inNodes, inOutMap);
            }

            // shuffle nodes
            if (inOutMap.size > 0) {
                outNodes = this.shuffleNodes(outNodes, inOutMap);
            }

            // relabel nodes
            if (outNodes.length > 0) {
                for (var i=0; i<ruleOut.length; i++) {
                    var code = ruleOut[i];
                    outNodes[i].data.code = code;
                    outNodes[i].data.type = this.syntax.symbols.getAt(code);
                }
            }
        }
        // re-insert the processed nodes
        nodes.splice(n, 0, ...outNodes);
        if (nodes[0]) {
            this.lastNode = nodes[0];
        }

        //if (this.syntax.debug > 1) console.log(`result: ${nodes.map(x => `${this.syntax.symbols.getAt(x.data.code).symbol}['${x.data.term.replace(/[\n\r]/g, '\\n')}']`)}`);
        if (this.syntax.debug > 0) console.log('result: ' + nodes.map(n => `{${this.nodeToString(n)}}`).join('  '));
    };
    Expression.prototype.matchRule = function matchRule(rule, nodes, context) {
        // apply the rule on the input as many times as possible
        var hasMatch = false;
        for (var n=0; n<nodes.length;) {
            var i = 0;
            // rule's input is shorter than the rest of the input
            if (rule.in.length <= nodes.length - n) {
                while (i<rule.in.length) {
                    if (rule.in[i] != nodes[n+i].data.code && rule.in[i] != this.syntax.wildcardCode) break;
                    i++;
                }
                if (i == rule.in.length) {
                    // apply the matching rule
                    this.applyRule(rule, nodes, n, context);
                    hasMatch = true;
                    break;
                } else {
                    // step to next symbol of input
                    n++;
                }
            } else {
                // rule's input too long, skip to next rule
                break;
            }
        }
        return hasMatch;
    };
    Expression.prototype.resolve = function(context) {
        this.lastNode = null;
        var nodes = Array.from(this.tree.vertices);
        if (this.syntax.debug > 0) console.log(`input: ${nodes.map(x => `${x.data.type.symbol}['${x.data.term.replace(/[\n\r]/g, '\\n')}']`)}`);
        // try to apply rules as long as there are nodes
        while (nodes.length > 0) {
            var r = 0;
            while (r<this.syntax.ruleMap.length) {
                var rule = this.syntax.ruleMap[r];
                if (this.matchRule(rule, nodes, context)) {
                    // has a match, start over
                    // TODO: sort rules by prio and input length
                    r = 0;
                } else {
                    // has no match, try the next rule
                    r++;
                }
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
                args.unshift(n);
                n.data.value = n.data.type.action.apply(context, args);
            }
        });
        return this.lastNode.data;  //.value;
    };
    Expression.prototype.nodeToString = function(node, simple) {
        var value = typeof node.data.value !== 'object' ? node.data.value.toString() : node.data.term;
        value = value.replace(/[\n\r]/g, '\\n');
        var text = `#${node.id}:'${value}'(${this.syntax.symbols.getAt(node.data.code).symbol}:${node.data.type.symbol})`;
        if (!simple) {
            text += `${node.edges.map( x => ` [${this.nodeToString(x.to, true)}]`)}`;
        }
        return text;
    };
    Expression.prototype.createNode = function(code, type, term) {
        var node = new Node(code, this.syntax.grammar.prototypes[type], term);
        return node.vertex = this.tree.createVertex(node);
    };

    function Syntax(grammar, debug) {
        this.debug = debug;
        this.grammar = grammar;

        if (grammar) {
            // add the literal symbol for non-keyword terms
            this.literal = '_L';
            this.literalType = { 'symbol': 'L'}
            this.grammar.prototypes[this.literal] = this.literalType;
            // add the wildcard symbol
            this.wildcard = '_*';
            this.wildcardType = { 'symbol': '*'}
            this.grammar.prototypes[this.wildcard] = this.wildcardType;

            this.startTerm = null;

            // build list of symbols
            this.symbols = new Dictionary();

            for (var term in this.grammar.prototypes) {
                var type = this.grammar.prototypes[term]
                var symbol = type.symbol;
                if (!this.symbols.has(symbol)) {
                    this.symbols.put(symbol, type);
                }
                if (type.start) this.startTerm = term;
            }
            this.literalCode = this.symbols.size - 2;
            this.wildcardCode = this.symbols.size - 1;
            // extract symbols from rules' outputs
            for (var ri=0; ri<this.grammar.rules.length; ri++) {
                var rule = this.grammar.rules[ri];
                var symbols = rule.output != null ? rule.output.split(' ') : [''];
                if (symbols[0] != '') {
                    for (var i=0; i<symbols.length; i++) {
                        if (!this.symbols.has(symbols[i])) {
                            this.symbols.put(symbols[i], {'symbol':symbols[i]});
                        }
                    }
                } else {
                    if (!this.symbols.has('')) {
                        this.symbols.put('', {'symbol':'', 'empty':true});
                    }
                }
            }
            // transform rules to use indices in the symbols array instead of symbols
            for (var rk=0; rk<this.grammar.rules.length; rk++) {
                var rule = this.grammar.rules[rk];
                var symbols = rule.input.split(' ');
                rule.in = [];
                for (var i=0; i<symbols.length; i++) {
                    var ix = this.symbols.indexOf(symbols[i]);
                    if (ix != -1) {
                        rule.in.push(ix);
                    } else {
                        throw new Error(`Could not transform symbol '${symbols[i]}'!`);
                    }
                }

                rule.out = null;
                if (rule.output != null) {
                    symbols = rule.output.split(' ');
                    if (symbols.length > 0) {
                        rule.out = [];
                        for (var i=0; i<symbols.length; i++) {
                            var ix = this.symbols.indexOf(symbols[i]);
                            if (ix != -1) {
                                rule.out.push(ix);
                            } else {
                                throw new Error(`Could not transform symbol '${symbols[i]}'!`);
                            }
                        }
                    }
                }
            }
            // sort rules by priority and input length
            this.ruleMap = this.grammar.rules.sort( (a,b) => 1000*(b.priority - a.priority) + b.input.length - a.input.length );

            //console.log(this.ruleMap.map(r => rs(r)).join('\n'));
        }
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

        if (this.startTerm != null) {
            var type = this.grammar.prototypes[this.startTerm];
            expression.createNode(this.symbols.indexOf(type.symbol), this.startTerm, '<start>');
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

    Syntax.Node = Node;
    Syntax.Expression = Expression;
    publish(Syntax, 'Syntax');
})();
