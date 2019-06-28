(function() {
    function Formula(expr) {
        var terms = this.analyzeSyntax(expr);
        this.tree = this.buildTree(terms);
    }
    Formula.termTypes = {
        "L": "literal",
        "B1": "(",
        "B2": ")",
        "C": ",",
        "F": "function",
        "O1": "operator1",
        "O2": "operator2"
    };
    Formula.operators = {
        '=':    { type: 'O2', value: (x, y) => x == y },
        '!=':   { type: 'O2', value: (x, y) => x != y },
        '<':    { type: 'O2', value: (x, y) => x < y },
        '>':    { type: 'O2', value: (x, y) => x > y },
        '~':    { type: 'O2', value: (x, y) => x.indexOf(y) != -1 },
        'AND':  { type: 'O1', value: (x, y) => x && y },
        'OR':   { type: 'O1', value: (x, y) => x || y }    
    };
    Formula.functions = {
        'dist': (x, y, obj) => {
            var dLat = x - obj.latitude;
            var dLon = x - obj.longitude;
            var d = 0;
            return d;
        },
        'attr': (x, obj) => obj[x]
    };
    Formula.prototype.analyzeSyntax = function(expr) {
        var terms = [];
        var charToType = {
            '(': 'B1',
            ')': 'B2',
            ',': 'C'
        };
        function _addTerm(value, type) {
            if (value) {
                terms.push({value:value, type:(type || 'L')});
            }
        }
        var i = 0, start = 0, c = '';
        // tokenize expression
        // separators are white spaces, brackets, operators and function names
        while (c = expr.charAt(i)) {
            // white space
            if (c == ' ' || c == '\t') {
                _addTerm(expr.substring(start, i));
                i++;
                start = i;
                continue;
            }
            // brackets
            if (c =='(' || c == ')' || c == ',') {
                _addTerm(expr.substring(start, i));
                _addTerm(c, charToType[c]);
                i++;
                start = i;
                continue;
            }
            // operators and functions
            var hasMatch = false;
            for (var op in Formula.operators) {
                if (expr.substring(i).indexOf(op) == 0) {
                    _addTerm(op, Formula.operators[op].type);
                    i += op.length;
                    start = i;
                    hasMatch = true;
                    break;
                }
            }
            if (hasMatch) {
                continue;
            }
            for (var fn in Formula.functions) {
                if (expr.substring(i).indexOf(fn) == 0) {
                    _addTerm(fn, 'F');
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
        _addTerm(expr.substring(start, i));
        console.log('\n'+terms.map(x => `${x.value} : ${x.type}`).join('\n'));
        return terms;
    };
    Formula.prototype.buildTree = function(terms) {
        // terms: function F; operator O1,O2; separator B1,C,B2; literal L,M,N; Sx stack
        // Rule                             Action                                          Examples
        //  L -> 0                          create node                                     'blue', 100.12
        //  LO1MO1N -> RO1N / R = O1(L, M)  create node from result of operator O1          12+23+34
        //  LO2MO2N -> RO2N / R = O2(L, M)  create node from result of operator O2          12*23*34
        //  LO1MO2N -> RO2N / R = O1(L, M)  create node from result of operator O2          12+23*34
        //  LO2MO1N -> LO1R / R = O2(M, N)  create node from result of operator O2          12*23+34
        //  FB1     -> Sf                   create function node                            dist(
        //  SfL     -> Sl                   add function parameter                          dist(12.48
        //  SlB2    -> 0                    finalize function node                          dist(12.48)
        //  SlC     -> Sf                   -                                               dist(12.48,
        var root = {};
        return root;
    };
    Formula.prototype.match = function(obj) {
    
    }
    module.exports = Formula;
})();