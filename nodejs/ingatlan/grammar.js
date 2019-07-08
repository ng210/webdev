(function() {
    var grammar = {
        'separators': ' \t',
        'non-terminals': {
             'L': 'literal',
            'B1': 'bracket1',
            'B2': 'bracket2',
             'C': 'separator1',
            'FN': 'function',
            'O1': 'operator1',
            'O2': 'operator2',
            'F1': 'function1',
            'F2': 'function2'
        },
        'operators': {
            '(':    { 'non-terminal': 'B1', 'action': () => null },
            ')':    { 'non-terminal': 'B2', 'action': () => null },
            ',':    { 'non-terminal': 'C',  'action': () => null },
            '=':    { 'non-terminal': 'O2', 'action': (x, y) => x == y },
            '!=':   { 'non-terminal': 'O2', 'action': (x, y) => x != y },
            '<':    { 'non-terminal': 'O2', 'action': (x, y) => x < y },
            '>':    { 'non-terminal': 'O2', 'action': (x, y) => x > y },
            '~':    { 'non-terminal': 'O2', 'action': (x, y) => x.indexOf(y) != -1 },
            'AND':  { 'non-terminal': 'O1', 'action': (x, y) => x && y },
            'OR':   { 'non-terminal': 'O1', 'action': (x, y) => x || y }
        },
        'functions': {
            'dist': {
                'code': (x1, y1, x2, y2) => {
                var dx = x1 - x2;
                var dy = y1 - y2;
                return Math.sqrt(dx*dx + dy*dy);
            },
            'attr': {
                'binds': 'obj',
                'code': (obj, x) => obj[x]
            }
        },

        // Rule                             Action                                          Examples
        //  L -> 0                          create node                                     'blue', 100.12
        //  LO1MO1N -> RO1N | R = O1(L, M)  create node from result of operator O1          12+23+34
        //  LO2MO2N -> RO2N | R = O2(L, M)  create node from result of operator O2          12*23*34
        //  LO1MO2N -> RO2N | R = O1(L, M)  create node from result of operator O2          12+23*34
        //  LO2MO1N -> LO1R | R = O2(M, N)  create node from result of operator O2          12*23+34
        //  FB1     -> F1                   create function node                            dist(
        //  F1L     -> F2                   add function parameter                          dist(12.48
        //  F2B2    -> 0                    finalize function node                          dist(12.48)
        //  F2C     -> F1                   -                                               dist(12.48,
        'rules': {
            'FNB1':     { 'right':'F1', 'action': function(FN,B1) { console.log(`function: ${FN.value}`); return FN; } },
            'F1L':      { 'right':'F2', 'action': function(F1,L) { console.log(`parameter: ${L.value}`); F1.arguments.push(L); return F1; } },
            'F2C':      { 'right':'F1', 'action': function(F2,C) { return F2; } },
            'F2B2':     { 'right':'L',  'action': function(F2,B2) { return this.grammar.processFunction.call(this, F2); } },
            'LO2L':     { 'right':'L',  'action': function(L, O2, M) { return this.grammar.processOperator.call(this, O2, L, M); } }
        },
        'processFunction': function(F) {
            var node = F;
            if (!F.type.binds) {
                var canCalculate = true;
                for (var ai=0; ai<F.arguments.length; ai++) {
                    if (F.arguments[ai]['non-terminal'] != this.literalNonTerminal) {
                        canCalculate = false;
                        break;
                    }
                }
                if (canCalculate) {
                    var value = this.grammar.functions[F.value].code.apply(this.context, F.arguments.map(x => x.value));
                    console.log(`${F.value}(${F.arguments.map(x => x.value)}) = ${value}`);
                    node = this.createNode(value, this.literalNonTerminal);
                }
            }
            return node;
        },
        'processOperator': function(O, L, M) {
            var node = O;
            if (L.type == this.literalNonTerminal && M.type == this.literalNonTerminal) {
                var value = this.grammar.operators[O.value].action.call(L.value, M.value);
                console.log(`result: ${value}`);
                node = this.createNode(value, this.literalNonTerminal);
            }
            return node;
        }
    };
    module.exports = grammar;
})();