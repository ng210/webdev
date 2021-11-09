include('/lib/base/dbg.js');

//var _indentText = ['&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;'];

var TestConfig = {
    indentText: '        ',
    bulletinSymbols: ['', '►', '▪', '∙'],
    pending: 0,
    indent: 0,
    indentColor: [240,224,192],
    defaultColor: [192, 240, 208],
    buttonCount: 0,

    isNonInteractive: false,
    isSilent: false,

    assertion_operators: {
            "=": { "term": "equal", "action": (a, b) => equals(a,b) },
            "~": { "term": "match", "action": (a, b) => approx(a, b) },
            "!=": { "term": "not be", "action": (a, b) => a != b },
            "<": { "term": "be less", "action": (a, b) => a < b },
            ">": { "term": "be greater", "action": (a, b) => a > b },
            "<=": { "term": "be less or equal", "action": (a, b) => a <= b },
            ">=": { "term": "be greater or equal", "action": (a, b) => a >= b },
            ":=": { "term": "match", "action": (a, b) => deepCompare(a, b) },
        "empty": { "term": "be empty", "action": a => isEmpty(a) },
        "!empty": { "term": "have an element", "action": a => !isEmpty(a) },
        "true":   { "term": "be true", "action": a => a == true },
        "false":  { "term": "be false", "action": a => a == false },
        "null":   { "term": "be null", "action": a => a == null },
        "!null":  { "term": "be not null", "action": a => a != null }
    }
};

function formatResult(value, color) {
    color = color || TestConfig.defaultColor;
    var f = TestConfig.indent < 8 ? TestConfig.indent/8 : 1;
    var e = 1 - f;
    var rgb = new Array(3);
    for (var i=0; i<3; i++) {
        var c = Math.floor(color[i]*e + TestConfig.indentColor[i]*f);
        rgb[i] = c < 256 ? c : 255;
    }
    return `<pre>${TestConfig.indentText.substr(0, TestConfig.indent)}</pre><span class="test" style="color:rgb(${rgb})">${TestConfig.bulletinSymbols[TestConfig.indent<TestConfig.bulletinSymbols.length-1 ? TestConfig.indent : TestConfig.bulletinSymbols.length-1]} ${value}</span>`;
}

function print(node, color) {
    if (!TestConfig.isSilent) {
        if (Array.isArray(node)) {
            for (var i=0; i<node.length; i++) {
                print(node[i], color);
            }
        } else {
            Dbg.pr(formatResult(node, color));
        }
    }
}

function print_result(context, result) {
    if (!TestConfig.isSilent) {
        var lbl = context.lbl.replace(/&apos;|&quot;/g, m => m == '&apos;' ? '\'' : '"');
        var errorText = 'Failed';
        if (result instanceof Error) {
            errorText += ' => <div class="error-details"><pre>ERROR: ' + result.stack.replace(/[<>&]/g, v => ({'<':'&lt;', '>':'&gt;', '&':'&amp;'}[v])) + '</pre></div>';
        };
        var text = (context.errors == 0 && !result) ? `${lbl}..<span style="color:#40ff40">Ok</span>` : `${lbl}..<span style="color:#ff4040">${errorText}</span>`;
        var spans = Dbg.con.querySelectorAll('.test'); //Dbg.con.getElementsByTagName('span');
        for (var i=0; i<spans.length; i++) {
            spans[i].innerHTML = spans[i].innerHTML.replace(`${lbl}..[result]`, text);
        }
    }
}

function println(text, color) {
    if (text == undefined) text = '';
    print(text+'<br/>', color);
}

function printBlankRow() {
    if (!TestConfig.isSilent) {
        Dbg.pr('<hr style="margin-left:1em;left;width:16em;height:0px;padding:px;border-style:outset;border-width:1px;opacity:0.4" />');
    }
}

function message(text, indent) {
    println(text, [144, 160, 144]);
    if (indent) TestConfig.indent += indent;
}

function header(text) {
    TestConfig.indent++;
    println(text, [176, 200, 192]);
    TestConfig.indent++;
}

function error(text) {
    println(text, [255, 64, 64]);
}

function addButton(text, handler) {
    var button = null;
    var id = 'btn_' + TestConfig.buttonCount++;
    Dbg.prln(`<button id="${id}">${text}</button>`);
    button = document.getElementById(id);
    button.onclick = handler;

    //if (!TestConfig.isNonInteractive) {
    //}

    return button;
}

async function button(text, handler, isPermanent) {
    var isDone = false;
    handler = handler || (e => isDone = true);
    var btn = addButton(text, handler);
    var timer = null;
    if (TestConfig.isNonInteractive) {
        timer = setTimeout( () => isDone = true, 2000);
    }
    await poll( () => isDone, 10);
    clearTimeout(timer);
    if (!isPermanent) {
        btn.parentNode.removeChild(btn);
        btn = null;
    }
    if (btn) btn.innerHTML = 'Done';
    return btn;
}

async function test(lbl, action) {
    lbl = Html.encode(lbl);
    println(lbl + '..[result]', [208, 208, 128]);
    TestConfig.indent++;
    var result = null;
    var context = new test_context(lbl);
    try {
        result = action.constructor.name != 'AsyncFunction' ? action(context) : await action(context);
    } catch (err) {
        result = err;
        this.hasErrors = true;
    }
    if (context.errors > 0) this.hasErrors = true;

    if (result instanceof Promise) {
        TestConfig.pending++;
        result.lbl = lbl;
//console.log('111')
        result.then(
            value => { console.log('222'); TestConfig.pending--; print_result(context, value); },
            error => { debugger; this.hasErrors = true; TestConfig.pending--; print_result(context, error); }
        );
    } else {
        print_result(context, result);
    }
    TestConfig.indent--;
//console.log('333')
}

async function measure(lbl, action, batchSize) {
    batchSize = batchSize || 100;
    var count = 0;
    var duration = 0;
    var lastTick = 0;
    print(`<span style="color:#f0e080">Measuring ${lbl}</span>`);
    var start = new Date().getTime();
    var iteration = 0;
    await poll( () => {
        for (var i=0; i<batchSize; i++) action(iteration++, i);
        count += batchSize;
        duration = new Date().getTime() - start;
        if (duration < 1000) {
            var tick = Math.floor(duration/100);
            if (tick > lastTick) {
                if (!TestConfig.isSilent) Dbg.pr('.');
                lastTick = tick;
            }
            return false;
        } else {
            if (!TestConfig.isSilent) Dbg.prln('done');
            return true;
        }
    }, 5);  
    if (!TestConfig.isSilent) {
        Dbg.prln(`<span style="color:#f0e080">${count} iterations took <b>${duration}ms</b> (avg: ${(duration/count).toPrecision(4)})</span>`);
    }
}

function test_context(lbl) {
    this.lbl = lbl;
    this.errors = 0;
}

function deepCompare(a, b, path) {
    path = path || '';
    var result = null;
    if (a == null && b == null) result = null;
    else if (a == null && b != null) result = `${path} [null ! b]`;
    else if (a != null && b == null) result = `${path} [a ! null]`;
    else if (typeof a !== typeof b)  result = `${path} [type a (${typeof a}) ! type b (${typeof a})]`;
    else if (a instanceof ArrayBuffer) {
        var va = new DataView(a);
        var vb = new DataView(b);
        for (var i=0; i<va.byteLength; i++) {
            if (va.getInt8(i) != vb.getInt8(i)) {
                result = `${path} a[${i}] ! b[${i}]`;
                break;
            }
        }
    } else if (typeof a === 'object' || Array.isArray(a)) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        if (keysA.length !== keysB.length) result = `${path} [keys a (${keysA.length}) ! keys b (${keysB.length})]`;
        else {
            for (var i=0; i<keysA.length; i++) {
                result = deepCompare(a[keysA[i]], b[keysA[i]], `${path}.${keysA[i]}`);
                if (result) {
                    break;
                }
            }
        }
    } else {
        result = equals(a, b) ? null : `${path} [${a} ! ${b}]`;
    }
    return result;
}

function _testDeepCompare(a, b) {
    console.log(`${JSON.stringify(a)}\n${JSON.stringify(b)}\n => ${deepCompare(a, b)}`)
}

function testDeepCompare() {
    var obj = {'a': 1, 'b':[1,2,3], 'c': { 'a': 2, 'b': 'B'}};
    var obj2 = {'c': 3, 'o': obj };
    var obj3 = {'a': 1, 'b':[1,2,3], 'c': null};
    _testDeepCompare('a', 'b');
    _testDeepCompare('b', 'b');
    _testDeepCompare(1, 2);
    _testDeepCompare(1, 1);
    _testDeepCompare(null, null);
    _testDeepCompare(obj, null);
    _testDeepCompare(null, obj);
    _testDeepCompare(obj, obj);
    _testDeepCompare(obj, obj2);
    _testDeepCompare(obj2, obj2);
    _testDeepCompare(obj2.o, obj2);
    _testDeepCompare(obj2.o, obj);
    _testDeepCompare(obj, obj3);
    var buf1 = new ArrayBuffer(128);
    var vb1 = new DataView(buf1);
    var buf2 = new ArrayBuffer(128);
    var vb2 = new DataView(buf2);
    for (var i=0; i<128; i++) {
        vb1.setUint8(i, i);
        vb2.setUint8(i, i);
    }
    _testDeepCompare(buf1, buf2);
    vb2.setUint8(10, 200);
    _testDeepCompare(buf1, buf2);
}

function testEquals() {
    var values = [undefined/10, null, undefined, 0, 1, '', '1', true,  false, [], [1,2], {}, {a:'a', b:'b'}];
    for (var i=0; i<values.length; i++) {
        var a = values[i];
        // console.log(values[i], equals(a, values[i]));
    }
}

function equals(a, b) {
    return a == b || typeof a === 'number' && isNaN(a) && typeof b === 'number' && isNaN(b);
}

function isEmpty(a) {
    return typeof a === 'object' && Object.keys(a).length == 0 || Array.isArray(a) && a.length == 0;
}

function approx(a, b, precision) {
    precision = precision || Number.EPSILON;
    if (typeof a != 'number') a = parseFloat(a);
    if (typeof b != 'number') b = parseFloat(b);
    return (!isNaN(a) && !isNaN(b)) ? Math.abs(a-b) <= precision : false;
}

test_context.prototype.assert = function assert(value, operator, expected) {
    if (operator == undefined) {
        var err = new Error();
        var tokens = err.stack.split('\n');
        error(`Assertion failed ${tokens[2].replace(/[<>&]/g, v => ({'<':'&lt;', '>':'&gt;', '&':'&amp;'}[v]))}`);
        this.errors++;
    } else {
        var op = TestConfig.assertion_operators[operator];
        if (op) {
            var result = op.action(value, expected);
            if (operator == ':=') {
                if (result != null) {
                    var err = new Error();
                    var tokens = err.stack.split('\n');
                    error(`<b>${result}</b> should match! ${tokens[2].replace(/[<>&]/g, v => ({'<':'&lt;', '>':'&gt;', '&':'&amp;'}[v]))}`);
                    this.errors++;
                }
            } else if (!result) {
                var err = new Error();
                var tokens = err.stack.split('\n');
                var expectedText = expected !== undefined ? ` <b>${expected}</b>` : '';
                if (typeof value === 'object') value = '<i>Received value</i>';
                error(`<b>${value}</b> should ${op.term}${expectedText}! ${tokens[2].replace(/[<>&]/g, v => ({'<':'&lt;', '>':'&gt;', '&':'&amp;'}[v]))}`);
                this.errors++;
            }
        } else throw new Error(`Unknown assertion operator '${operator}'!`);
    }
};

async function run_test(testUrl) {
    message(`Load '${testUrl}'`);
    var path = Url.relative(baseUrl, testUrl);
    path = path.substr(0, path.lastIndexOf('/'));
    var appUrl = self.appUrl;
    self.appUrl = new Url(path);
    var module = await load(testUrl.toString());
    await load(new Url(`${path}/test.css`).toString());
    if (module && module.error == null && module.symbols != null) {
        var testName = Object.keys(module.symbols)[0];
        var test = module.symbols[testName];
        if (typeof test === 'function') {
            message(`<b>Running '<i>${testName}</i>'...</b>`);
            var tests = test();
            var errors = 0;
            for (var i=0; i<tests.length; i++) {
                if (typeof tests[i] === 'function') {
                    var indent = TestConfig.indent;
                    try {
                        var context = { hasError:false };
                        await tests[i].call(context);
                        if (context.hasError) errors++;
                    } catch (err) {
                        TestConfig.indent = indent;
                        error('Test raised an error!');
                        error(`<pre>${err}</pre>`);
                        errors++;
                        console.error(err);
                    }
                    TestConfig.indent = indent;
                }
                //TestConfig.indent = 0;
                printBlankRow();
            }
            poll( () => {
                if (TestConfig.pending == 0) {
                    message('<b>Test finished</b>');
                    return true;
                }
            }, 100);            
        }
    } else {
        message(`Error loading ${module.error}`, );
    }
    self.appUrl = appUrl;

    return errors == 0;
}

async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

    //testDeepCompare();
    //testEquals();
    var url = new Url(location.href);
    var testUrl = new Url(`${url.fragment}/test.js`);
    run_test(testUrl);
}