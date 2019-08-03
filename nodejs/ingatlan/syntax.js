(function() {
    // A grammar consists of a list of node prototypes and rules.

    // 1. Node prototypes used by the grammar
    // - the keys are the keywords of the language
    // - the prototypes define
    //   - a symbol used in the grammatic rules
    //   - an optional binding
    //   - an optional action to execute
    // - words not identified are literals

    // 2. Rules
    // Rules replace sequences of the input nodes with a single node returned by the rule's action. The nodes are selected by their symbols, therefore the rules are represented by strings.
    // R: L => R, where
    // - L is the left side, a sequence of symbols of node prototypes,
    // - R is the right side, a single symbol.
    // If the left side matches the start of the input (left match) the action is called with the matching nodes as the arguments. The action returns a single node that replaces the input nodes.
    // Example:
    //      'AB': (A,B) => C - this rule replaces the sequence of input nodes with the symbols 'A' and 'B' by the node 'C'.
    // As a performance enhancement, the symbols are replaced by indices of node prototypes.
    // Example:
    //      prototypes: { 'A': {...}, 'B': {...}, 'C': {...} }
    //      original, readable rule: 'AB': (A,B) => createNode('C')
    //      transformed rule: [0, 1]: (A,B) => createNode('C') // creates node of prototype #2

    // 3. Parser
    // Creates instances of the node prototypes by processing the input.
    // - identify the next term as the keyword of a node prototype
    // - create a new instance of the prototype and store the term
    // - store the instance

    // 4. Analyzer
    // Applies the rules on the input if possible. The process is successful if and only if the whole input was processed.
    // As a "side-effect" the rule actions can be used to transform, compile the input.

    function Node(id, type, term) {
        this.id = id;
        this.parent = null;
        this.type = type;
        this.symbol = type;
        this.term = term;
        this.value = parseFloat(term) || term;
        this.children = [];
    };
    Node.prototype.addChild = function(node) {
        this.children.push(node);
        node.parent = this;
    };
    Node.prototype.toString = function(simple) {
        var text = `#${this.id}: '${this.term}' (${this.type})`;
        if (!simple) {
            text += `${this.children.map( x => ` [${x.toString(true)}]`)}`;
        }
        return text;
    };

    var Syntax = function(grammar) {
        this.grammar = grammar;
        this.nodeId = 0;

        // build list of symbols
        this.symbols = [];
        var values = Object.values(this.grammar.prototypes).map( x => x.symbol);
        for (var i=0; i<values.length; i++) {
            if (this.symbols.indexOf(values[i]) == -1) {
                this.symbols.push(values[i]);
            }
        }
        this.literal = this.symbols.length;
        this.symbols.push('L');

        // transform rules to use indices instead of symbols
        this.ruleMap = [];
        for (var rk in this.grammar.rules) {
            var rule = this.grammar.rules[rk];
            var key = [];
            for (var i=0; i<rk.length; ) {
                var candidate = -1, ci = 0;
                for (var ni=0; ni<this.symbols.length; ni++) {
                    var symbol = this.symbols[ni];
                    //console.log(` - '${symbol}'`);
                    if (symbol.length > 0 && rk.substring(i).startsWith(symbol) && symbol.length > ci) {
                        candidate = ni;
                        ci = symbol.length;
                    }
                 }
                 if (candidate > 0) {
                     key.push(candidate);
                     i += ci;
                 } else {
                    throw new Error(`Could not transform symbol '${rk.substring(i)}!'`);
                }
            }
            var value = this.symbols.indexOf(rule.out);
            this.ruleMap.push({'in':key, 'out':value, 'action': rule.action});
        }
        //console.log(this.ruleMap.map( x => JSON.stringify(x)));
    };
    Syntax.prototype.createNode = function(type, term) {
        var node = new Node(this.nodeId++, type, term);
        for (var a in Object.values(this.grammar.prototypes)[type]) {
            node[a] = Object.values(this.grammar.prototypes)[type][a];
        }
        node.symbol = node.type;
        return node;
    };
    Syntax.prototype.parse = function(expr) {
        var nodes = [];
        var start = 0, i = 0;
        while (i<expr.length) {
            var hasMatch = false;
            for (var nk in this.grammar.prototypes) {
                if (expr.substring(i).startsWith(nk)) {
                    if (start < i) {
                        var term = expr.substring(start, i);
                        nodes.push(this.createNode(this.literal, term));
                        //console.log(`${term}: ${Syntax.literal}`);
                    }
                    if (this.grammar.prototypes[nk].symbol) {
                        var type = this.symbols.indexOf(this.grammar.prototypes[nk].symbol);
                        nodes.push(this.createNode(type, nk));
                        //console.log(`${nk}: ${ni}`);
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
            nodes.push(this.createNode(this.literal, term));
        }
        console.log(nodes.map(x => `'${x.term}'(${this.symbols[x.type]}:${x.type})`).join('.'));
        return nodes;
    };
    Syntax.prototype.resolve = function(nodes) {
        var node = null;
        var copy = Array.from(nodes);
        while (nodes.length > 0) {
            var hasMatchingRule = false;
            for (var ri=0; ri<this.ruleMap.length; ri++) {
                var key = this.ruleMap[ri].in;
                //console.log(key+': '+nodes.slice(0, key.length).map(x => `'${x.term}'(${this.symbols[x.type]}:${x.type})`).join('.'));
                if (key.length <= nodes.length) {
                    var hasMatch = true;
                    for (var ki=0; ki<key.length; ki++) {
                        if (key[ki] != nodes[ki].symbol) {
                            hasMatch = false;
                            break;
                        }
                    }
                    if (hasMatch) {
                        console.log(`matching rule: ${key.map(x => this.symbols[x])}`);
                        var args = nodes.slice(0, key.length);
                        node = this.ruleMap[ri].action.apply(this, args);
console.log(node.toString());
                        if (node != null && this.ruleMap[ri].out != null) {
                            node.symbol = this.ruleMap[ri].out;
                            nodes.splice(0, key.length, node);
                        } else {
                            nodes.splice(0, key.length);
                        }
                        hasMatchingRule = true;
                    }
                }
            }
            if (!hasMatchingRule) {
                if (nodes.length == 1 && nodes[0].symbol == this.literal) {
                    console.log('Done.');
                } else {
                    throw new Error(`Illegal input: no matching rule found at '${nodes.slice(0).map(x => x.term).join('')}'`);
                }
                break;
            }
        }
        copy.forEach( x => { if (x.type != this.literal) console.log(`${x.toString()}`); });
        node = nodes.pop();
        while (node.parent != null) {
            node = node.parent;
        }
        console.log(node.toString());
        // var child = node;
        // while (child != null) {
        //     console.log(child.toString(true));
        //     child = child.children[0];
        // }
        //            7+
        //          /   \
        //        3+      \
        //      /  \        \
        //   1*     5*      9*
        //  /  \   /  \    /  \
        // 0   2  4    6  8    a
        // 1   2  3    4  5    6

        // var execution = [];
        // var remaining = [node];
        // while (remaining.length > 0) {
        //     node = remaining.pop();
        //     console.log(node.toString());
        //     for (var ci=0; ci<node.children.length; ci++) {
        //         if (node.children[ci].type != this.literal) {
        //             remaining.push(node.children[ci]);
        //         }
        //     }
        //     execution.push(node);
        // }

        // for (var i=execution.length-1; i>=0; i--) {
        //     node = execution[i];
        //     node.value = this.grammar.prototypes[node.term].action.apply(this, [node.left.value, node.right.value]);
        // }
        // console.log(execution[0].value);

        // var remaining = nodes.length;
        // while (remaining > 0) {
        //     var hasMatchingRule = false;
        //     for (var ri=0; ri<this.ruleMap.length; ri++) {
        //         var key = this.ruleMap[ri].key;
        //         for (var i=0; i<nodes.length; i++) {
        //             console.log(key+': '+nodes.slice(i, key.length).map(x => `'${x.term}'(${this.symbols[x.type]}:${x.type})`).join('.'));
        //             //console.log(`'${nodes[i].term}'(${nodes[i].type})`);
        //             var hasMatch = true;
        //             if (remaining >= key.length) {
        //                 //console.log(`Matching: ${nodes.slice(i).map(x=>x.type)} - ${key}`);
        //                 for (var ki=0; ki<key.length; ki++) {
        //                     if (key[ki] != nodes[i+ki].type) {
        //                         hasMatch = false;
        //                         break;
        //                     }
        //                 }
        //                 if (hasMatch) {
        //                     console.log(`matching rule: '${key}'`);
        //                     var args = nodes.slice(i, key.length);
        //                     var node = this.ruleMap[ri].rule.apply(this, args);
        //                     nodes.splice(i, key.length, node);
        //                     remaining -= key.length-1;
        //                     hasMatchingRule = true;
        //                 }
        //             }
        //         }
        //         if (!hasMatchingRule) {
        //             throw new Error(`Could not match a rule at '${nodes.slice(i).map(x => x.term).join('')}'`);
        //         }
        //     }
        // }
    };
    module.exports = Syntax;
})();