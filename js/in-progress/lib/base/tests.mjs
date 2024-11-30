import { getConsole } from './console/console.mjs'
import { Test } from '../../../lib/test/test.mjs'
import { ConsoleTests } from './console/console-tests.mjs'
import { PathTests } from './loader/path-tests.mjs'
import { UrlTests } from './loader/url-tests.mjs'
import { LoaderTests } from './loader/loader-tests.mjs'

var cons = null;
const DocumentRoot = '/d/code/git/webdev/';

var values = [
    Boolean, false,
    Number, 1,
    BigInt, 1,
    String, 'hello',
    Object, {}
];

var bigint = new Boolean(true);
bigint.__type__ = 'baka';
console.log(bigint.valueOf());

for (var vi=0; vi<values.length;) {
    console.log(values[vi]);
    var v = values[vi++](values[vi++]);
    console.log('********');
    console.log('type: ' + typeof v);
    console.log('value: ' + v);
}

// async function main() {
//     cons = await getConsole('cons');
//     cons.writeln('*** Base tests');
//     var test = null;
//     var errors = 0;
//     var total = 0;

//     // test = new ConsoleTests(cons);
//     // await test.runAll();
//     // errors += test.errors;
//     // total += test.total;

//     test = new PathTests(cons);
//     await test.runAll();
//     errors += test.errors;
//     total += test.total;

//     test = new UrlTests(cons);
//     await test.runAll();
//     errors += test.errors;
//     total += test.total;

//     test = new LoaderTests(cons);
//     await test.runAll();
//     errors += test.errors;
//     total += test.total;

//     cons.writeln('\n*** Total results');
//     Test.report(errors, total, cons);

//     cons.writeln('*** Done');
// }

// typeof window === 'undefined' ? main() : window.onload = main;
