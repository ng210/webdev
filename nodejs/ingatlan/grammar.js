(function() {
var grammar = {
    'prototypes': {
        // separator
        ' ': { 'symbol': '' },
        // operator
        '+': { 'symbol': 'A', 'action': (x, y) => x + y },
        '*': { 'symbol': 'M', 'action': (x, y) => x * y },
        '^': { 'symbol': 'P', 'action': (x, y) => Math.pow(x, y) },
        // functions
        'sin': { 'symbol': 'F', 'action': x => Math.sin(x) },
        'cos': { 'symbol': 'F', 'action': x => Math.cos(x) },
        // misc.
        '(': { 'symbol': 'B1' },
        ')': { 'symbol': 'B2' },
        ',': { 'symbol': 'C' },
        // states
        '__OP+L': { 'symbol': 'A1' },
        '__OP*L': { 'symbol': 'M1' },
        '__OP^L': { 'symbol': 'P1' }
    },
    'rules': {
        'LA':       { 'out': 'A1', 'action': function(L, A)      { A.addChild(L); return A; } },                                       // 1+
        'A1LP':     { 'out': 'P1', 'action': function(A1, L, P)  { P.addChild(L); A1.addChild(P); return P; } },                         // 1+2^
        'A1LM':     { 'out': 'M1', 'action': function(A1, L, M)  { M.addChild(L); A1.addChild(M); return M; } },                         // 1+2*
        'A1L':      { 'out': 'L',  'action': function(A1, L)     { A1.addChild(L); return A1; } },                       // 1+2
        'LM':       { 'out': 'M1', 'action': function(L,M)       { M.addChild(L); return M; } },                                       // 1*
        'M1LP':     { 'out': 'P1', 'action': function(M1, L, P)  { P.addChild(L); M1.right = P; return P; } },                         // 1*2^
        'M1L':      { 'out': 'L',  'action': function(M1, L)     { M1.addChild(L); return M1; } },                       // 1*2
        'LP':       { 'out': 'P1', 'action': function(L, P)      { P.addChild(L); return P; } },                                       // 1^
        'P1L':      { 'out': 'L',  'action': function(P1, L)     { P1.addChild(L); return P1; } },                       // 1^2
        'FB1':      { 'out': null, 'action': function(F, B1)     { stack.push(F); return null; } },                                 // sin
        'A1FB1':    { 'out': null, 'action': function(A1, F, B1) { A1.addChild(F); stack.push(F); return null; } },                   // 1+sin(
        'M1FB1':    { 'out': null, 'action': function(M1, F, B1) { M1.addChild(F); stack.push(F); return null; } },                   // 1*sin(
        'P1FB1':    { 'out': null, 'action': function(P1, F, B1) { P1.addChild(F); stack.push(F); return null; } },                   // 1^sin(
        'LB2':      { 'out': 'L',  'action': function(L, B2)     { F = stack.pop(); F.arguments.push(L); return F; } }, // 3)
        'LC':       { 'out': null, 'action': function(L, C)      { F = stack[stack.length-1]; F.arguments.push(L); return null; } }           // 2,
    },
};

var stack = [];

// var grammar = {
//     'prototypes': {
//         // separators
//         ' ': {
//             'symbol': ''
//         },
//         // object bound functions (methods)
//         'getAttribute': {
//             'symbol': 'M',
//             'binds': 'obj',
//             'action': (x) => obj[x]
//         },
//         'getType': {
//             'symbol': 'M',
//             'binds': 'obj',
//             'action': () => obj.type
//         },
//         // general purpose functions
//         'distance': {
//             'symbol': 'F',
//             'action': (x1,y1, x2,y2) => { var dx = x1-x2, dy = y1-y2; return Math.sqrt(dx*dx+dy*dy); }
//         },
//         'min': {
//             'symbol': 'F',
//             'action': (x,y) => x < y ? x : y
//         },
//         'max': {
//             'symbol': 'F',
//             'action': (x,y) => x > y ? x : y
//         },
//         // operators
//         '#': { // works as the method getAttribute(name)
//             'symbol': 'A',
//             'binds': 'obj',
//             'action': (obj, x) => obj[x]
//         },
//         '*': {
//             'symbol': 'O1',
//             'action': (x, y) => x*y
//         },
//         '+': {
//             'symbol': 'O2',
//             'action': (x, y) => x+y
//         },
//         '=': {
//             'symbol': 'O3',
//             'action': (x, y) => x==y
//         },
//         // brackets are syntax elements only
//         '(': {
//             'symbol': 'B1',
//         },
//         ')': {
//             'symbol': 'B2',
//         }
//     },
//     'rules': {

//     }
// };


// (function() {
//     var grammar = {
//         'prototypes': {
//             // separators
//             ' ': {
//                 'symbol': ''
//             },
//             ',': {
//                 'symbol': 'C'
//             },
//             // functions
//             // object bound functions (method)
//             'getAttribute': {
//                 'symbol': 'M',
//                 'binds': 'obj',
//                 'action': (x) => obj[x]
//             },
//             'getType': {
//                 'symbol': 'M',
//                 'binds': 'obj',
//                 'action': () => obj.type
//             },
//             // general purpose functions
//             'distance': {
//                 'symbol': 'F0',
//                 'action': (x1,y1, x2,y2) => { var dx = x1-x2, dy = y1-y2; return Math.sqrt(dx*dx+dy*dy); }
//             },
//             'min': {
//                 'symbol': 'F0',
//                 'action': (x,y) => x < y ? x : y
//             },
//             'max': {
//                 'symbol': 'F0',
//                 'action': (x,y) => x > y ? x : y
//             },
//             // operators
//             '#': { // works as the method getAttribute(name)
//                 'symbol': 'A',
//                 'binds': 'obj',
//                 'action': (obj, x) => obj[x]
//             },
//             '(': { // brackets are syntax elements only
//                 'symbol': 'B1',
//             },
//             ')': {
//                 'symbol': 'B2',
//             },
//             '*': {
//                 'symbol': 'O1',
//                 'action': (x, y) => x*y
//             },
//             '+': {
//                 'symbol': 'O2',
//                 'action': (x, y) => x+y
//             },
//             '=': {
//                 'symbol': 'O3',
//                 'action': (x, y) => x==y
//             },
//             '<': {
//                 'symbol': 'O4',
//                 'action': (x, y) => x<y
//             },
//             // states
//             '__functionStart': {
//                 'symbol': 'F1'
//             },
//             '__functionWithArgument': {
//                 'symbol': 'F2'
//             },
//             '__functionToCalculate': {
//                 'symbol': 'F3'
//             },
//             '__operatorWithLeftSide': {
//                 'symbol': 'OL'
//             }

//         },
//         'rules': {
//             'F0B1':     function(F0,B1) { F0.type = this.symbols.indexOf('F1'); return F0; },
//             'F1L':      function(F1,L) { F1.type = this.symbols.indexOf('F2'); F1.children.push(L); return F1; },
//             'F2C':      function(F2,C) { F2.type = this.symbols.indexOf('F1'); return F2; },
//             'F2B2':     function(F2,B2) { return this.grammar.processFunction.call(this, F2); },
//             'LO2L':     function(L, O2, M) { return this.grammar.processOperator.call(this, O2, L, M); },
//             'LO4L':     function(L, O4, M) { return this.grammar.processOperator.call(this, O4, L, M); },
//             'LO4F0':    function(L, O4, F0) { this.grammar.processOperator.call(this, O4, L, F0); return F0; },

//             LO1=>OL
//             OLL=>OR
//             OLF0=>
//         },


    // var grammar = {
    //     'separators': ' \t',
    //     'non-terminals': {
    //          'L': 'literal',
    //         'B1': 'bracket1',
    //         'B2': 'bracket2',
    //          'C': 'separator1',
    //         'FN': 'function',
    //         'O1': 'operator1',
    //         'O2': 'operator2',
    //         'F1': 'function1',
    //         'F2': 'function2'
    //     },
    //     'operators': {
    //         '(':    { 'non-terminal': 'B1', 'action': () => null },
    //         ')':    { 'non-terminal': 'B2', 'action': () => null },
    //         ',':    { 'non-terminal': 'C',  'action': () => null },
    //         '=':    { 'non-terminal': 'O2', 'action': (x, y) => x == y },
    //         '!=':   { 'non-terminal': 'O2', 'action': (x, y) => x != y },
    //         '<':    { 'non-terminal': 'O2', 'action': (x, y) => x < y },
    //         '>':    { 'non-terminal': 'O2', 'action': (x, y) => x > y },
    //         '~':    { 'non-terminal': 'O2', 'action': (x, y) => x.indexOf(y) != -1 },
    //         'AND':  { 'non-terminal': 'O1', 'action': (x, y) => x && y },
    //         'OR':   { 'non-terminal': 'O1', 'action': (x, y) => x || y }
    //     },
    //     'functions': {
    //         'dist': {
    //             'code': (x1, y1, x2, y2) => {
    //             var dx = x1 - x2;
    //             var dy = y1 - y2;
    //             return Math.sqrt(dx*dx + dy*dy);
    //         },
    //         'attr': {
    //             'binds': 'obj',
    //             'code': (obj, x) => obj[x]
    //         }
    //     },

    //     'rules': {
    //         'FNB1':     (FN,B1) => { console.log(`function: ${FN.value}`); return FN; },
    //         'F1L':      (F1,L) => { console.log(`parameter: ${L.value}`); F1.arguments.push(L); return F1; },
    //         'F2C':      (F2,C) => F2,
    //         'F2B2':     (F2,B2) => this.grammar.processFunction.call(this, F2),
    //         'LO2L':     (L, O2, M) => this.grammar.processOperator.call(this, O2, L, M)
    //     },
//         'processFunction': function(F) {
//             var node = F;
//             if (!F.type.binds) {
//                 var canCalculate = true;
//                 for (var ai=0; ai<F.children.length; ai++) {
//                     if (F.children[ai].type != this.literal) {
//                         canCalculate = false;
//                         break;
//                     }
//                 }
//                 if (canCalculate) {
//                     var value = this.grammar.prototypes[F.term].action.apply(this.context, F.children.map(x => x.term));
//                     console.log(`${F.term}(${F.children.map(x => x.term)}) = ${value}`);
//                     node = this.createNode(this.literal, value);
//                 } else {
//                     node.type = this.symbols.indexOf('F3');
//                 }
//             }
//             return node;
//         },
//         'processOperator': function(O, L, M) {
//             var node = O;
//             if (L.type == this.literal && M.type == this.literal) {
//                 var value = this.grammar.prototypes[O.term].action.call(this.context, L.term, M.term);
//                 console.log(`(${L.term} ${O.term} ${M.term}) = ${value}`);
//                 node = this.createNode(this.literal, value);
//             } else {
//                 O.children.push(L, M);
//             }
//             return node;
//         }
//     };
    module.exports = grammar;
})();