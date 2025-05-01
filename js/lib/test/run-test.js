import { getConsole, Colors } from '../console/console.js'
import Test from './test.js'
import { Url } from '../loader/url.js'

let _cons = null;
let _errors = 0;
let _total = 0;

// async function readTestUrl() {
//     let url = null;
//     let frag = new Url(location.href);
//     url = new Url(frag.origin);
//     url.pathname = frag.hash.substring(1);
//     return url;
// }

async function main() {
    _cons = await getConsole('cons');
    _errors = 0;
    _total = 0;

    let url = null;
    if (typeof window === 'undefined') {
        if (process.argv.length > 2) {
            url = new Url(process.argv[2]);
        } else {
            _cons.writeln('*** Usage: node[.exe] run-test.js <path of test class>');
        }
    } else {
        let frag = new Url(location.href);
        url = new Url(frag.origin);
        url.pathname = frag.hash.substring(1);
    }

    if (!url.pathname.endsWith('.js')) url.pathname += '.js';

    _cons.writeln(`*** Load tests from: ${url}`);

    let test = null;
    try {
        let mdl = await import(url);
        let names = Object.getOwnPropertyNames(mdl);
        for (let name of names) {
            let sym = mdl[name];
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
if (typeof window === 'undefined') {
    main();
} else {
    window.addEventListener('hashchange', main);
    window.addEventListener('load', main);
}