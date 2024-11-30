import { getConsole, Colors } from '/lib/console/console.js'
import { Test } from './test.js'
import { Url } from '/lib/loader/url.js'

var _cons = null;
var _errors = 0;
var _total = 0;

async function main() {
    _cons = await getConsole('cons');
    _errors = 0;
    _total = 0;

    var url = null;
    if (typeof window === 'undefined') {
        if (process.argv.length > 2) {
            url = new Url(process.argv[2]);
        } else {
            _cons.writeln('*** Usage: node[.exe] run-test.js <path of test class>');
        }
    } else {
        var frag = new Url(location.href);
        url = new Url(frag.origin);
        url.pathname = frag.hash.substring(1);
    }

    if (!url.pathname.endsWith('.js')) url.pathname += '.js';

    _cons.writeln(`*** Load tests from: ${url}`);

    var test = null;
    try {
        var mdl = await import(url);
        var names = Object.getOwnPropertyNames(mdl);
        for (var name of names) {
            var sym = mdl[name];
            if (sym && sym.prototype instanceof Test) {
                _cons.writeln(`*** Found test class '${sym.name}'\n`);
                test = Reflect.construct(sym, []);
                await test.runAll();
                _errors += test.errors;
                _total += test.total;
            }
        }

        if (_total > 0) {    
            _cons.writeln('\n*** Total results');
            Test.report(_errors, _total, _cons);
        } else {
            _cons.writeln('No valid test class found!');
        }
    } catch (err) {
        _cons.error(err);
    }
}

typeof window === 'undefined' ? main() : window.onload = main;