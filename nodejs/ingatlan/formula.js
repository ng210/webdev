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
        // Rules replace sequences of the input symbols with a single symbol. They also may have an associated action.
        // A rule defines
        // - a sequence of symbols as the input (left side). If this sequence matches the start of the input (left match) it will be replaced by a single symbol (right side).
        // - an action that is applied on the input symbols in case of a match.

        // 3. Analyzer
        // Creates instances of the node prototypes by processing the input.
        // - identify the next term as the keyword of a node prototype
        // - create a new instance of the prototype and store the term
        // - store the instance
        //

    var grammar = {
        'prototypes': {
            // functions
            // object bound functions (method)
            'getAttribute': {
                'symbol': 'M',
                'binds': 'obj',
                'action': (x) => obj[x]
            },
            'getType': {
                'symbol': 'M',
                'binds': 'obj',
                'action': () => obj.type
            },
            // general purpose functions
            'distance': {
                'symbol': 'F',
                'action': (x1,y1, x2,y2) => { var dx = x1-x2, dy = y1-y2; return Math.sqrt(dx*dx+dy*dy); }
            },
            'min': {
                'symbol': 'F',
                'action': (x,y) => x < y ? x : y
            },
            'max': {
                'symbol': 'F',
                'action': (x,y) => x > y ? x : y
            },
            // operators
            '#': { // works as the method getAttribute(name)
                'symbol': 'A',
                'binds': 'obj',
                'action': (obj, x) => obj[x]
            },
            '(': { // brackets are syntax elements only
                'symbol': 'B1',
            },
            ')': {
                'symbol': 'B2',
            },
            '*': {
                'symbol': 'O1',
                'action': (x, y) => x*y
            },
            '+': {
                'symbol': 'O2',
                'action': (x, y) => x+y
            },
            '=': {
                'symbol': 'O3',
                'action': (x, y) => x==y
            }
        },
        'rules': {

        }
    };

    var Syntax = function(grammar) {
        this.grammar = grammar;
        this.nodes = [];
    };

    Syntax.prototype.createNode = function(type, term) {
        var node = null;
        if (term !== '' && term !== undefined) {
            node = { value:term, 'non-terminal': type };
            if (type == this.functionNonTerminal) {
                node.arguments = [];
            }
        }
        return node;
    };

        'Node': function(type, term) {
            this.type = type;
        }
    };
    

    function Formula(grammar) {
        this.grammar = grammar;
        this.nodes = [];
        this.literalNonTerminal = -1;
        this.functionNonTerminal = -1;
        var ntList = Object.keys(this.grammar['non-terminals']);
        // replace non-terminal symbols in operator table
        for (var op in this.grammar.operators) {
            var nt = this.grammar.operators[op]['non-terminal'];
            var k = ntList.indexOf(nt);
            if (k != -1) {
                this.grammar.operators[op]['non-terminal-code'] = k;
            } else {
                throw new Error(` * Non-terminal associated to operator '${op}' missing!`);
            }
        }
        // replace non-terminal symbols to codes in the grammar rules
        for (var ri in this.grammar.rules) {
            var rule = this.grammar.rules[ri];
            //console.log(`rule: '${ri}'=>'${rule.right}'`);
            rule.leftCoded = Formula.transform(ri, ntList);
            rule.rightCoded = Formula.transform(rule.right, ntList);
            //console.log(`      '${rule.leftCoded}'=>'${rule.rightCoded}'`);
        }
    }
    Formula.transform = function(expr, nonTerminals) {
        var i = 0, result = [];
        while (i < expr.length) {
            var hasMatch = false;
            for (var nt=0; nt<nonTerminals.length; nt++) {
                if (expr.substring(i).startsWith(nonTerminals[nt])) {
                    hasMatch = true;
                    result.push(nt);
                    i += nonTerminals[nt].length;
                    //console.log(` - match: ${nonTerminals[nt]}(${nt})`);
                    break;
                }
            }
            if (!hasMatch) {
                throw new Error(` * Could not process rule at : ${expr.substring(i)}`);
            }
        }
        return result;
    };
    Formula.prototype.createNode = function(term, type) {
        var node = null;
        if (term !== '' && term !== undefined) {
            node = { value:term, 'non-terminal': type };
            if (type == this.functionNonTerminal) {
                node.arguments = [];
            }
        }
        return node;
    };
    Formula.prototype.parse = function(expr) {
        this.analyzeSyntax(expr);
        var tree = this.buildTree(this.nodes);
    };
    Formula.prototype.analyzeSyntax = function(expr) {
        this.nodes = [];
        // determine non-terminal symbol for literal and function
        var k = 0, count = 0;
        for (var nt in this.grammar['non-terminals']) {
            if (this.grammar['non-terminals'][nt] == 'literal') {
                this.literalNonTerminal = k;
                count++;
            }
            if (this.grammar['non-terminals'][nt] == 'function') {
                this.functionNonTerminal = k;
                count++;
            }
            if (count == 2) break;
            k++;
        }
        // tokenize expression
        var i = 0, start = 0, c = '';
        while (c = expr.charAt(i)) {
            // white spaces
            if (this.grammar.separators.indexOf(c) != -1) {
                //this.addTerm(expr.substring(start, i));
                var node = this.createNode(expr.substring(start, i), this.literalNonTerminal);
                if (node) this.nodes.push(node);
                i++;
                start = i;
                continue;
            }
            // operators and functions
            var hasMatch = false;
            for (var op in this.grammar.operators) {
                if (expr.substring(i).indexOf(op) == 0) {
                    var node = this.createNode(expr.substring(start, i), this.literalNonTerminal);
                    if (node) this.nodes.push(node);
                    node = this.createNode(op, this.grammar.operators[op]['non-terminal-code']);
                    if (node) this.nodes.push(node);
                    i += op.length;
                    start = i;
                    hasMatch = true;
                    break;
                }
            }
            if (hasMatch) {
                continue;
            }
            for (var fn in this.grammar.functions) {
                if (expr.substring(i).indexOf(fn) == 0) {
                    var node = this.createNode(fn, this.functionNonTerminal);
                    if (node) this.nodes.push(node);
                    i += fn.length;
                    start = i;
                    hasMatch = true;
                    break;
                }
            }
            if (hasMatch) {
                continue;
            }
            i++;
        }
        var node = this.createNode(expr.substring(start, i), this.literalNonTerminal);
        if (node) this.nodes.push(node);
    };
    Formula.prototype.buildTree = function(terms) {
        var root = {};
        var remaining = terms.length;
        while (remaining > 0) {
// console.log(` in: ${this.nodes.map(x => Object.keys(this.grammar['non-terminals'])[x['non-terminal']]).join('.')}`);
// console.log(`step ${i}`);
            // get a rule with a matching left side
            var hasMatchingRule = false;
            for (var r in this.grammar.rules) {
                var rule = this.grammar.rules[r];
//console.log(`      '${terms.map(x => x['non-terminal']).join('.')}' - ${rule.leftCoded}'=>'${rule.rightCoded}'`);
                if (rule.leftCoded.length <= remaining) {
                    for (var i=0; i<=terms.length-rule.leftCoded.length; i++) {
                        if (rule.leftCoded[0] == terms[i]['non-terminal']) {
                            var isMatching = true;
                            for (var j=1; j<rule.leftCoded.length; j++) {
                                if (rule.leftCoded[j] != terms[i+j]['non-terminal']) {
                                    isMatching = false;
                                    break;
                                }
                            }
                            if (isMatching) {
                                console.log(`Matching rule: ${r}=>${rule.right}`);
                                // action
                                var args = this.nodes.slice(i, i+rule.leftCoded.length);
                                var node = rule.action.apply(this, args);
                                // replace left with right side
                                if (rule.rightCoded.length != 0) {
                                    node['non-terminal'] = rule.rightCoded[0];
                                    terms.splice(i, rule.leftCoded.length, node);
                                } else {
                                    throw new Error('Right side of rule must not be empty!');
                                }
                                var diff = rule.leftCoded.length - rule.leftCoded.length;   //node['non-terminal'].length;
                                //i += diff;
                                remaining -= diff;
                                hasMatchingRule = true;
                                // console.log(`out: ${terms.map(x => JSON.stringify(x)).join('\n')}`);
                                // console.log(`step ${i}`);
                            }
                        }
                    }
                }
            }
            if (!hasMatchingRule) {
                if (terms.length == 1 && terms[0]['non-terminal'] == this.literalNonTerminal) {
                    console.log('Done');
                } else {
                    console.log('Illegal input: no matching rule found!');
                }
                break;
            }
        }
        return root;
    };
    Formula.prototype.apply = function(obj) {
        this.grammar.context = obj;
    }
    module.exports = Formula;
})();
